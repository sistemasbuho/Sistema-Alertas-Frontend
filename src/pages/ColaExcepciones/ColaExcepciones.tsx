import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Modal from '@shared/components/ui/Modal';
import { useToast } from '@shared/contexts/ToastContext';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  getColaExcepciones,
  resolverExcepcion,
  resolverExcepcionesBulk,
  type AlertaExcepcion,
  type ColaExcepcionesParams,
  type ResolverExcepcionRequest,
} from '@shared/services/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import {
  ExcepcionCard,
  ExcepcionesFilters,
  CorreccionModal,
} from './components';
import type { ColaFiltersValues } from './components/ExcepcionesFilters';

const PAGE_SIZE = 20;

const ColaExcepciones = () => {
  const { showSuccess, showError, showWarning } = useToast();

  const [items, setItems] = useState<AlertaExcepcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [enviarAlConfirmar, setEnviarAlConfirmar] = useState(true);

  const [correccionItem, setCorreccionItem] =
    useState<AlertaExcepcion | null>(null);
  const [correccionSubmitting, setCorreccionSubmitting] = useState(false);
  const [previewItem, setPreviewItem] = useState<AlertaExcepcion | null>(null);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  const filters = useUrlFilters<ColaFiltersValues>({
    proyecto: '',
    proyecto_nombre: '',
    tipo: '',
    tonalidad: '',
    confianza_max: '',
  });

  const loadData = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: ColaExcepcionesParams = {
          page,
          page_size: PAGE_SIZE,
        };
        if (filters.filters.proyecto) params.proyecto = filters.filters.proyecto;
        if (filters.filters.tipo) params.tipo = filters.filters.tipo;
        if (filters.filters.tonalidad)
          params.tonalidad = filters.filters.tonalidad;
        if (filters.filters.confianza_max) {
          params.confianza_max = Number(filters.filters.confianza_max) / 100;
        }

        const response = await getColaExcepciones(params);
        setItems(response.results);
        setSelectedIds([]);
        setPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: page,
        });
      } catch (error) {
        console.error('Error cargando cola de excepciones:', error);
        showError('Error al cargar la cola de excepciones');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.filters]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const removeFromList = (ids: string[]) => {
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setPagination((prev) => ({
      ...prev,
      count: Math.max(0, prev.count - ids.length),
    }));
  };

  const handleResolver = async (
    item: AlertaExcepcion,
    data: ResolverExcepcionRequest,
    successMsg: string
  ) => {
    setResolvingIds((prev) => new Set(prev).add(item.id));
    removeFromList([item.id]);
    try {
      await resolverExcepcion(item.id, data);
      showSuccess(successMsg);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        showWarning('Alerta ya resuelta', 'Esta alerta ya había sido resuelta.');
      } else {
        showError('Error al resolver la alerta');
      }
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      loadData(pagination.currentPage);
    }
  };

  const handleConfirmar = (item: AlertaExcepcion) =>
    handleResolver(
      item,
      { accion: 'confirmar', enviar: enviarAlConfirmar },
      enviarAlConfirmar ? 'Alerta confirmada y enviada' : 'Alerta confirmada'
    );

  const handleDescartar = (item: AlertaExcepcion, motivo?: string) =>
    handleResolver(
      item,
      { accion: 'descartar', enviar: false, motivo },
      'Alerta descartada'
    );

  const handleCorreccionSubmit = async (
    id: string,
    data: ResolverExcepcionRequest
  ) => {
    try {
      setCorreccionSubmitting(true);
      await resolverExcepcion(id, data);
      showSuccess(
        data.enviar ? 'Corrección guardada y enviada' : 'Corrección guardada'
      );
      setCorreccionItem(null);
      removeFromList([id]);
      loadData(pagination.currentPage);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        showWarning('Alerta ya resuelta', 'Esta alerta ya había sido resuelta.');
        setCorreccionItem(null);
        loadData(pagination.currentPage);
      } else {
        showError('Error al guardar la corrección');
      }
    } finally {
      setCorreccionSubmitting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const validateSingleProject = (): boolean => {
    const proyectos = new Set(
      items
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => item.proyecto)
    );
    if (proyectos.size > 1) {
      showWarning(
        'Selección inválida',
        'Las acciones en bloque solo admiten alertas de un mismo proyecto.'
      );
      return false;
    }
    return true;
  };

  const handleBulk = async (accion: 'confirmar' | 'descartar') => {
    if (selectedIds.length === 0) return;
    if (!validateSingleProject()) return;

    const ids = [...selectedIds];
    try {
      setLoading(true);
      const response = await resolverExcepcionesBulk({
        ids,
        accion,
        enviar: accion === 'confirmar' ? enviarAlConfirmar : false,
      });
      if (response.fallidas && response.fallidas.length > 0) {
        showWarning(
          'Algunas alertas fallaron',
          `${response.procesadas.length} procesadas, ${response.fallidas.length} fallidas`
        );
      } else {
        showSuccess(
          accion === 'confirmar'
            ? `${response.procesadas.length} alertas confirmadas`
            : `${response.procesadas.length} alertas descartadas`
        );
      }
    } catch (error) {
      console.error('Error en acción en bloque:', error);
      showError('Error al procesar las alertas seleccionadas');
    } finally {
      loadData(pagination.currentPage);
    }
  };

  return (
    <DashboardLayout title="Cola de Excepciones">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cola de Excepciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Revisa las alertas que la IA no pudo resolver automáticamente
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enviar al confirmar
            </span>
            <button
              type="button"
              onClick={() => setEnviarAlConfirmar(!enviarAlConfirmar)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enviarAlConfirmar
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enviarAlConfirmar ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        <Card>
          <Card.Content className="p-4">
            <ExcepcionesFilters
              filters={filters.filters}
              onChange={(newFilters) => filters.updateFilters(newFilters)}
              onClear={filters.clearFilters}
              totalCount={pagination.count}
            />
          </Card.Content>
        </Card>

        {selectedIds.length > 0 && (
          <div className="sticky top-0 z-30 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {selectedIds.length} seleccionada
              {selectedIds.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                onClick={() => handleBulk('confirmar')}
                className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500"
              >
                <CheckIcon className="h-4 w-4" />
                Confirmar seleccionadas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulk('descartar')}
                className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
              >
                <XMarkIcon className="h-4 w-4" />
                Descartar seleccionadas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds([])}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando cola de excepciones...
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay alertas en cola
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.hasActiveFilters()
                ? 'No se encontraron alertas con los filtros aplicados.'
                : 'La IA no tiene alertas pendientes de revisión humana.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ExcepcionCard
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                resolving={resolvingIds.has(item.id)}
                onToggleSelect={handleToggleSelect}
                onConfirmar={handleConfirmar}
                onCorregir={setCorreccionItem}
                onDescartar={handleDescartar}
                onPreview={setPreviewItem}
              />
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {items.length} de {pagination.count} alertas
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => loadData(pagination.currentPage - 1)}
                disabled={!pagination.previous}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                Página {pagination.currentPage}
              </span>
              <Button
                onClick={() => loadData(pagination.currentPage + 1)}
                disabled={!pagination.next}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1"
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <CorreccionModal
          isOpen={!!correccionItem}
          item={correccionItem}
          enviar={enviarAlConfirmar}
          submitting={correccionSubmitting}
          onClose={() => setCorreccionItem(null)}
          onSubmit={handleCorreccionSubmit}
        />

        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title="Vista previa del mensaje"
          size="lg"
        >
          <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-md max-h-96 overflow-y-auto whitespace-pre-wrap">
            {previewItem?.mensaje_formateado || 'Sin mensaje formateado'}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ColaExcepciones;
