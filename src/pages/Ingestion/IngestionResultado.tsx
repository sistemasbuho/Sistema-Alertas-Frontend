import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Modal from '@shared/components/ui/Modal';
import { useToast } from '@shared/contexts/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import AlertModal, { AlertaData } from '@shared/components/ui/AlertModal';
import {
  DataTable,
  DataFilters,
  DataPagination,
} from '@/pages/ConsultaDatos/components';
import {
  getIngestionResults,
  enviarAlertasAPI,
  type IngestionResultItem,
  type EnvioAlertaRequest,
} from '@shared/services/api';

const DEFAULT_PROJECT_ID = 'a986a5c3-f710-4603-814f-22cb4af5ed21';

type FilterState = {
  filters: {
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
    estado_enviado?: string;
  };
  updateFilters: (newFilters: Record<string, string>) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
};

type MediosItem = {
  id: string;
  titulo: string;
  contenido: string;
  url: string;
  autor: string;
  reach: number;
  engagement: number | null;
  fecha_publicacion: string;
  created_at: string;
  estado_revisado: string;
  proyecto: string;
  proyecto_nombre: string;
  proyecto_keywords: string[];
  emojis: string[];
  mensaje?: string;
  mensaje_formateado?: string | null;
  emojis_only?: string;
  tipo?: string | null;
  red_social?: string | null;
};

type IngestionSummary = {
  archivo: {
    nombre: string;
    proyecto: string;
    cargadoPor: string;
    fecha: string;
    filas: number;
  };
  resumen: {
    procesados: number;
    medios: number;
    redes: number;
    duplicados: number;
    descartados: number;
    duracion: string;
  };
  incidencias: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    tipo: 'warning' | 'error';
  }>;
};

type IngestionNavigationState = {
  ingestionResponse?: {
    mensaje?: string;
    listado?: IngestionResultItem[];
    errores?: unknown[];
    proyecto_keywords?: string[];
    duplicados?: number;
    descartados?: number;
    proveedor?: string;
  };
  multipleResults?: Array<{
    file: string;
    response?: any;
    error?: any;
    success: boolean;
  }>;
  projectId?: string;
  projectName?: string | null;
  isMultipleFiles?: boolean;
};

const buildFilterState = (
  values: {
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
    estado_enviado?: string;
  },
  setter: React.Dispatch<
    React.SetStateAction<{
      proyecto_nombre?: string;
      autor?: string;
      url?: string;
      estado_enviado?: string;
    }>
  >,
  onFiltersChange?: () => void
): FilterState => {
  return {
    filters: values,
    updateFilters: (newFilters) => {
      setter((prev) => ({ ...prev, ...newFilters }));
      onFiltersChange?.();
    },
    clearFilters: () => {
      setter({ proyecto_nombre: '', autor: '', url: '', estado_enviado: '' });
      onFiltersChange?.();
    },
    hasActiveFilters: () =>
      Object.values(values).some(
        (value) => value !== undefined && value.trim() !== ''
      ),
  };
};

const normalizeIngestionItem = (
  item: IngestionResultItem,
  fallbackProjectId: string
): MediosItem => {
  const parsedDate = item.fecha ? new Date(item.fecha) : new Date();
  const baseDate = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();

  return {
    id: item.id,
    titulo:
      item.titulo?.trim() ||
      (item.contenido
        ? `${item.contenido.slice(0, 80)}…`
        : 'Sin título disponible'),
    contenido: item.contenido || '',
    url: item.url || '',
    autor: item.autor || 'Sin autor',
    reach: item.reach ?? 0,
    engagement: item.engagement ?? null,
    fecha_publicacion: baseDate,
    created_at: baseDate,
    estado_revisado: 'Pendiente',
    proyecto: item.proyecto || fallbackProjectId,
    proyecto_nombre:
      item.proyecto_nombre ||
      item.proyecto ||
      (fallbackProjectId
        ? `Proyecto ${fallbackProjectId.slice(0, 8)}`
        : 'Proyecto sin nombre'),
    proyecto_keywords: item.proyecto_keywords || [],
    emojis: item.emojis || [],
    mensaje: item.mensaje || item.contenido || '',
    mensaje_formateado: item.mensaje_formateado || null,
    emojis_only: '',
    tipo: item.tipo || null,
    red_social: item.red_social || null,
  };
};

const IngestionResultado: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const hasShownSuccessMessage = useRef(false);
  const navigationState =
    (location.state as IngestionNavigationState | undefined) ?? undefined;
  const stateProjectId = navigationState?.projectId ?? undefined;
  const stateProjectName = navigationState?.projectName ?? null;
  const ingestionResponseFromState = navigationState?.ingestionResponse;
  const hasIngestionResponse = Boolean(
    ingestionResponseFromState?.listado &&
      ingestionResponseFromState.listado.length > 0
  );
  const [searchParams] = useSearchParams();
  const initialProjectId =
    stateProjectId || searchParams.get('proyecto') || DEFAULT_PROJECT_ID;

  const [projectId] = useState(initialProjectId);
  const [reloadToken] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [medios, setMedios] = useState<MediosItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>(
    'all'
  );
  const [customText, setCustomText] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediosItem | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);
  const [isAlertLoading, setIsAlertLoading] = useState(false);
  const [isEnviandoAlertas, setIsEnviandoAlertas] = useState(false);
  const [alertProgress, setAlertProgress] = useState({
    current: 0,
    total: 0,
    message: '',
  });
  const [showSummaryCards, setShowSummaryCards] = useState(false);

  const [filtersValues, setFiltersValues] = useState<{
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
    estado_enviado?: string;
  }>({
    proyecto_nombre: '',
    autor: '',
    url: '',
    estado_enviado: '',
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const extractErrorMessage = useCallback((error: unknown) => {
    if (error && typeof error === 'object') {
      const maybeResponse = (
        error as {
          response?: { data?: { message?: string } };
        }
      ).response;

      if (maybeResponse?.data?.message) {
        return maybeResponse.data.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'No fue posible obtener los resultados de la ingestión.';
  }, []);

  useEffect(() => {
    if (!hasIngestionResponse || !ingestionResponseFromState) {
      return;
    }

    const fallbackProjectId = stateProjectId || projectId || DEFAULT_PROJECT_ID;
    const fallbackProjectName = stateProjectName || undefined;

    const normalizedData = ingestionResponseFromState.listado?.map((item) => {
      const enrichedItem: IngestionResultItem = {
        ...item,
        proyecto_nombre:
          item.proyecto_nombre || fallbackProjectName || undefined,
        proyecto_keywords: ingestionResponseFromState.proyecto_keywords || [],
      };

      const normalized = normalizeIngestionItem(
        enrichedItem,
        fallbackProjectId
      );

      if (fallbackProjectName) {
        normalized.proyecto_nombre = fallbackProjectName;
      }

      return normalized;
    });

    setMedios(normalizedData ?? []);
    setSelectedItems([]);
    setSearchTerm('');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFetchError(null);
    setIsLoadingData(false);

    if (ingestionResponseFromState.mensaje && !hasShownSuccessMessage.current) {
      showSuccess('Ingestión completada', ingestionResponseFromState.mensaje);
      hasShownSuccessMessage.current = true;
    }
  }, [
    hasIngestionResponse,
    ingestionResponseFromState,
    stateProjectId,
    stateProjectName,
  ]);

  useEffect(() => {
    let isSubscribed = true;

    if (hasIngestionResponse) {
      return () => {
        isSubscribed = false;
      };
    }

    if (!projectId) {
      setMedios([]);
      setFetchError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoadingData(true);
      setFetchError(null);

      try {
        const data = await getIngestionResults(projectId);
        if (!isSubscribed) return;

        const normalizedData = data.map((item) =>
          normalizeIngestionItem(item, projectId)
        );

        setMedios(normalizedData);
        setSelectedItems([]);
        setSearchTerm('');
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
      } catch (error: unknown) {
        if (!isSubscribed) return;

        console.error('Error al consultar resultados de ingestión:', error);
        const message = extractErrorMessage(error);

        setMedios([]);
        setFetchError(message);
        showError('Error al consultar ingestión', message);
      } finally {
        if (isSubscribed) {
          setIsLoadingData(false);
        }
      }
    };

    void fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [
    hasIngestionResponse,
    projectId,
    reloadToken,
    showError,
    extractErrorMessage,
  ]);

  const filters = useMemo(
    () =>
      buildFilterState(filtersValues, setFiltersValues, () =>
        setPagination((prev) => ({ ...prev, currentPage: 1 }))
      ),
    [filtersValues]
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'Error en fecha';
    }
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(num);

  const highlightKeywords = (
    text: string | null | undefined,
    keywords: string[] = []
  ) => {
    const safeText = text ?? '';
    if (!safeText) return '';
    if (!keywords || keywords.length === 0) return safeText;

    let highlightedText = safeText;

    keywords.forEach((keyword) => {
      if (keyword && keyword.trim()) {
        const regex = new RegExp(`(${keyword.trim()})`, 'gi');
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded">$1</mark>'
        );
      }
    });

    return highlightedText;
  };

  const applyFilters = useCallback(
    (
      data: MediosItem[],
      filtersToApply: {
        proyecto_nombre?: string;
        autor?: string;
        url?: string;
        estado_enviado?: string;
      }
    ) => {
      return data.filter((item) => {
        const matchesProyecto = filtersToApply.proyecto_nombre
          ? item.proyecto_nombre
              .toLowerCase()
              .includes(filtersToApply.proyecto_nombre.toLowerCase())
          : true;
        const matchesAutor = filtersToApply.autor
          ? item.autor
              .toLowerCase()
              .includes(filtersToApply.autor.toLowerCase())
          : true;
        const matchesUrl = filtersToApply.url
          ? item.url.toLowerCase().includes(filtersToApply.url.toLowerCase())
          : true;
        const matchesEstadoEnviado = filtersToApply.estado_enviado
          ? filtersToApply.estado_enviado === 'true'
            ? item.estado_revisado === 'Enviado'
            : item.estado_revisado !== 'Enviado'
          : true;

        return (
          matchesProyecto && matchesAutor && matchesUrl && matchesEstadoEnviado
        );
      });
    },
    []
  );

  const applySearch = useCallback(
    (data: MediosItem[]) => {
      if (!searchTerm.trim()) return data;

      const search = searchTerm.toLowerCase();

      return data.filter((item) => {
        return (
          (item.titulo ? item.titulo.toLowerCase().includes(search) : false) ||
          item.contenido.toLowerCase().includes(search) ||
          item.url.toLowerCase().includes(search) ||
          item.autor.toLowerCase().includes(search) ||
          item.proyecto_nombre.toLowerCase().includes(search)
        );
      });
    },
    [searchTerm]
  );

  const filteredMedios = useMemo(() => {
    const withFilters = applyFilters(medios, filtersValues);
    return applySearch(withFilters);
  }, [applyFilters, applySearch, medios, filtersValues]);

  const paginatedMedios = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredMedios.slice(start, end);
  }, [filteredMedios, pagination]);

  const paginationState = useMemo(
    () => ({
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      count: filteredMedios.length,
      previous: pagination.currentPage > 1 ? 'prev' : null,
      next:
        pagination.currentPage * pagination.pageSize < filteredMedios.length
          ? 'next'
          : null,
    }),
    [filteredMedios.length, pagination]
  );

  const ingestionSummary: IngestionSummary = useMemo(() => {
    const totalItems = medios.length;
    const totalRedes = medios.filter(
      (item) => item.red_social || item.tipo?.toLowerCase() === 'red'
    ).length;
    const totalMedios = totalItems - totalRedes;

    const latestDate = medios.reduce<string | null>((latest, item) => {
      const itemDate = item.fecha_publicacion;
      if (!itemDate) return latest;
      if (!latest) return itemDate;
      return new Date(itemDate) > new Date(latest) ? itemDate : latest;
    }, null);

    const proyectoNombre =
      medios[0]?.proyecto_nombre ||
      (projectId ? `Proyecto ${projectId.slice(0, 8)}` : 'Proyecto sin nombre');

    let duplicadosFromAPI = ingestionResponseFromState?.duplicados ?? 0;
    let descartadosFromAPI = ingestionResponseFromState?.descartados ?? 0;

    const multipleResults = navigationState?.multipleResults;
    if (multipleResults && multipleResults.length > 0) {
      const totalDuplicados = multipleResults.reduce((sum, result) => {
        return sum + (result.response?.duplicados ?? 0);
      }, 0);
      const totalDescartados = multipleResults.reduce((sum, result) => {
        return sum + (result.response?.descartados ?? 0);
      }, 0);

      duplicadosFromAPI = totalDuplicados;
      descartadosFromAPI = totalDescartados;
    }

    return {
      archivo: {
        nombre: 'Archivo de ingestión',
        proyecto: proyectoNombre,
        cargadoPor: '-',
        fecha: latestDate || new Date().toISOString(),
        filas: totalItems + duplicadosFromAPI + descartadosFromAPI,
      },
      resumen: {
        procesados: totalItems,
        medios: totalMedios,
        redes: totalRedes,
        duplicados: duplicadosFromAPI,
        descartados: descartadosFromAPI,
        duracion: '-',
      },
      incidencias: [],
    };
  }, [medios, projectId, ingestionResponseFromState]);

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentIds = paginatedMedios.map((item) => item.id);
    const allSelected = currentIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      setSelectedItems((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleOpenEmojiPicker = (target: string | 'all') => {
    if (target === 'all' && selectedItems.length === 0) {
      return;
    }
    setEmojiPickerTarget(target);
    setShowEmojiPicker(true);
  };

  const handleEmojiClick = (emojiData: EmojiClickData, _event: MouseEvent) => {
    const emojiContent = customText.trim()
      ? `${emojiData.emoji} ${customText.trim()}`
      : emojiData.emoji;

    console.log('DEBUG - customText:', `"${customText}"`);
    console.log('DEBUG - emojiContent:', `"${emojiContent}"`);
    console.log('DEBUG - emojiData.emoji:', `"${emojiData.emoji}"`);

    if (emojiPickerTarget === 'all') {
      setMedios((prev) =>
        prev.map((item) => {
          if (selectedItems.includes(item.id)) {
            const newEmojis = [...(item.emojis || []), emojiContent];
            const emojisOnly = newEmojis.join(' ');
            console.log('DEBUG - newEmojis:', newEmojis);
            console.log('DEBUG - emojisOnly final:', `"${emojisOnly}"`);
            return {
              ...item,
              emojis: newEmojis,
              mensaje_formateado:
                newEmojis.length > 0
                  ? `${emojisOnly} ${item.mensaje || item.contenido}`
                  : item.mensaje || item.contenido,
              emojis_only: emojisOnly,
            };
          }
          return item;
        })
      );
    } else if (emojiPickerTarget) {
      setMedios((prev) =>
        prev.map((item) => {
          if (item.id === emojiPickerTarget) {
            const newEmojis = [...(item.emojis || []), emojiContent];
            const emojisOnly = newEmojis.join(' ');
            return {
              ...item,
              emojis: newEmojis,
              mensaje_formateado:
                newEmojis.length > 0
                  ? `${emojisOnly} ${item.mensaje || item.contenido}`
                  : item.mensaje || item.contenido,
              emojis_only: emojisOnly,
            };
          }
          return item;
        })
      );
    }

    setCustomText('');
    setShowEmojiPicker(false);
  };

  const handleAddCustomTextOnly = () => {
    if (!customText.trim()) return;

    if (emojiPickerTarget === 'all') {
      setMedios((prev) =>
        prev.map((item) => {
          if (selectedItems.includes(item.id)) {
            const newEmojis = [...(item.emojis || []), customText.trim()];
            const emojisOnly = newEmojis.join(' ');
            return {
              ...item,
              emojis: newEmojis,
              mensaje_formateado:
                newEmojis.length > 0
                  ? `${emojisOnly} ${item.mensaje || item.contenido}`
                  : item.mensaje || item.contenido,
              emojis_only: emojisOnly,
            };
          }
          return item;
        })
      );
    } else if (emojiPickerTarget) {
      setMedios((prev) =>
        prev.map((item) => {
          if (item.id === emojiPickerTarget) {
            const newEmojis = [...(item.emojis || []), customText.trim()];
            const emojisOnly = newEmojis.join(' ');
            return {
              ...item,
              emojis: newEmojis,
              mensaje_formateado:
                newEmojis.length > 0
                  ? `${emojisOnly} ${item.mensaje || item.contenido}`
                  : item.mensaje || item.contenido,
              emojis_only: emojisOnly,
            };
          }
          return item;
        })
      );
    }

    setCustomText('');
    setShowEmojiPicker(false);
  };

  const handleRemoveEmoji = (itemId: string, emojiIndex: number) => {
    setMedios((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newEmojis = item.emojis.filter(
            (_, index) => index !== emojiIndex
          );
          const emojisOnly = newEmojis.join(' ');
          return {
            ...item,
            emojis: newEmojis,
            mensaje_formateado:
              newEmojis.length > 0
                ? `${emojisOnly} ${item.mensaje || item.contenido}`
                : item.mensaje || item.contenido,
            emojis_only: emojisOnly,
          };
        }
        return item;
      })
    );
  };

  const handlePreviewItem = (item: MediosItem) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  const handleEditItem = (item: MediosItem) => {
    setEditingAlert(item);
    setIsAlertModalOpen(true);
  };

  const handleCloseAlertModal = () => {
    setIsAlertModalOpen(false);
    setEditingAlert(null);
  };

  const handleSaveAlert = async (alertData: AlertaData) => {
    setIsAlertLoading(true);

    try {
      if (editingAlert) {
        const currentData = medios;
        const updatedData = currentData.map((item) =>
          item.id === editingAlert.id ? { ...item, ...alertData } : item
        );

        setMedios(updatedData);

        showSuccess(
          'Elemento actualizado',
          'El elemento se ha actualizado correctamente'
        );

        handleCloseAlertModal();
      }
    } catch (error: any) {
      showError(
        'Error al actualizar',
        error.response?.data?.message || 'No se pudo actualizar el elemento'
      );
    } finally {
      setIsAlertLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewItem(null);
  };

  const handleMarkReviewed = () => {
    if (selectedItems.length === 0) return;

    setMedios((prev) =>
      prev.map((item) =>
        selectedItems.includes(item.id)
          ? { ...item, estado_revisado: 'Revisado' }
          : item
      )
    );

    setSelectedItems([]);
    showSuccess(
      'Registros actualizados',
      'Los contenidos fueron marcados como revisados.'
    );
  };

  const handlePreviousPage = () => {
    if (paginationState.previous) {
      setPagination((prev) => ({
        ...prev,
        currentPage: Math.max(1, prev.currentPage - 1),
      }));
    }
  };

  const handleNextPage = () => {
    if (paginationState.next) {
      setPagination((prev) => ({
        ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ currentPage: 1, pageSize });
  };

  const handleEnviarAlertasAPI = async () => {
    if (selectedItems.length === 0) {
      showError(
        'Sin selección',
        'Debes seleccionar al menos una alerta para enviar'
      );
      return;
    }

    const selectedData = filteredMedios.filter((item) =>
      selectedItems.includes(item.id)
    );

    if (!projectId) {
      showError('Error de configuración', 'No se ha seleccionado un proyecto');
      return;
    }

    const hasRedSocial = selectedData.some(
      (item) => item.tipo?.toLowerCase() === 'redes'
    );
    const tipoAlerta = hasRedSocial ? 'redes' : 'medios';

    try {
      setIsEnviandoAlertas(true);
      setAlertProgress({
        current: 0,
        total: selectedData.length,
        message: 'Preparando alertas...',
      });

      const projectKeywords =
        selectedData.length > 0
          ? selectedData[0]?.proyecto_keywords || []
          : ingestionResponseFromState?.proyecto_keywords || [];

      const payload: EnvioAlertaRequest = {
        proyecto_id: projectId,
        tipo_alerta: tipoAlerta,
        enviar: true,
        keywords: projectKeywords,
        alertas: selectedData.map((item) => ({
          id: item.id,
          url: item.url,
          contenido: item.contenido,
          fecha: item.fecha_publicacion || new Date().toISOString(),
          titulo: item.titulo || '',
          autor: item.autor || '',
          reach: item.reach || null,
          engagement: item.engagement || null,
          emojis: item.emojis_only || '',
        })),
      };

      setAlertProgress((prev) => ({
        ...prev,
        message: 'Enviando alertas al servidor...',
      }));

      const result = await enviarAlertasAPI(payload);

      const totalEnviadas = selectedData.length;

      setAlertProgress((prev) => ({
        ...prev,
        current: totalEnviadas,
        message: 'Finalizando envío...',
      }));

      if (result.success) {
        setAlertProgress((prev) => ({
          ...prev,
          current: prev.total,
          message: 'Alertas enviadas correctamente',
        }));

        showSuccess(
          'Alertas enviadas correctamente',
          `Total enviadas: ${totalEnviadas}`
        );

        setSelectedItems([]);

        setTimeout(() => {
          navigate('/ingestion');
        }, 2000);
      } else {
        setAlertProgress((prev) => ({
          ...prev,
          message: 'Error en el envío',
        }));

        showError(
          'Error al enviar',
          result.message || 'No se pudieron enviar las alertas'
        );
      }
    } catch (error: any) {
      console.error('Error enviando alertas:', error);

      setAlertProgress((prev) => ({
        ...prev,
        message: 'Error en el envío',
      }));

      showError(
        'Error al enviar',
        error.message || 'No se pudieron enviar las alertas'
      );
    } finally {
      setIsEnviandoAlertas(false);
      setTimeout(() => {
        setAlertProgress({ current: 0, total: 0, message: '' });
      }, 2000);
    }
  };

  return (
    <DashboardLayout title="Resultados de ingestión">
      <div className="space-y-4">
        {(stateProjectName || ingestionSummary.archivo.proyecto) && (
          <Card>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Proyecto:{' '}
                    {stateProjectName || ingestionSummary.archivo.proyecto}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Resultados de la ingestión para este proyecto
                  </p>
                </div>
                {stateProjectId && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID del proyecto
                    </p>
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {stateProjectId}
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => setShowSummaryCards(!showSummaryCards)}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            {showSummaryCards ? (
              <>
                <XMarkIcon className="h-4 w-4" />
                Ocultar resumen
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                Mostrar resumen
              </>
            )}
          </Button>
        </div>

        {showSummaryCards && (
          <div className="grid gap-2 md:grid-cols-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <Card.Content className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/40">
                    <DocumentArrowUpIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Archivo cargado
                    </p>
                    <h3
                      className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]"
                      title={ingestionSummary.archivo.nombre}
                    >
                      {ingestionSummary.archivo.nombre}
                    </h3>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {ingestionSummary.archivo.filas} registros
                  </span>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-green-100 dark:bg-green-900/40">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Procesados
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ingestionSummary.resumen.procesados}
                    </h3>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Medios
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ingestionSummary.resumen.medios}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Redes
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ingestionSummary.resumen.redes}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/40">
                    <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Observaciones
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ingestionSummary.resumen.duplicados +
                        ingestionSummary.resumen.descartados}
                    </h3>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Duplicados
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ingestionSummary.resumen.duplicados}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Descartados
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ingestionSummary.resumen.descartados}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/40">
                    <ClockIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tiempo
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ingestionSummary.resumen.duracion}
                    </h3>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="text-gray-600 dark:text-gray-400">
                    Por:{' '}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {ingestionSummary.archivo.cargadoPor}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {formatDate(ingestionSummary.archivo.fecha)}
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        )}

        {ingestionSummary.incidencias.length > 0 && (
          <Card>
            <Card.Header>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Incidencias detectadas durante la ingestión
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Revisa y resuelve las observaciones antes de publicar los
                  contenidos.
                </p>
              </div>
            </Card.Header>
            <Card.Content className="space-y-4">
              {ingestionSummary.incidencias.map((incidencia) => (
                <div
                  key={incidencia.id}
                  className={`rounded-lg border p-4 ${
                    incidencia.tipo === 'error'
                      ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon
                      className={`w-5 h-5 ${
                        incidencia.tipo === 'error'
                          ? 'text-red-600 dark:text-red-300'
                          : 'text-amber-600 dark:text-amber-300'
                      }`}
                    />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {incidencia.titulo}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {incidencia.descripcion}
                  </p>
                </div>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card>
          <Card.Content className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar registros..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filtros
                    {filters.hasActiveFilters() && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {
                          Object.values(filters.filters).filter(
                            (value) => value && value.trim() !== ''
                          ).length
                        }
                      </span>
                    )}
                  </Button>
                  {selectedItems.length > 0 && (
                    <>
                      <Button
                        onClick={() => handleOpenEmojiPicker('all')}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Agregar emoji
                      </Button>
                      <Button
                        onClick={handleMarkReviewed}
                        variant="outline"
                        className="inline-flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 dark:bg-green-900/10 dark:hover:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Revisados
                      </Button>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleEnviarAlertasAPI}
                          disabled={isEnviandoAlertas}
                          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isEnviandoAlertas ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                              Enviar Alertas
                            </>
                          )}
                        </Button>

                        {isEnviandoAlertas && alertProgress.total > 0 && (
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {alertProgress.message}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {alertProgress.current}/{alertProgress.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{
                                  width: `${
                                    (alertProgress.current /
                                      alertProgress.total) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex flex-col gap-1">
                  <span>
                    {filteredMedios.length} registros encontrados ·{' '}
                    {selectedItems.length} seleccionados
                  </span>
                  {selectedItems.length > 0 && (
                    <div className="text-xs">
                      {(() => {
                        const projectKeywords =
                          selectedItems.length > 0
                            ? filteredMedios.find((item) =>
                                selectedItems.includes(item.id)
                              )?.proyecto_keywords || []
                            : ingestionResponseFromState?.proyecto_keywords ||
                              [];

                        return projectKeywords.length > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            Keywords a enviar: {projectKeywords.join(', ')}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            Sin keywords definidas para este proyecto
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                {filters.hasActiveFilters() && (
                  <button
                    onClick={() => {
                      filters.clearFilters();
                      setPagination((prev) => ({ ...prev, currentPage: 1 }));
                    }}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {showFilters && (
                <DataFilters
                  activeTab="medios"
                  mediosFilters={filters}
                  redesFilters={filters}
                />
              )}

              {isLoadingData ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Cargando resultados de ingestión...
                </div>
              ) : fetchError ? (
                <div className="text-center py-12 text-red-600 dark:text-red-400">
                  {fetchError}
                </div>
              ) : paginatedMedios.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {filteredMedios.length === 0
                      ? 'No se encontraron resultados con los filtros actuales.'
                      : 'No hay datos disponibles para mostrar.'}
                  </p>
                </div>
              ) : (
                <DataTable
                  activeTab="medios"
                  filteredData={paginatedMedios}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                  formatDate={formatDate}
                  formatNumber={formatNumber}
                  onAddEmoji={handleOpenEmojiPicker}
                  onRemoveEmoji={handleRemoveEmoji}
                  onEditItem={handleEditItem}
                  onPreviewItem={handlePreviewItem}
                  highlightKeywords={highlightKeywords}
                />
              )}

              <DataPagination
                activeTab="medios"
                currentData={paginatedMedios}
                pagination={paginationState}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </Card.Content>
        </Card>
      </div>

      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Agregar Emoji y Texto
              </h3>
              <Button
                onClick={() => setShowEmojiPicker(false)}
                size="sm"
                className="p-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto personalizado (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Escribe un texto personalizado..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customText.trim()) {
                      handleAddCustomTextOnly();
                      setShowEmojiPicker(false);
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    handleAddCustomTextOnly();
                    setShowEmojiPicker(false);
                  }}
                  disabled={!customText.trim()}
                  size="sm"
                  variant="outline"
                >
                  Solo Texto
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Presiona Enter o selecciona un emoji. El texto se agregará
                automáticamente.
              </p>
            </div>

            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={350}
              height={400}
            />
          </div>
        </div>
      )}

      {showPreviewModal && previewItem && (
        <Modal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          title="Vista previa del contenido"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {previewItem.mensaje_formateado ||
                  (previewItem.emojis.length > 0
                    ? `${previewItem.emojis.join(' ')} ${
                        previewItem.mensaje || previewItem.contenido
                      }`
                    : previewItem.mensaje || previewItem.contenido)}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Autor
                </p>
                <p>{previewItem.autor}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Proyecto
                </p>
                <p>{previewItem.proyecto_nombre}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  URL
                </p>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {previewItem.url}
                </a>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Fecha publicación
                </p>
                <p>{formatDate(previewItem.fecha_publicacion)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={handleCloseAlertModal}
        onSave={handleSaveAlert}
        editingAlert={editingAlert}
        isLoading={isAlertLoading}
      />
    </DashboardLayout>
  );
};

export default IngestionResultado;
