import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Modal from '@shared/components/ui/Modal';
import { useToast } from '@shared/contexts/ToastContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  DataTable,
  DataFilters,
  DataPagination,
} from '@/pages/ConsultaDatos/components';
import {
  getIngestionResults,
  type IngestionResultItem,
} from '@shared/services/api';

const DEFAULT_PROJECT_ID = 'a986a5c3-f710-4603-814f-22cb4af5ed21';

type FilterState = {
  filters: {
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
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
  };
  projectId?: string;
  projectName?: string | null;
};

const buildFilterState = (
  values: { proyecto_nombre?: string; autor?: string; url?: string },
  setter: React.Dispatch<
    React.SetStateAction<{ proyecto_nombre?: string; autor?: string; url?: string }>
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
      setter({ proyecto_nombre: '', autor: '', url: '' });
      onFiltersChange?.();
    },
    hasActiveFilters: () =>
      Object.values(values).some((value) => value !== undefined && value.trim() !== ''),
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
      (item.contenido ? `${item.contenido.slice(0, 80)}…` : 'Sin título disponible'),
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
      (fallbackProjectId ? `Proyecto ${fallbackProjectId.slice(0, 8)}` : 'Proyecto sin nombre'),
    proyecto_keywords: [],
    emojis: item.emojis || [],
    mensaje: item.mensaje || item.contenido || '',
    mensaje_formateado: item.mensaje_formateado || null,
    tipo: item.tipo || null,
    red_social: item.red_social || null,
  };
};

const IngestionResultado: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigationState =
    (location.state as IngestionNavigationState | undefined) ?? undefined;
  const stateProjectId = navigationState?.projectId ?? undefined;
  const stateProjectName = navigationState?.projectName ?? null;
  const ingestionResponseFromState = navigationState?.ingestionResponse;
  const hasIngestionResponse = Boolean(
    ingestionResponseFromState?.listado &&
      ingestionResponseFromState.listado.length > 0
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectId =
    stateProjectId || searchParams.get('proyecto') || DEFAULT_PROJECT_ID;

  const [projectIdInput, setProjectIdInput] = useState(initialProjectId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [reloadToken, setReloadToken] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [medios, setMedios] = useState<MediosItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediosItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MediosItem | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const [filtersValues, setFiltersValues] = useState<{
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
  }>({
    proyecto_nombre: '',
    autor: '',
    url: '',
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const extractErrorMessage = useCallback((error: unknown) => {
    if (error && typeof error === 'object') {
      const maybeResponse = (error as {
        response?: { data?: { message?: string } };
      }).response;

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
        proyecto_nombre: item.proyecto_nombre || fallbackProjectName || undefined,
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

    if (ingestionResponseFromState.mensaje) {
      showSuccess('Ingestión completada', ingestionResponseFromState.mensaje);
    }
  }, [
    hasIngestionResponse,
    ingestionResponseFromState,
    projectId,
    showSuccess,
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

  const highlightKeywords = (text: string, keywords: string[] = []) => {
    if (!keywords || keywords.length === 0) return text;

    let highlightedText = text;

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
      filtersToApply: { proyecto_nombre?: string; autor?: string; url?: string }
    ) => {
      return data.filter((item) => {
        const matchesProyecto = filtersToApply.proyecto_nombre
          ? item.proyecto_nombre
              .toLowerCase()
              .includes(filtersToApply.proyecto_nombre.toLowerCase())
          : true;
        const matchesAutor = filtersToApply.autor
          ? item.autor.toLowerCase().includes(filtersToApply.autor.toLowerCase())
          : true;
        const matchesUrl = filtersToApply.url
          ? item.url.toLowerCase().includes(filtersToApply.url.toLowerCase())
          : true;

        return matchesProyecto && matchesAutor && matchesUrl;
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

    return {
      archivo: {
        nombre: 'Archivo de ingestión',
        proyecto: proyectoNombre,
        cargadoPor: '-',
        fecha: latestDate || new Date().toISOString(),
        filas: totalItems,
      },
      resumen: {
        procesados: totalItems,
        medios: totalMedios,
        redes: totalRedes,
        duplicados: 0,
        descartados: 0,
        duracion: '-',
      },
      incidencias: [],
    };
  }, [medios, projectId]);

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
    const emojiValue = emojiData.emoji;

    if (emojiPickerTarget === 'all') {
      setMedios((prev) =>
        prev.map((item) =>
          selectedItems.includes(item.id)
            ? { ...item, emojis: [...item.emojis, emojiValue] }
            : item
        )
      );
    } else if (emojiPickerTarget) {
      setMedios((prev) =>
        prev.map((item) =>
          item.id === emojiPickerTarget
            ? { ...item, emojis: [...item.emojis, emojiValue] }
            : item
        )
      );
    }

    setShowEmojiPicker(false);
  };

  const handleRemoveEmoji = (itemId: string, emojiIndex: number) => {
    setMedios((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              emojis: item.emojis.filter((_, index) => index !== emojiIndex),
            }
          : item
      )
    );
  };

  const handlePreviewItem = (item: MediosItem) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  const handleEditItem = (item: MediosItem) => {
    setEditItem(item);
    setEditNotes('');
    setShowEditModal(true);
  };

  const handleSaveEdits = () => {
    if (!editItem) return;

    setMedios((prev) =>
      prev.map((item) =>
        item.id === editItem.id ? { ...item, mensaje_formateado: editNotes } : item
      )
    );

    setShowEditModal(false);
    showSuccess('Mensaje actualizado', 'Se guardaron los cambios en el contenido.');
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
    showSuccess('Registros actualizados', 'Los contenidos fueron marcados como revisados.');
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

  const handleProjectSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedId = projectIdInput.trim();
    setProjectId(trimmedId);
    setSearchParams(trimmedId ? { proyecto: trimmedId } : {});
    setReloadToken((prev) => prev + 1);
  };

  return (
    <DashboardLayout title="Resultados de ingestión">
      <div className="space-y-6">
        <Card>
          <Card.Content>
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleProjectSubmit}>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID del proyecto
                </label>
                <input
                  type="text"
                  value={projectIdInput}
                  onChange={(event) => setProjectIdInput(event.target.value)}
                  placeholder="Ej: a986a5c3-f710-4603-814f-22cb4af5ed21"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="self-start">
                  Consultar ingestión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReloadToken((prev) => prev + 1);
                  }}
                >
                  Actualizar
                </Button>
              </div>
            </form>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Mostrando resultados para el proyecto{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100 break-all">
                {projectId || 'No especificado'}
              </span>
            </p>
          </Card.Content>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <Card.Content className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <DocumentArrowUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Archivo cargado</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {ingestionSummary.archivo.nombre}
                  </h3>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Proyecto:{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {ingestionSummary.archivo.proyecto}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Registros en archivo</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ingestionSummary.archivo.filas}
                </span>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Registros procesados</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {ingestionSummary.resumen.procesados}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Medios</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ingestionSummary.resumen.medios}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Redes</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ingestionSummary.resumen.redes}
                </span>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Observaciones</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {ingestionSummary.resumen.duplicados + ingestionSummary.resumen.descartados}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Duplicados</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ingestionSummary.resumen.duplicados}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Descartados</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {ingestionSummary.resumen.descartados}
                </span>
              </div>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                  <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo de procesamiento</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {ingestionSummary.resumen.duracion}
                  </h3>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cargado por{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {ingestionSummary.archivo.cargadoPor}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Fecha de carga: {formatDate(ingestionSummary.archivo.fecha)}
              </div>
            </Card.Content>
          </Card>
        </div>

        {ingestionSummary.incidencias.length > 0 && (
          <Card>
            <Card.Header>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Incidencias detectadas durante la ingestión
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Revisa y resuelve las observaciones antes de publicar los contenidos.
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
                        {Object.values(filters.filters).filter((value) => value && value.trim() !== '').length}
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
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Marcar revisados
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {filteredMedios.length} registros encontrados · {selectedItems.length} seleccionados
                </span>
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
                <DataFilters activeTab="medios" mediosFilters={filters} redesFilters={filters} />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Seleccionar emoji
              </h3>
              <Button onClick={() => setShowEmojiPicker(false)} size="sm" className="p-2">
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            <EmojiPicker onEmojiClick={handleEmojiClick} width={350} height={400} />
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
                <p className="font-medium text-gray-900 dark:text-gray-100">Autor</p>
                <p>{previewItem.autor}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Proyecto</p>
                <p>{previewItem.proyecto_nombre}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">URL</p>
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
                <p className="font-medium text-gray-900 dark:text-gray-100">Fecha publicación</p>
                <p>{formatDate(previewItem.fecha_publicacion)}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && editItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Ajustar mensaje"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto personalizado para alertas
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Agrega notas o resalta partes clave del contenido..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdits}>Guardar cambios</Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default IngestionResultado;
