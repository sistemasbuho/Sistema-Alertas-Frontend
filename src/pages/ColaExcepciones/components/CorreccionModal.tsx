import React, { useState, useEffect } from 'react';
import Modal from '@shared/components/ui/Modal';
import Button from '@shared/components/ui/Button';
import {
  getMatrizCliente,
  type AlertaExcepcion,
  type CriterioSector,
  type ResolverExcepcionRequest,
} from '@shared/services/api';
import { COUNTRIES, countryFlag } from '@shared/utils/countries';

interface CorreccionModalProps {
  isOpen: boolean;
  item: AlertaExcepcion | null;
  enviar: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: ResolverExcepcionRequest) => void;
}

const FALLBACK_ESCALA = ['positivo', 'neutral', 'negativo'];
const SEMAFOROS = ['bajo', 'medio', 'alto'] as const;

const toDatetimeLocal = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getCompletedFields = (datosCompletados?: any[]): Set<string> => {
  const set = new Set<string>();
  (datosCompletados || []).forEach((dato) => {
    if (typeof dato === 'string') set.add(dato);
    else if (dato && typeof dato === 'object' && (dato.campo || dato.field)) {
      set.add(dato.campo || dato.field);
    }
  });
  return set;
};

const CorreccionModal: React.FC<CorreccionModalProps> = ({
  isOpen,
  item,
  enviar,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [escala, setEscala] = useState<string[]>(FALLBACK_ESCALA);
  const [criteriosSector, setCriteriosSector] = useState<CriterioSector[]>([]);

  const [relevante, setRelevante] = useState(true);
  const [tonalidad, setTonalidad] = useState('');
  const [categoriaSector, setCategoriaSector] = useState('');
  const [pais, setPais] = useState('');
  const [semaforo, setSemaforo] = useState('');

  const [campos, setCampos] = useState({
    titulo: '',
    contenido: '',
    url: '',
    autor: '',
    ubicacion: '',
    fecha_publicacion: '',
    reach: '',
    engagement: '',
  });

  const completedFields = getCompletedFields(
    item?.evaluacion_ia?.datos_completados
  );

  useEffect(() => {
    if (!isOpen || !item) return;

    const ev = item.evaluacion_ia;
    setRelevante(ev?.relevante ?? true);
    setTonalidad(ev?.tonalidad || '');
    setCategoriaSector(ev?.categoria_sector || '');
    setPais(ev?.pais_detectado || '');
    setSemaforo(ev?.riesgo || '');
    setCampos({
      titulo: item.titulo || '',
      contenido: item.contenido || '',
      url: item.url || '',
      autor: item.autor || '',
      ubicacion: item.ubicacion || '',
      fecha_publicacion: toDatetimeLocal(item.fecha_publicacion),
      reach: item.reach !== null && item.reach !== undefined ? String(item.reach) : '',
      engagement:
        item.engagement !== null && item.engagement !== undefined
          ? String(item.engagement)
          : '',
    });

    setEscala(FALLBACK_ESCALA);
    setCriteriosSector([]);
    getMatrizCliente(item.proyecto)
      .then((matriz) => {
        if (matriz.esquema_tonalidad?.escala?.length) {
          setEscala(matriz.esquema_tonalidad.escala);
        }
        setCriteriosSector(matriz.criterios_sector || []);
      })
      .catch((error) => {
        console.error('Error cargando matriz para corrección:', error);
      });
  }, [isOpen, item]);

  if (!item) return null;

  const handleSubmit = () => {
    onSubmit(item.id, {
      accion: 'corregir',
      enviar,
      correccion: {
        relevante,
        tonalidad: tonalidad || undefined,
        categoria_sector: categoriaSector || undefined,
        pais: pais || undefined,
        semaforo: semaforo || undefined,
      },
      campos: {
        titulo: campos.titulo,
        contenido: campos.contenido,
        url: campos.url,
        autor: campos.autor,
        ubicacion: campos.ubicacion,
        fecha_publicacion: campos.fecha_publicacion
          ? new Date(campos.fecha_publicacion).toISOString()
          : undefined,
        reach: campos.reach !== '' ? Number(campos.reach) : null,
        engagement: campos.engagement !== '' ? Number(campos.engagement) : null,
      },
    });
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm';

  const fieldLabel = (label: string, field: string) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
      {completedFields.has(field) && (
        <span className="ml-1" title="Completado por la IA">
          ✨
        </span>
      )}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Corregir alerta" size="xl">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            1. Clasificación
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Relevante
              </label>
              <button
                type="button"
                onClick={() => setRelevante(!relevante)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  relevante ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    relevante ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {relevante ? 'Sí' : 'No'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tonalidad
              </label>
              <select
                value={tonalidad}
                onChange={(e) => setTonalidad(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin definir</option>
                {escala.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría / Sector
              </label>
              {criteriosSector.length > 0 ? (
                <select
                  value={categoriaSector}
                  onChange={(e) => setCategoriaSector(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin definir</option>
                  {criteriosSector.map((c) => (
                    <option key={c.clave} value={c.clave}>
                      {c.emoji ? `${c.emoji} ` : ''}
                      {c.clave}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={categoriaSector}
                  onChange={(e) => setCategoriaSector(e.target.value)}
                  className={inputClass}
                  placeholder="Categoría"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                País
              </label>
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin definir</option>
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {countryFlag(c.iso)} {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semáforo
              </label>
              <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
                {SEMAFOROS.map((nivel) => (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setSemaforo(nivel)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      semaforo === nivel
                        ? nivel === 'bajo'
                          ? 'bg-green-600 text-white'
                          : nivel === 'medio'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {nivel === 'bajo' ? '🟢' : nivel === 'medio' ? '🟡' : '🔴'}{' '}
                    {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            2. Campos de la alerta
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              {fieldLabel('Título', 'titulo')}
              <input
                type="text"
                value={campos.titulo}
                onChange={(e) =>
                  setCampos({ ...campos, titulo: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              {fieldLabel('Contenido', 'contenido')}
              <textarea
                value={campos.contenido}
                onChange={(e) =>
                  setCampos({ ...campos, contenido: e.target.value })
                }
                rows={4}
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('URL', 'url')}
              <input
                type="text"
                value={campos.url}
                onChange={(e) => setCampos({ ...campos, url: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('Autor', 'autor')}
              <input
                type="text"
                value={campos.autor}
                onChange={(e) =>
                  setCampos({ ...campos, autor: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('Ubicación', 'ubicacion')}
              <input
                type="text"
                value={campos.ubicacion}
                onChange={(e) =>
                  setCampos({ ...campos, ubicacion: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('Fecha de publicación', 'fecha_publicacion')}
              <input
                type="datetime-local"
                value={campos.fecha_publicacion}
                onChange={(e) =>
                  setCampos({ ...campos, fecha_publicacion: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('Reach', 'reach')}
              <input
                type="number"
                value={campos.reach}
                onChange={(e) =>
                  setCampos({ ...campos, reach: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              {fieldLabel('Engagement', 'engagement')}
              <input
                type="number"
                value={campos.engagement}
                onChange={(e) =>
                  setCampos({ ...campos, engagement: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
            className="flex-1"
          >
            {enviar ? 'Guardar corrección y enviar' : 'Guardar corrección'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CorreccionModal;
