import React, { useState, useEffect } from 'react';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Input from '@shared/components/ui/Input';
import SlideOver from '@shared/components/ui/SlideOver';
import CamposFormatoModal from '@shared/components/ui/CamposFormatoModal';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getProyectos,
  createProyecto,
  updateProyecto,
  type Proyecto,
  type PaginationParams,
} from '@shared/services/api';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ProyectoPage = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const filters = useUrlFilters({
    nombre: '',
  });

  // Estados para paginación
  const [pagination, setPagination] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
    currentPage: number;
    pageSize: number;
  }>({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    pageSize: 10,
  });
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditSlideOverOpen, setIsEditSlideOverOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);

  const [isFormatoModalOpen, setIsFormatoModalOpen] = useState(false);
  const [selectedProyectoFormato, setSelectedProyectoFormato] =
    useState<Proyecto | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    proveedor: string;
    codigo_acceso: string;
    estado: 'activo' | 'inactivo' | 'completado';
    tipo_envio: 'automatico' | 'manual' | 'medios';
    tipo_alerta: string;
    formato_mensaje: string;
    keywords: string;
  }>({
    nombre: '',
    proveedor: '',
    codigo_acceso: '',
    estado: 'activo',
    tipo_envio: 'automatico',
    tipo_alerta: 'medios',
    formato_mensaje: 'uno a uno',
    keywords: '',
  });

  const loadData = async (params?: PaginationParams) => {
    try {
      setLoading(true);
      setError('');

      const combinedParams = {
        page: params?.page || pagination.currentPage,
        page_size: params?.page_size || pagination.pageSize,
        search: params?.search || searchTerm,
        ...filters.filters,
        ...params,
      };

      const cleanedParams = Object.fromEntries(
        Object.entries(combinedParams).filter(
          ([_, value]) => value !== null && value !== undefined && value !== ''
        )
      );

      const response = await getProyectos(cleanedParams);

      setProyectos(response.results);
      setPagination((prev) => ({
        ...prev,
        count: response.count,
        next: response.next,
        previous: response.previous,
        currentPage: params?.page || prev.currentPage,
      }));
    } catch (err: any) {
      console.error('❌ Error cargando proyectos:', err);
      const errorMessage = err.message || 'Error al cargar los proyectos';
      setError(errorMessage);
      showError('Error al cargar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showError, filters.filters]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    const delayedSearch = setTimeout(() => {
      loadData({
        search: searchTerm,
        page: 1, // Resetear a la primera página al buscar
      });
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleOpenSlideOver = () => {
    setFormData({
      nombre: '',
      proveedor: '',
      codigo_acceso: '',
      estado: 'activo',
      tipo_envio: 'automatico',
      tipo_alerta: 'medios',
      formato_mensaje: 'uno a uno',
      keywords: '',
    });
    setIsSlideOverOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsSlideOverOpen(false);
    setIsCreating(false);
  };

  const handleOpenEditSlideOver = (proyecto: Proyecto) => {
    setEditingProyecto(proyecto);
    setFormData({
      nombre: proyecto.nombre,
      proveedor: proyecto.proveedor,
      codigo_acceso: proyecto.codigo_acceso,
      estado: proyecto.estado,
      tipo_envio: proyecto.tipo_envio,
      tipo_alerta: proyecto.tipo_alerta,
      formato_mensaje: proyecto.formato_mensaje,
      keywords: proyecto.keywords || '',
    });
    setIsEditSlideOverOpen(true);
  };

  const handleCloseEditSlideOver = () => {
    setIsEditSlideOverOpen(false);
    setIsUpdating(false);
    setEditingProyecto(null);
  };

  const handleOpenFormatoModal = (proyecto: Proyecto) => {
    setSelectedProyectoFormato(proyecto);
    setIsFormatoModalOpen(true);
  };

  const handleCloseFormatoModal = () => {
    setIsFormatoModalOpen(false);
    setSelectedProyectoFormato(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.proveedor.trim() ||
      !formData.codigo_acceso.trim()
    ) {
      showWarning(
        'Campos requeridos',
        'Por favor completa todos los campos obligatorios'
      );
      return;
    }

    try {
      setIsCreating(true);
      await createProyecto(formData);

      showSuccess(
        'Proyecto creado',
        `El proyecto "${formData.nombre}" se ha creado correctamente`
      );

      handleCloseSlideOver();

      await loadData();
    } catch (err: any) {
      console.error('Error creando proyecto:', err);

      if (err.response?.status === 400) {
        if (
          err.response?.data?.message?.includes('nombre') ||
          err.response?.data?.error?.includes('nombre') ||
          err.message?.includes('nombre')
        ) {
          showError(
            'Proyecto ya existe',
            `Ya existe un proyecto con el nombre "${formData.nombre}". Por favor elige otro nombre.`
          );
        } else if (
          err.response?.data?.message?.includes('codigo') ||
          err.response?.data?.error?.includes('codigo') ||
          err.message?.includes('codigo')
        ) {
          showError(
            'Código duplicado',
            `El código de acceso "${formData.codigo_acceso}" ya está en uso. Por favor elige otro código.`
          );
        } else {
          showError(
            'Datos inválidos',
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Los datos proporcionados no son válidos'
          );
        }
      } else if (err.response?.status === 401) {
        showError(
          'No autorizado',
          'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        );
      } else if (err.response?.status === 403) {
        showError('Sin permisos', 'No tienes permisos para crear proyectos.');
      } else if (err.response?.status >= 500) {
        showError(
          'Error del servidor',
          'Ocurrió un error en el servidor. Por favor intenta más tarde.'
        );
      } else if (err.code === 'ERR_NETWORK') {
        showError(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        );
      } else {
        showError(
          'Error inesperado',
          err.message || 'Ocurrió un error inesperado al crear el proyecto'
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.proveedor.trim() ||
      !formData.codigo_acceso.trim() ||
      !editingProyecto
    ) {
      showWarning(
        'Campos requeridos',
        'Por favor completa todos los campos obligatorios'
      );
      return;
    }

    try {
      setIsUpdating(true);
      await updateProyecto(editingProyecto.id, formData);

      showSuccess(
        'Proyecto actualizado',
        `El proyecto "${formData.nombre}" se ha actualizado correctamente`
      );

      handleCloseEditSlideOver();

      await loadData();
    } catch (err: any) {
      console.error('Error actualizando proyecto:', err);

      if (err.response?.status === 400) {
        if (
          err.response?.data?.message?.includes('nombre') ||
          err.response?.data?.error?.includes('nombre') ||
          err.message?.includes('nombre')
        ) {
          showError(
            'Proyecto ya existe',
            `Ya existe un proyecto con el nombre "${formData.nombre}". Por favor elige otro nombre.`
          );
        } else if (
          err.response?.data?.message?.includes('codigo') ||
          err.response?.data?.error?.includes('codigo') ||
          err.message?.includes('codigo')
        ) {
          showError(
            'Código duplicado',
            `El código de acceso "${formData.codigo_acceso}" ya está en uso. Por favor elige otro código.`
          );
        } else {
          showError(
            'Datos inválidos',
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Los datos proporcionados no son válidos'
          );
        }
      } else if (err.response?.status === 401) {
        showError(
          'No autorizado',
          'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        );
      } else if (err.response?.status === 403) {
        showError('Sin permisos', 'No tienes permisos para editar proyectos.');
      } else if (err.response?.status === 404) {
        showError(
          'Proyecto no encontrado',
          'El proyecto que intentas editar ya no existe.'
        );
      } else if (err.response?.status >= 500) {
        showError(
          'Error del servidor',
          'Ocurrió un error en el servidor. Por favor intenta más tarde.'
        );
      } else if (err.code === 'ERR_NETWORK') {
        showError(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        );
      } else {
        showError(
          'Error inesperado',
          err.message || 'Ocurrió un error inesperado al actualizar el proyecto'
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePageChange = async (page: number) => {
    await loadData({ page });
  };

  const handleNextPage = () => {
    if (pagination.next) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.previous) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const totalPages = Math.ceil(pagination.count / pagination.pageSize);

  const filteredProyectos = proyectos;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoBadge = (estado: string) => {
    const colors = {
      activo:
        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactivo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      completado:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[estado as keyof typeof colors] || colors.inactivo
        }`}
      >
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const getTipoEnvioBadge = (tipoEnvio: string) => {
    const colors = {
      automatico:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      manual:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[tipoEnvio as keyof typeof colors] || colors.manual
        }`}
      >
        {tipoEnvio.charAt(0).toUpperCase() + tipoEnvio.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout title="Gestión de Proyectos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Proyectos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona todos tus proyectos de alertas
            </p>
          </div>
          <Button
            onClick={handleOpenSlideOver}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <Card>
          <Card.Content className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

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
                        (v) => v && v.trim() !== ''
                      ).length
                    }
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  {filters.hasActiveFilters() && (
                    <Button
                      onClick={filters.clearFilters}
                      variant="outline"
                      size="sm"
                      className="inline-flex items-center gap-2"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Proyecto
                    </label>
                    <input
                      type="text"
                      value={filters.filters.nombre || ''}
                      onChange={(e) =>
                        filters.updateFilters({ nombre: e.target.value })
                      }
                      placeholder="Ej: Mi Proyecto"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Cargando proyectos...
                </p>
              </div>
            ) : filteredProyectos?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? 'No se encontraron proyectos que coincidan con tu búsqueda.'
                    : 'No hay proyectos disponibles.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proyecto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo Envío
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo Alerta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Formato Mensaje
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Keywords
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Última Modificación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredProyectos?.map((proyecto) => (
                      <tr
                        key={proyecto.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {proyecto.nombre}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {proyecto.id.split('-')[0]}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {proyecto.proveedor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {proyecto.codigo_acceso}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEstadoBadge(proyecto.estado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTipoEnvioBadge(proyecto.tipo_envio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {proyecto.tipo_alerta}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                            {proyecto.formato_mensaje}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                            title={proyecto.keywords || 'Sin keywords'}
                          >
                            {proyecto.keywords || 'Sin keywords'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(proyecto.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(proyecto.modified_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenFormatoModal(proyecto)}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1"
                              title="Formato de Campos"
                            >
                              <Cog6ToothIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditSlideOver(proyecto)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Controles de Paginación */}
        {pagination.count > pagination.pageSize && (
          <Card>
            <Card.Content className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando página {pagination.currentPage} de {totalPages} (
                  {pagination.count} proyectos total
                  {pagination.count !== 1 ? 's' : ''})
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={!pagination.previous || loading}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === pagination.currentPage;

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded-md ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } ${
                            loading
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    {totalPages > 5 && (
                      <>
                        <span className="text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm rounded-md ${
                            totalPages === pagination.currentPage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } ${
                            loading
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.next || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}

        <SlideOver
          isOpen={isSlideOverOpen}
          onClose={handleCloseSlideOver}
          title="Crear Nuevo Proyecto"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Proyecto *
              </label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Proyecto Alerta Redes"
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor *
              </label>
              <Input
                value={formData.proveedor}
                onChange={(e) =>
                  setFormData({ ...formData, proveedor: e.target.value })
                }
                placeholder="Ej: Proveedor XYZ"
                required
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Acceso *
              </label>
              <Input
                value={formData.codigo_acceso}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_acceso: e.target.value })
                }
                placeholder="Ej: ABC12345"
                required
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Envío
                </label>
                <select
                  value={formData.tipo_envio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_envio: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isCreating}
                >
                  <option value="automatico">Automático</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Alerta
              </label>
              <Input
                value={formData.tipo_alerta}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_alerta: e.target.value })
                }
                placeholder="Ej: medios"
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Mensaje
              </label>
              <Input
                value={formData.formato_mensaje}
                onChange={(e) =>
                  setFormData({ ...formData, formato_mensaje: e.target.value })
                }
                placeholder="Ej: uno a uno"
                disabled={isCreating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keywords
              </label>
              <textarea
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="Ej: noticia,prensa,medios sociales"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isCreating}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Separa las keywords con comas
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                isLoading={isCreating}
                disabled={
                  isCreating ||
                  !formData.nombre.trim() ||
                  !formData.proveedor.trim() ||
                  !formData.codigo_acceso.trim()
                }
                className="flex-1"
              >
                {isCreating ? 'Creando...' : 'Crear Proyecto'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseSlideOver}
                disabled={isCreating}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SlideOver>

        <SlideOver
          isOpen={isEditSlideOverOpen}
          onClose={handleCloseEditSlideOver}
          title={`Editar Proyecto: ${editingProyecto?.nombre || ''}`}
        >
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Proyecto *
              </label>
              <Input
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                placeholder="Ej: Proyecto Alerta Redes"
                required
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proveedor *
              </label>
              <Input
                value={formData.proveedor}
                onChange={(e) =>
                  setFormData({ ...formData, proveedor: e.target.value })
                }
                placeholder="Ej: Proveedor XYZ"
                required
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de Acceso *
              </label>
              <Input
                value={formData.codigo_acceso}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_acceso: e.target.value })
                }
                placeholder="Ej: ABC12345"
                required
                disabled={isUpdating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isUpdating}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Envío
                </label>
                <select
                  value={formData.tipo_envio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_envio: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isUpdating}
                >
                  <option value="automatico">Automático</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Alerta
              </label>
              <Input
                value={formData.tipo_alerta}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_alerta: e.target.value })
                }
                placeholder="Ej: medios"
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato de Mensaje
              </label>
              <Input
                value={formData.formato_mensaje}
                onChange={(e) =>
                  setFormData({ ...formData, formato_mensaje: e.target.value })
                }
                placeholder="Ej: uno a uno"
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keywords
              </label>
              <textarea
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="Ej: noticia,prensa,medios sociales"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isUpdating}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Separa las keywords con comas
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                isLoading={isUpdating}
                disabled={
                  isUpdating ||
                  !formData.nombre.trim() ||
                  !formData.proveedor.trim() ||
                  !formData.codigo_acceso.trim()
                }
                className="flex-1"
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar Proyecto'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditSlideOver}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SlideOver>

        <CamposFormatoModal
          isOpen={isFormatoModalOpen}
          onClose={handleCloseFormatoModal}
          proyectoId={selectedProyectoFormato?.id || ''}
          proyectoNombre={selectedProyectoFormato?.nombre || ''}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProyectoPage;
