import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getMedios,
  getRedes,
  capturaAlertaMedios,
  capturaAlertaRedes,
  type MediosPaginationParams,
  type RedesPaginationParams,
} from '@shared/services/api';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

type TabType = 'medios' | 'redes';

const ConsultaDatos: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('medios');
  const [medios, setMedios] = useState<any[]>([]);
  const [redes, setRedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [captureResult, setCaptureResult] = useState<{
    procesadas: any[];
    duplicadas: any[];
    mensaje: string;
    plantilla_mensaje?: any;
    codigo_acceso?: string;
  } | null>(null);

  const [mediosPagination, setMediosPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 20,
  });

  const [redesPagination, setRedesPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 15,
  });

  const mediosFilters = useUrlFilters({
    proyecto_nombre: '',
    autor: '',
    url: '',
    estado_enviado: 'true',
  });

  const redesFilters = useUrlFilters({
    proyecto_nombre: '',
    autor: '',
    url: '',
    estado_enviado: 'true',
  });

  const getCurrentFilters = () => {
    const filters = activeTab === 'medios' ? mediosFilters : redesFilters;
    return filters;
  };

  const getProjectName = () => {
    const currentData = activeTab === 'medios' ? medios : redes;
    const item = currentData.find(
      (item) => item.proyecto === selectedProjectId
    );
    return item?.proyecto_nombre || selectedProjectId;
  };

  useEffect(() => {
    if (activeTab === 'medios') {
      setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
    loadData({ page: 1 });
  }, [activeTab, mediosFilters.filters, redesFilters.filters]);

  useEffect(() => {
    setSelectedItems([]);
    setSelectedProjectId('');
    if (activeTab === 'medios') {
      setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
    }
  }, [activeTab]);

  const loadData = async (params?: { page?: number }) => {
    try {
      setLoading(true);
      setSelectedItems([]);

      if (activeTab === 'medios') {
        const rawFilters = Object.fromEntries(
          Object.entries(mediosFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );

        const activeFilters: MediosPaginationParams = {
          page: params?.page || mediosPagination.currentPage,
          page_size: mediosPagination.pageSize,
        };

        Object.entries(rawFilters).forEach(([key, value]) => {
          if (key === 'proyecto_nombre') {
            activeFilters.proyecto = value;
          } else if (key === 'estado_enviado') {
            activeFilters.estado_enviado = value === 'true';
          } else {
            (activeFilters as any)[key] = value;
          }
        });

        const response = await getMedios(activeFilters);
        setMedios(response.results);
        setMediosPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: params?.page || mediosPagination.currentPage,
          pageSize: mediosPagination.pageSize,
        });
      } else {
        const rawFilters = Object.fromEntries(
          Object.entries(redesFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );

        const activeFilters: RedesPaginationParams = {
          page: params?.page || redesPagination.currentPage,
          page_size: redesPagination.pageSize,
        };

        Object.entries(rawFilters).forEach(([key, value]) => {
          if (key === 'proyecto_nombre') {
            activeFilters.proyecto = value;
          } else if (key === 'estado_enviado') {
            activeFilters.estado_enviado = value === 'true';
          } else {
            (activeFilters as any)[key] = value;
          }
        });

        const response = await getRedes(activeFilters);
        setRedes(response.results);
        setRedesPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: params?.page || redesPagination.currentPage,
          pageSize: redesPagination.pageSize,
        });
      }
    } catch (err: any) {
      console.error(`Error cargando ${activeTab}:`, err);
      showError(
        `Error al cargar ${activeTab}`,
        err.message || `Error al cargar los ${activeTab}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    return activeTab === 'medios' ? medios : redes;
  };

  const getCurrentPagination = () => {
    return activeTab === 'medios' ? mediosPagination : redesPagination;
  };

  const handlePageChange = (newPage: number) => {
    loadData({ page: newPage });
  };

  const handleNextPage = () => {
    const currentPagination = getCurrentPagination();
    if (currentPagination.next) {
      const nextPage = currentPagination.currentPage + 1;
      handlePageChange(nextPage);
    }
  };

  const handlePreviousPage = () => {
    const currentPagination = getCurrentPagination();
    if (currentPagination.previous) {
      const prevPage = currentPagination.currentPage - 1;
      handlePageChange(prevPage);
    }
  };

  const filteredData = getCurrentData().filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'medios') {
      return (
        item.titulo?.toLowerCase().includes(searchLower) ||
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower) ||
        item.proyecto_nombre?.toLowerCase().includes(searchLower) ||
        item.proyecto?.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        item.proyecto_nombre?.toLowerCase().includes(searchLower) ||
        item.proyecto?.toLowerCase().includes(searchLower)
      );
    }
  });

  const handleSelectItem = (id: string) => {
    const currentData = activeTab === 'medios' ? medios : redes;
    const item = currentData.find((item) => item.id === id);

    if (!item) return;

    if (!selectedProjectId && selectedItems.length === 0) {
      setSelectedProjectId(item.proyecto);
    }

    if (selectedProjectId && item.proyecto !== selectedProjectId) {
      showError(
        `Solo puedes seleccionar elementos del proyecto: ${getProjectName()}`
      );
      return;
    }

    setSelectedItems((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      if (newSelection.length === 0) {
        setSelectedProjectId('');
      }

      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length && selectedProjectId) {
      setSelectedItems([]);
      setSelectedProjectId('');
    } else {
      if (!selectedProjectId && filteredData.length > 0) {
        const firstProject = filteredData[0].proyecto;
        setSelectedProjectId(firstProject);

        const sameProjectItems = filteredData
          .filter((item) => item.proyecto === firstProject)
          .map((item) => item.id);
        setSelectedItems(sameProjectItems);
      } else {
        const sameProjectItems = filteredData
          .filter((item) => item.proyecto === selectedProjectId)
          .map((item) => item.id);
        setSelectedItems(sameProjectItems);
      }
    }
  };

  const handleSendToAlertas = async () => {
    const selectedData = filteredData.filter((item) =>
      selectedItems.includes(item.id)
    );

    if (selectedData.length === 0) {
      showError('Sin selección', 'No hay elementos seleccionados para enviar');
      return;
    }

    if (activeTab === 'medios') {
      try {
        setCaptureLoading(true);

        const capturePayload = {
          proyecto_id: selectedData[0]?.proyecto,
          enviar: true,
          alertas: selectedData.map((item) => ({
            id: item.id,
            url: item.url,
            contenido: item.contenido,
            fecha: item.fecha_publicacion,
            titulo: item.titulo,
            autor: item.autor,
            reach: item.reach,
          })),
        };

        const response = await capturaAlertaMedios(capturePayload);

        setCaptureResult(response);
        setShowResultModal(true);
      } catch (error: any) {
        console.error('Error en captura de medios:', error);
        showError(
          'Error en captura',
          error.message || 'Error al capturar alerta de medios'
        );
        return;
      } finally {
        setCaptureLoading(false);
      }
    } else {
      try {
        setCaptureLoading(true);

        const capturePayload = {
          proyecto_id: selectedData[0]?.proyecto,
          enviar: true,
          alertas: selectedData.map((item) => ({
            id: item.id,
            titulo: item.titulo || '',
            url: item.url,
            contenido: item.contenido,
            fecha: item.fecha_publicacion,
            autor: item.autor || '',
            reach: item.reach?.toString() || '0',
          })),
        };

        const response = await capturaAlertaRedes(capturePayload);

        setCaptureResult(response);
        setShowResultModal(true);
      } catch (error: any) {
        console.error('Error en captura de redes:', error);
        showError(
          'Error en captura',
          error.message || 'Error al capturar alerta de redes'
        );
        return;
      } finally {
        setCaptureLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'Error en fecha';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const handleModalContinue = () => {
    if (captureResult && captureResult.procesadas.length > 0) {
      setShowResultModal(false);
      navigate('/alertas-preview', {
        state: {
          selectedItems: captureResult.procesadas.map((item: any) => ({
            id: item.id,
            url: item.url,
            contenido: item.mensaje || item.contenido,
            fecha: item.fecha || item.fecha_publicacion,
            fecha_publicacion: item.fecha_publicacion,
            titulo: item.titulo,
            autor: item.autor,
            reach: item.reach,
            emojis: [],
            mensaje_formateado: item.mensaje_formateado,
          })),
          tipo: activeTab,
          proyectoId: selectedProjectId || '',
          fromBackend: true,
          plantillaMensaje: captureResult.plantilla_mensaje,
          codigo_acceso: captureResult.codigo_acceso,
        },
      });
    }
  };

  const handleModalClose = () => {
    setShowResultModal(false);
    setCaptureResult(null);
  };

  return (
    <DashboardLayout title="Consulta de Datos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Consulta de Datos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Consulta y selecciona medios o redes sociales para enviar a
              alertas
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('medios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'medios'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Medios
            </button>
            <button
              onClick={() => setActiveTab('redes')}
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
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Buscar ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filtros
                    {getCurrentFilters().hasActiveFilters() && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {
                          Object.values(getCurrentFilters().filters).filter(
                            (v) => v && v.trim() !== ''
                          ).length
                        }
                      </span>
                    )}
                  </Button>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItems.length} seleccionados
                    </span>
                    {selectedProjectId && selectedItems.length > 0 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        📂 {getProjectName()}
                      </span>
                    )}
                  </div>
                  {selectedItems.length > 0 && (
                    <Button
                      onClick={handleSendToAlertas}
                      disabled={captureLoading}
                      className="inline-flex items-center gap-2"
                    >
                      {captureLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {activeTab === 'medios'
                            ? 'Capturando...'
                            : 'Enviando...'}
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4" />
                          Enviar a Alertas
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Filtros de{' '}
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h3>
                    {getCurrentFilters().hasActiveFilters() && (
                      <Button
                        onClick={getCurrentFilters().clearFilters}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeTab === 'medios' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.proyecto_nombre || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                proyecto_nombre: e.target.value,
                              })
                            }
                            placeholder="Nombre del proyecto"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Autor
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.autor || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                autor: e.target.value,
                              })
                            }
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.url || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                url: e.target.value,
                              })
                            }
                            placeholder="Ej: https://eltiempo.com/noticia/123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado de Enviado
                          </label>
                          <select
                            value={
                              mediosFilters.filters.estado_enviado !== undefined
                                ? mediosFilters.filters.estado_enviado
                                : 'true'
                            }
                            onChange={(e) => {
                              mediosFilters.updateFilters({
                                estado_enviado: e.target.value,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="true">Enviado</option>
                            <option value="false">No Enviado</option>
                            <option value="">Todos</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.proyecto_nombre || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                proyecto_nombre: e.target.value,
                              })
                            }
                            placeholder="Nombre del proyecto"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Autor
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.autor || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                autor: e.target.value,
                              })
                            }
                            placeholder="Ej: Juan"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.url || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                url: e.target.value,
                              })
                            }
                            placeholder="Ej: https://twitter.com/post/123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Estado de Enviado
                          </label>
                          <select
                            value={
                              redesFilters.filters.estado_enviado !== undefined
                                ? redesFilters.filters.estado_enviado
                                : 'true'
                            }
                            onChange={(e) => {
                              redesFilters.updateFilters({
                                estado_enviado: e.target.value,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="true">Enviado</option>
                            <option value="false">No Enviado</option>
                            <option value="">Todos</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Cargando {activeTab}...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? `No se encontraron ${activeTab} que coincidan con tu búsqueda.`
                    : `No hay ${activeTab} disponibles.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === filteredData.length &&
                            filteredData.length > 0
                          }
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      {activeTab === 'medios' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                            Proyecto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-64">
                            Título
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-80">
                            Contenido
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            URL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Autor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                            Reach
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Fecha Pub.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Fecha Creación
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                            Proyecto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-80">
                            Contenido
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            URL
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Autor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                            Reach
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                            Engagement
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Fecha Pub.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                            Fecha Creación
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedItems.includes(item.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <td className="px-2 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        {activeTab === 'medios' ? (
                          <>
                            <td className="px-4 py-4 w-40">
                              <div
                                className="text-sm text-gray-900 dark:text-white truncate"
                                title={item.proyecto_nombre || item.proyecto}
                              >
                                {item.proyecto_nombre ||
                                  item.proyecto ||
                                  'Sin proyecto'}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-64">
                              <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                {item.titulo}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-80">
                              <div
                                className="text-sm text-gray-900 dark:text-white line-clamp-3 leading-tight"
                                title={item.contenido}
                              >
                                {item.contenido}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate block"
                                title={item.url}
                              >
                                {item.url?.length > 20
                                  ? `${item.url.substring(0, 20)}...`
                                  : item.url}
                              </a>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white truncate">
                                {item.autor || 'Sin autor'}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-24">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {formatNumber(item.reach || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.fecha_publicacion)}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.created_at)}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4 w-40">
                              <div
                                className="text-sm text-gray-900 dark:text-white truncate"
                                title={item.proyecto_nombre || item.proyecto}
                              >
                                {item.proyecto_nombre ||
                                  item.proyecto ||
                                  'Sin proyecto'}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-80">
                              <div
                                className="text-sm text-gray-900 dark:text-white line-clamp-3 leading-tight"
                                title={item.contenido}
                              >
                                {item.contenido}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate block"
                                title={item.url}
                              >
                                {item.url?.length > 20
                                  ? `${item.url.substring(0, 20)}...`
                                  : item.url}
                              </a>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white truncate">
                                {item.autor || 'Sin autor'}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-24">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {formatNumber(item.reach || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-4 w-24">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                {formatNumber(item.engagement || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(
                                  item.fecha_publicacion || item.fecha
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 w-32">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.created_at)}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {getCurrentData().length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrando{' '}
                      {(getCurrentPagination().currentPage - 1) *
                        getCurrentPagination().pageSize +
                        1}{' '}
                      -{' '}
                      {Math.min(
                        getCurrentPagination().currentPage *
                          getCurrentPagination().pageSize,
                        getCurrentPagination().count
                      )}{' '}
                      de {getCurrentPagination().count} {activeTab}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={!getCurrentPagination().previous}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Anterior
                    </Button>

                    <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                      Página {getCurrentPagination().currentPage}
                    </span>

                    <Button
                      onClick={handleNextPage}
                      disabled={!getCurrentPagination().next}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      Siguiente
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {showResultModal && captureResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    {activeTab === 'medios' ? (
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                          clipRule="evenodd"
                        />
                        <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1V7z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {activeTab === 'medios'
                        ? 'Captura de Medios'
                        : 'Procesamiento de Redes'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resultados del procesamiento
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleModalClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Estado del procesamiento
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        {captureResult.mensaje}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {captureResult.procesadas.length > 0 && (
                <>
                  {captureResult.duplicadas &&
                    captureResult.duplicadas.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-yellow-600 dark:text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                            Alertas Duplicadas (
                            {captureResult.duplicadas.length})
                          </h4>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {captureResult.duplicadas.map(
                              (item: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-yellow-800 dark:text-yellow-200">
                                    {item.titulo ||
                                      (item.contenido
                                        ? item.contenido.substring(0, 80) +
                                          '...'
                                        : '') ||
                                      item.url ||
                                      `Duplicado #${index + 1}`}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-green-600 dark:text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                        Alertas Procesadas ({captureResult.procesadas.length})
                      </h4>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {captureResult.procesadas.map(
                          (item: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-green-800 dark:text-green-200">
                                {item.titulo ||
                                  (item.contenido
                                    ? item.contenido.substring(0, 80) + '...'
                                    : '') ||
                                  item.url ||
                                  `Alerta #${index + 1}`}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleModalClose}
                  variant="outline"
                  className="px-6 py-2 text-sm font-medium"
                >
                  Cerrar
                </Button>
                {captureResult.procesadas.length > 0 && (
                  <Button
                    onClick={handleModalContinue}
                    className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Continuar a Vista Previa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ConsultaDatos;
