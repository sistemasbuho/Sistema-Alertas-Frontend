import React, { useMemo, useState } from 'react';
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

type TabType = 'medios' | 'redes';

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
  fecha_publicacion: string;
  created_at: string;
  estado_revisado: string;
  proyecto: string;
  proyecto_nombre: string;
  proyecto_keywords: string[];
  emojis: string[];
  mensaje?: string;
  mensaje_formateado?: string | null;
};

type RedesItem = {
  id: string;
  contenido: string;
  url: string;
  autor: string;
  reach: number;
  engagement: number;
  fecha_publicacion: string;
  created_at: string;
  estado_revisado: string;
  proyecto: string;
  proyecto_nombre: string;
  proyecto_keywords: string[];
  emojis: string[];
  mensaje?: string;
  mensaje_formateado?: string | null;
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

const IngestionResultado: React.FC = () => {
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('medios');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediosItem | RedesItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<MediosItem | RedesItem | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const [mediosFiltersValues, setMediosFiltersValues] = useState<{
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
  }>({
    proyecto_nombre: '',
    autor: '',
    url: '',
  });
  const [redesFiltersValues, setRedesFiltersValues] = useState<{
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
  }>({
    proyecto_nombre: '',
    autor: '',
    url: '',
  });

  const [mediosPagination, setMediosPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });
  const [redesPagination, setRedesPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const [medios, setMedios] = useState<MediosItem[]>([
    {
      id: 'medio-1',
      titulo: 'Reporte especial sobre la alerta en la zona norte',
      contenido:
        'Las autoridades reportan aumento de la conversación digital en torno a la alerta temprana emitida en la zona norte.',
      url: 'https://noticiasseguras.com/alerta-zona-norte',
      autor: 'Carlos Pérez',
      reach: 56800,
      fecha_publicacion: '2024-05-14T09:30:00Z',
      created_at: '2024-05-14T10:00:00Z',
      estado_revisado: 'Pendiente',
      proyecto: 'proy-01',
      proyecto_nombre: 'Campaña Seguridad 2024',
      proyecto_keywords: ['alerta', 'seguridad', 'zona norte'],
      emojis: ['🚨'],
      mensaje:
        'Las autoridades reportan aumento de la conversación digital en torno a la alerta temprana emitida en la zona norte.',
      mensaje_formateado: null,
    },
    {
      id: 'medio-2',
      titulo: 'Cobertura de medios sobre campañas de sensibilización',
      contenido:
        'El despliegue de campañas de sensibilización ha incrementado el alcance de la información en medios regionales.',
      url: 'https://diarioregional.co/campana-sensibilizacion',
      autor: 'Laura Méndez',
      reach: 32450,
      fecha_publicacion: '2024-05-13T15:20:00Z',
      created_at: '2024-05-13T16:45:00Z',
      estado_revisado: 'Pendiente',
      proyecto: 'proy-01',
      proyecto_nombre: 'Campaña Seguridad 2024',
      proyecto_keywords: ['campaña', 'sensibilización'],
      emojis: [],
      mensaje:
        'El despliegue de campañas de sensibilización ha incrementado el alcance de la información en medios regionales.',
      mensaje_formateado: null,
    },
    {
      id: 'medio-3',
      titulo: 'Análisis de percepción en la zona centro',
      contenido:
        'Analistas resaltan la importancia de reforzar los mensajes para contrarrestar desinformación detectada durante la semana.',
      url: 'https://analisisurbano.org/percepcion-zona-centro',
      autor: 'María Gómez',
      reach: 48760,
      fecha_publicacion: '2024-05-12T18:45:00Z',
      created_at: '2024-05-12T19:10:00Z',
      estado_revisado: 'Revisado',
      proyecto: 'proy-02',
      proyecto_nombre: 'Plan de Acompañamiento Territorial',
      proyecto_keywords: ['percepción', 'desinformación'],
      emojis: ['🛡️', '✅'],
      mensaje:
        'Analistas resaltan la importancia de reforzar los mensajes para contrarrestar desinformación detectada durante la semana.',
      mensaje_formateado: null,
    },
  ]);

  const [redes, setRedes] = useState<RedesItem[]>([
    {
      id: 'red-1',
      contenido:
        'Se confirma el despliegue de equipos comunitarios en la zona norte para atender la alerta temprana. #AlertaActiva',
      url: 'https://twitter.com/seguridad/status/1',
      autor: '@SeguridadCol',
      reach: 125600,
      engagement: 8450,
      fecha_publicacion: '2024-05-14T07:15:00Z',
      created_at: '2024-05-14T08:00:00Z',
      estado_revisado: 'Pendiente',
      proyecto: 'proy-01',
      proyecto_nombre: 'Campaña Seguridad 2024',
      proyecto_keywords: ['alerta', 'comunidad'],
      emojis: ['🚨'],
      mensaje:
        'Se confirma el despliegue de equipos comunitarios en la zona norte para atender la alerta temprana. #AlertaActiva',
      mensaje_formateado: null,
    },
    {
      id: 'red-2',
      contenido:
        'En directo desde la zona centro explicando las acciones preventivas tomadas durante la última semana.',
      url: 'https://facebook.com/live/prevencion',
      autor: 'Alerta en Vivo',
      reach: 88600,
      engagement: 10450,
      fecha_publicacion: '2024-05-13T21:10:00Z',
      created_at: '2024-05-13T21:45:00Z',
      estado_revisado: 'Revisado',
      proyecto: 'proy-02',
      proyecto_nombre: 'Plan de Acompañamiento Territorial',
      proyecto_keywords: ['prevención', 'acciones'],
      emojis: ['🛡️'],
      mensaje:
        'En directo desde la zona centro explicando las acciones preventivas tomadas durante la última semana.',
      mensaje_formateado: null,
    },
    {
      id: 'red-3',
      contenido:
        'Recordatorio de canales oficiales para reportar novedades durante la alerta temprana. Mantente informado.',
      url: 'https://instagram.com/p/alerta-novedades',
      autor: '@InfoComunidad',
      reach: 64200,
      engagement: 6230,
      fecha_publicacion: '2024-05-12T12:25:00Z',
      created_at: '2024-05-12T13:05:00Z',
      estado_revisado: 'Pendiente',
      proyecto: 'proy-01',
      proyecto_nombre: 'Campaña Seguridad 2024',
      proyecto_keywords: ['canales', 'oficial'],
      emojis: [],
      mensaje:
        'Recordatorio de canales oficiales para reportar novedades durante la alerta temprana. Mantente informado.',
      mensaje_formateado: null,
    },
  ]);

  const ingestionSummary: IngestionSummary = useMemo(
    () => ({
      archivo: {
        nombre: 'ingestion_alertas_mayo.xlsx',
        proyecto: 'Campaña Seguridad 2024',
        cargadoPor: 'Ana Rodríguez',
        fecha: '2024-05-14T07:45:00Z',
        filas: 128,
      },
      resumen: {
        procesados: 126,
        medios: medios.length,
        redes: redes.length,
        duplicados: 4,
        descartados: 2,
        duracion: '2m 45s',
      },
      incidencias: [
        {
          id: 'inc-1',
          titulo: 'Entradas duplicadas',
          descripcion:
            'Se detectaron 4 entradas duplicadas vinculadas al proyecto Plan de Acompañamiento Territorial.',
          tipo: 'warning',
        },
        {
          id: 'inc-2',
          titulo: 'URL con formato inválido',
          descripcion:
            '2 registros fueron descartados por contener URL sin protocolo seguro (https).',
          tipo: 'error',
        },
      ],
    }),
    [medios.length, redes.length]
  );

  const mediosFilters = useMemo(
    () =>
      buildFilterState(mediosFiltersValues, setMediosFiltersValues, () =>
        setMediosPagination((prev) => ({ ...prev, currentPage: 1 }))
      ),
    [mediosFiltersValues]
  );

  const redesFilters = useMemo(
    () =>
      buildFilterState(redesFiltersValues, setRedesFiltersValues, () =>
        setRedesPagination((prev) => ({ ...prev, currentPage: 1 }))
      ),
    [redesFiltersValues]
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

  const applyFilters = <T extends MediosItem | RedesItem>(
    data: T[],
    filters: { proyecto_nombre?: string; autor?: string; url?: string }
  ) => {
    return data.filter((item) => {
      const matchesProyecto = filters.proyecto_nombre
        ? item.proyecto_nombre.toLowerCase().includes(
            filters.proyecto_nombre.toLowerCase()
          )
        : true;
      const matchesAutor = filters.autor
        ? item.autor.toLowerCase().includes(filters.autor.toLowerCase())
        : true;
      const matchesUrl = filters.url
        ? item.url.toLowerCase().includes(filters.url.toLowerCase())
        : true;

      return matchesProyecto && matchesAutor && matchesUrl;
    });
  };

  const applySearch = <T extends MediosItem | RedesItem>(data: T[]) => {
    if (!searchTerm.trim()) return data;

    const search = searchTerm.toLowerCase();

    return data.filter((item) => {
      if ('titulo' in item) {
        return (
          item.titulo.toLowerCase().includes(search) ||
          item.contenido.toLowerCase().includes(search) ||
          item.url.toLowerCase().includes(search) ||
          item.autor.toLowerCase().includes(search) ||
          item.proyecto_nombre.toLowerCase().includes(search)
        );
      }

      return (
        item.contenido.toLowerCase().includes(search) ||
        item.url.toLowerCase().includes(search) ||
        item.autor.toLowerCase().includes(search) ||
        item.proyecto_nombre.toLowerCase().includes(search)
      );
    });
  };

  const filteredMedios = useMemo(() => {
    const withFilters = applyFilters(medios, mediosFilters.filters);
    return applySearch(withFilters);
  }, [medios, mediosFilters, searchTerm]);

  const filteredRedes = useMemo(() => {
    const withFilters = applyFilters(redes, redesFilters.filters);
    return applySearch(withFilters);
  }, [redes, redesFilters, searchTerm]);

  const paginatedMedios = useMemo(() => {
    const start = (mediosPagination.currentPage - 1) * mediosPagination.pageSize;
    const end = start + mediosPagination.pageSize;
    return filteredMedios.slice(start, end);
  }, [filteredMedios, mediosPagination]);

  const paginatedRedes = useMemo(() => {
    const start = (redesPagination.currentPage - 1) * redesPagination.pageSize;
    const end = start + redesPagination.pageSize;
    return filteredRedes.slice(start, end);
  }, [filteredRedes, redesPagination]);

  const mediosPaginationState = useMemo(
    () => ({
      currentPage: mediosPagination.currentPage,
      pageSize: mediosPagination.pageSize,
      count: filteredMedios.length,
      previous: mediosPagination.currentPage > 1 ? 'prev' : null,
      next:
        mediosPagination.currentPage * mediosPagination.pageSize <
        filteredMedios.length
          ? 'next'
          : null,
    }),
    [filteredMedios.length, mediosPagination]
  );

  const redesPaginationState = useMemo(
    () => ({
      currentPage: redesPagination.currentPage,
      pageSize: redesPagination.pageSize,
      count: filteredRedes.length,
      previous: redesPagination.currentPage > 1 ? 'prev' : null,
      next:
        redesPagination.currentPage * redesPagination.pageSize <
        filteredRedes.length
          ? 'next'
          : null,
    }),
    [filteredRedes.length, redesPagination]
  );

  const currentData = activeTab === 'medios' ? paginatedMedios : paginatedRedes;
  const filteredData = activeTab === 'medios' ? filteredMedios : filteredRedes;
  const currentPagination =
    activeTab === 'medios' ? mediosPaginationState : redesPaginationState;

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentIds = currentData.map((item) => item.id);
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

  const handleEmojiClick = (emojiData: EmojiClickData, _event: any) => {
    const emojiValue = emojiData.emoji;

    if (emojiPickerTarget === 'all') {
      if (activeTab === 'medios') {
        setMedios((prev) =>
          prev.map((item) =>
            selectedItems.includes(item.id)
              ? { ...item, emojis: [...item.emojis, emojiValue] }
              : item
          )
        );
      } else {
        setRedes((prev) =>
          prev.map((item) =>
            selectedItems.includes(item.id)
              ? { ...item, emojis: [...item.emojis, emojiValue] }
              : item
          )
        );
      }
    } else if (emojiPickerTarget) {
      if (activeTab === 'medios') {
        setMedios((prev) =>
          prev.map((item) =>
            item.id === emojiPickerTarget
              ? { ...item, emojis: [...item.emojis, emojiValue] }
              : item
          )
        );
      } else {
        setRedes((prev) =>
          prev.map((item) =>
            item.id === emojiPickerTarget
              ? { ...item, emojis: [...item.emojis, emojiValue] }
              : item
          )
        );
      }
    }

    setShowEmojiPicker(false);
  };

  const handleRemoveEmoji = (itemId: string, emojiIndex: number) => {
    if (activeTab === 'medios') {
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
    } else {
      setRedes((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                emojis: item.emojis.filter((_, index) => index !== emojiIndex),
              }
            : item
        )
      );
    }
  };

  const handlePreviewItem = (item: MediosItem | RedesItem) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  const handleEditItem = (item: MediosItem | RedesItem) => {
    setEditItem(item);
    setEditNotes('');
    setShowEditModal(true);
  };

  const handleSaveEdits = () => {
    if (!editItem) return;

    if (activeTab === 'medios' && 'titulo' in editItem) {
      setMedios((prev) =>
        prev.map((item) =>
          item.id === editItem.id ? { ...item, mensaje_formateado: editNotes } : item
        )
      );
    } else {
      setRedes((prev) =>
        prev.map((item) =>
          item.id === editItem.id ? { ...item, mensaje_formateado: editNotes } : item
        )
      );
    }

    setShowEditModal(false);
    showSuccess('Mensaje actualizado', 'Se guardaron los cambios en el contenido.');
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewItem(null);
  };

  const handleMarkReviewed = () => {
    if (selectedItems.length === 0) return;

    if (activeTab === 'medios') {
      setMedios((prev) =>
        prev.map((item) =>
          selectedItems.includes(item.id)
            ? { ...item, estado_revisado: 'Revisado' }
            : item
        )
      );
    } else {
      setRedes((prev) =>
        prev.map((item) =>
          selectedItems.includes(item.id)
            ? { ...item, estado_revisado: 'Revisado' }
            : item
        )
      );
    }

    setSelectedItems([]);
    showSuccess('Registros actualizados', 'Los contenidos fueron marcados como revisados.');
  };

  const handlePreviousPage = () => {
    if (currentPagination.previous) {
      if (activeTab === 'medios') {
        setMediosPagination((prev) => ({
          ...prev,
          currentPage: Math.max(1, prev.currentPage - 1),
        }));
      } else {
        setRedesPagination((prev) => ({
          ...prev,
          currentPage: Math.max(1, prev.currentPage - 1),
        }));
      }
    }
  };

  const handleNextPage = () => {
    if (currentPagination.next) {
      if (activeTab === 'medios') {
        setMediosPagination((prev) => ({
          ...prev,
          currentPage: prev.currentPage + 1,
        }));
      } else {
        setRedesPagination((prev) => ({
          ...prev,
          currentPage: prev.currentPage + 1,
        }));
      }
    }
  };

  const handlePageSizeChange = (pageSize: number) => {
    if (activeTab === 'medios') {
      setMediosPagination({ currentPage: 1, pageSize });
    } else {
      setRedesPagination({ currentPage: 1, pageSize });
    }
  };

  const resetSelectionOnTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedItems([]);
    setShowFilters(false);
  };

  return (
    <DashboardLayout title="Resultados de ingestión">
      <div className="space-y-6">
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
                Proyecto: <span className="font-medium text-gray-900 dark:text-gray-100">{ingestionSummary.archivo.proyecto}</span>
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

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => resetSelectionOnTabChange('medios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'medios'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Medios
            </button>
            <button
              onClick={() => resetSelectionOnTabChange('redes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'redes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Redes
            </button>
          </nav>
        </div>

        <Card>
          <Card.Content className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Buscar ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (activeTab === 'medios') {
                        setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
                      } else {
                        setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
                      }
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
                    {(activeTab === 'medios'
                      ? mediosFilters.hasActiveFilters()
                      : redesFilters.hasActiveFilters()) && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {Object.values(
                          activeTab === 'medios'
                            ? mediosFilters.filters
                            : redesFilters.filters
                        ).filter((value) => value && value.trim() !== '').length}
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
                  {filteredData.length} {activeTab} encontrados · {selectedItems.length} seleccionados
                </span>
                {(activeTab === 'medios'
                  ? mediosFilters.hasActiveFilters()
                  : redesFilters.hasActiveFilters()) && (
                  <button
                    onClick={() => {
                      if (activeTab === 'medios') {
                        mediosFilters.clearFilters();
                        setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
                      } else {
                        redesFilters.clearFilters();
                        setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
                      }
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
                  activeTab={activeTab}
                  mediosFilters={mediosFilters}
                  redesFilters={redesFilters}
                />
              )}

              {currentData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {filteredData.length === 0
                      ? 'No se encontraron resultados con los filtros actuales.'
                      : 'No hay datos disponibles para mostrar.'}
                  </p>
                </div>
              ) : (
                <DataTable
                  activeTab={activeTab}
                  filteredData={currentData}
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
                activeTab={activeTab}
                currentData={currentData}
                pagination={currentPagination}
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
                    ? `${previewItem.emojis.join(' ')} ${previewItem.mensaje || previewItem.contenido}`
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
