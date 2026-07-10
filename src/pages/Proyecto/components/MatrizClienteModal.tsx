import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@shared/components/ui/Modal';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getMatrizCliente,
  updateMatrizCliente,
  type MatrizCliente,
  type VoceroMatriz,
  type ReglaNoAlertar,
  type CriterioSector,
} from '@shared/services/api';
import { COUNTRIES, countryFlag } from '@shared/utils/countries';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface MatrizClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: string;
  proyectoNombre: string;
}

type SectionKey =
  | 'general'
  | 'voceros'
  | 'marcas'
  | 'paises'
  | 'reglas'
  | 'sector'
  | 'tonalidad'
  | 'autoenvio'
  | 'semaforo';

const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key: 'general', label: 'General' },
  { key: 'voceros', label: 'Voceros' },
  { key: 'marcas', label: 'Marcas' },
  { key: 'paises', label: 'Países' },
  { key: 'reglas', label: 'Reglas no-alertar' },
  { key: 'sector', label: 'Criterios sector' },
  { key: 'tonalidad', label: 'Tonalidad' },
  { key: 'autoenvio', label: 'Auto-envío' },
  { key: 'semaforo', label: 'Semáforo' },
];

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm';

const labelClass =
  'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const Toggle: React.FC<{
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        value ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const PctSlider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className={labelClass}>
      {label}: {Math.round(value * 100)}%
    </label>
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-full accent-blue-600"
    />
  </div>
);

const MatrizClienteModal: React.FC<MatrizClienteModalProps> = ({
  isOpen,
  onClose,
  proyectoId,
  proyectoNombre,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [section, setSection] = useState<SectionKey>('general');
  const [matriz, setMatriz] = useState<MatrizCliente | null>(null);
  const [paisQuery, setPaisQuery] = useState('');
  const [camposRequeridos, setCamposRequeridos] = useState<{
    redes: string;
    medios: string;
  }>({ redes: '', medios: '' });
  const [camposEsArray, setCamposEsArray] = useState(false);
  const [camposArrayValue, setCamposArrayValue] = useState('');

  useEffect(() => {
    if (!isOpen || !proyectoId) return;
    setSection('general');
    setDirty(false);
    setPaisQuery('');
    setLoading(true);
    getMatrizCliente(proyectoId)
      .then((data) => {
        setMatriz(data);
        const campos = data.campos_requeridos_envio;
        if (Array.isArray(campos)) {
          setCamposEsArray(true);
          setCamposArrayValue(campos.join(', '));
        } else {
          setCamposEsArray(false);
          setCamposRequeridos({
            redes: campos?.redes?.join(', ') || '',
            medios: campos?.medios?.join(', ') || '',
          });
        }
      })
      .catch((error) => {
        console.error('Error cargando matriz:', error);
        showError('Error al cargar la matriz de cliente');
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, proyectoId]);

  const update = useCallback((changes: Partial<MatrizCliente>) => {
    setMatriz((prev) => (prev ? { ...prev, ...changes } : prev));
    setDirty(true);
  }, []);

  const handleClose = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Cerrar de todas formas?')) {
      return;
    }
    onClose();
  };

  const parseComma = (value: string): string[] =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async () => {
    if (!matriz) return;
    try {
      setSaving(true);
      const payload: Partial<MatrizCliente> = {
        ...matriz,
        campos_requeridos_envio: camposEsArray
          ? parseComma(camposArrayValue)
          : {
              redes: parseComma(camposRequeridos.redes),
              medios: parseComma(camposRequeridos.medios),
            },
      };
      await updateMatrizCliente(proyectoId, payload);
      showSuccess('Matriz guardada', 'La matriz de cliente se actualizó correctamente');
      setDirty(false);
      onClose();
    } catch (error) {
      console.error('Error guardando matriz:', error);
      showError('Error al guardar la matriz de cliente');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneral = (m: MatrizCliente) => (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className={labelClass + ' mb-0'}>Activo</span>
          <Toggle value={m.activo} onChange={(v) => update({ activo: v })} />
        </div>
        <div>
          <label className={labelClass}>Modo</label>
          <select
            value={m.modo}
            onChange={(e) =>
              update({ modo: e.target.value as 'sombra' | 'activo' })
            }
            className={inputClass}
          >
            <option value="sombra">Sombra</option>
            <option value="activo">Activo</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Descripción del cliente</label>
        <textarea
          value={m.descripcion_cliente || ''}
          onChange={(e) => update({ descripcion_cliente: e.target.value })}
          rows={3}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Criterio de menciones</label>
        <textarea
          value={m.menciones_criterio || ''}
          onChange={(e) => update({ menciones_criterio: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Prompt adicional</label>
        <textarea
          value={m.prompt_adicional || ''}
          onChange={(e) => update({ prompt_adicional: e.target.value })}
          rows={3}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Observaciones</label>
        <textarea
          value={m.observaciones || ''}
          onChange={(e) => update({ observaciones: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </div>
    </div>
  );

  const renderVoceros = (m: MatrizCliente) => (
    <div className="space-y-3">
      {(m.voceros || []).map((vocero: VoceroMatriz, index: number) => (
        <div key={index} className="flex gap-2 items-start">
          <input
            type="text"
            value={vocero.nombre}
            onChange={(e) =>
              update({
                voceros: m.voceros.map((v, i) =>
                  i === index ? { ...v, nombre: e.target.value } : v
                ),
              })
            }
            placeholder="Nombre"
            className={inputClass}
          />
          <input
            type="text"
            value={vocero.notas}
            onChange={(e) =>
              update({
                voceros: m.voceros.map((v, i) =>
                  i === index ? { ...v, notas: e.target.value } : v
                ),
              })
            }
            placeholder="Notas"
            className={inputClass}
          />
          <button
            onClick={() =>
              update({ voceros: m.voceros.filter((_, i) => i !== index) })
            }
            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
            title="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({ voceros: [...(m.voceros || []), { nombre: '', notas: '' }] })
        }
        className="inline-flex items-center gap-1"
      >
        <PlusIcon className="h-4 w-4" /> Agregar vocero
      </Button>
    </div>
  );

  const renderMarcas = (m: MatrizCliente) => (
    <div className="space-y-3">
      {(m.marcas || []).map((marca, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            value={marca}
            onChange={(e) => {
              const marcas = [...m.marcas];
              marcas[index] = e.target.value;
              update({ marcas });
            }}
            placeholder="Marca"
            className={inputClass}
          />
          <button
            onClick={() =>
              update({ marcas: m.marcas.filter((_, i) => i !== index) })
            }
            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
            title="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => update({ marcas: [...(m.marcas || []), ''] })}
        className="inline-flex items-center gap-1"
      >
        <PlusIcon className="h-4 w-4" /> Agregar marca
      </Button>
    </div>
  );

  const renderPaises = (m: MatrizCliente) => {
    const query = paisQuery.trim().toLowerCase();
    const visible = COUNTRIES.filter(
      (c) =>
        !query ||
        c.nombre.toLowerCase().includes(query) ||
        c.iso.toLowerCase().includes(query)
    );
    return (
      <div className="space-y-3">
        {(m.paises || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {m.paises.map((iso) => (
              <span
                key={iso}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {countryFlag(iso)}{' '}
                {COUNTRIES.find((c) => c.iso === iso)?.nombre || iso}
                <button
                  onClick={() =>
                    update({ paises: m.paises.filter((p) => p !== iso) })
                  }
                  className="ml-1 hover:text-blue-950 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={paisQuery}
          onChange={(e) => setPaisQuery(e.target.value)}
          placeholder="Buscar país..."
          className={inputClass}
        />
        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-100 dark:divide-gray-700">
          {visible.map((c) => {
            const checked = (m.paises || []).includes(c.iso);
            return (
              <label
                key={c.iso}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    update({
                      paises: checked
                        ? m.paises.filter((p) => p !== c.iso)
                        : [...(m.paises || []), c.iso],
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>
                  {countryFlag(c.iso)} {c.nombre}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReglas = (m: MatrizCliente) => (
    <div className="space-y-3">
      {(m.reglas_no_alertar || []).map((regla: ReglaNoAlertar, index) => (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={regla.tipo}
              onChange={(e) =>
                update({
                  reglas_no_alertar: m.reglas_no_alertar.map((r, i) =>
                    i === index ? { ...r, tipo: e.target.value } : r
                  ),
                })
              }
              placeholder="Tipo"
              className={inputClass}
            />
            <select
              value={regla.ejecutor}
              onChange={(e) =>
                update({
                  reglas_no_alertar: m.reglas_no_alertar.map((r, i) =>
                    i === index
                      ? { ...r, ejecutor: e.target.value as 'codigo' | 'llm' }
                      : r
                  ),
                })
              }
              className={inputClass}
            >
              <option value="codigo">Código</option>
              <option value="llm">LLM</option>
            </select>
            <button
              onClick={() =>
                update({
                  reglas_no_alertar: m.reglas_no_alertar.filter(
                    (_, i) => i !== index
                  ),
                })
              }
              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
              title="Eliminar"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
          <input
            type="text"
            value={regla.descripcion}
            onChange={(e) =>
              update({
                reglas_no_alertar: m.reglas_no_alertar.map((r, i) =>
                  i === index ? { ...r, descripcion: e.target.value } : r
                ),
              })
            }
            placeholder="Descripción"
            className={inputClass}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({
            reglas_no_alertar: [
              ...(m.reglas_no_alertar || []),
              { tipo: '', descripcion: '', ejecutor: 'llm' },
            ],
          })
        }
        className="inline-flex items-center gap-1"
      >
        <PlusIcon className="h-4 w-4" /> Agregar regla
      </Button>
    </div>
  );

  const renderSector = (m: MatrizCliente) => (
    <div className="space-y-3">
      {(m.criterios_sector || []).map((criterio: CriterioSector, index) => (
        <div key={index} className="flex gap-2 items-start">
          <input
            type="text"
            value={criterio.clave}
            onChange={(e) =>
              update({
                criterios_sector: m.criterios_sector.map((c, i) =>
                  i === index ? { ...c, clave: e.target.value } : c
                ),
              })
            }
            placeholder="Clave"
            className={`${inputClass} w-40`}
          />
          <input
            type="text"
            value={criterio.emoji}
            onChange={(e) =>
              update({
                criterios_sector: m.criterios_sector.map((c, i) =>
                  i === index ? { ...c, emoji: e.target.value } : c
                ),
              })
            }
            placeholder="Emoji"
            className={`${inputClass} w-20`}
          />
          <input
            type="text"
            value={criterio.descripcion}
            onChange={(e) =>
              update({
                criterios_sector: m.criterios_sector.map((c, i) =>
                  i === index ? { ...c, descripcion: e.target.value } : c
                ),
              })
            }
            placeholder="Descripción"
            className={inputClass}
          />
          <button
            onClick={() =>
              update({
                criterios_sector: m.criterios_sector.filter(
                  (_, i) => i !== index
                ),
              })
            }
            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
            title="Eliminar"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          update({
            criterios_sector: [
              ...(m.criterios_sector || []),
              { clave: '', emoji: '', descripcion: '' },
            ],
          })
        }
        className="inline-flex items-center gap-1"
      >
        <PlusIcon className="h-4 w-4" /> Agregar criterio
      </Button>
    </div>
  );

  const renderTonalidad = (m: MatrizCliente) => {
    const esquema = m.esquema_tonalidad || {
      escala: [],
      foco: '',
      definiciones: {},
    };
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Foco</label>
          <input
            type="text"
            value={esquema.foco || ''}
            onChange={(e) =>
              update({
                esquema_tonalidad: { ...esquema, foco: e.target.value },
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Escala y definiciones</label>
          <div className="space-y-2">
            {(esquema.escala || []).map((valor, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => {
                    const escala = [...esquema.escala];
                    const definiciones = { ...esquema.definiciones };
                    if (valor in definiciones) {
                      definiciones[e.target.value] = definiciones[valor] ?? '';
                      delete definiciones[valor];
                    }
                    escala[index] = e.target.value;
                    update({
                      esquema_tonalidad: { ...esquema, escala, definiciones },
                    });
                  }}
                  placeholder="Valor"
                  className={`${inputClass} w-40`}
                />
                <input
                  type="text"
                  value={esquema.definiciones?.[valor] || ''}
                  onChange={(e) =>
                    update({
                      esquema_tonalidad: {
                        ...esquema,
                        definiciones: {
                          ...esquema.definiciones,
                          [valor]: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Definición"
                  className={inputClass}
                />
                <button
                  onClick={() => {
                    const definiciones = { ...esquema.definiciones };
                    delete definiciones[valor];
                    update({
                      esquema_tonalidad: {
                        ...esquema,
                        escala: esquema.escala.filter((_, i) => i !== index),
                        definiciones,
                      },
                    });
                  }}
                  className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                update({
                  esquema_tonalidad: {
                    ...esquema,
                    escala: [...(esquema.escala || []), ''],
                  },
                })
              }
              className="inline-flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" /> Agregar valor
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAutoEnvio = (m: MatrizCliente) => {
    const umbral = m.umbral_confianza || {};
    const setUmbral = (
      tipo: 'redes' | 'medios',
      campo: 'auto_envio' | 'descarte',
      value: number
    ) => {
      const actual = umbral[tipo] || { auto_envio: 0.9, descarte: 0.9 };
      update({
        umbral_confianza: {
          ...umbral,
          [tipo]: { ...actual, [campo]: value },
        },
      });
    };
    return (
      <div className="space-y-6">
        {(['redes', 'medios'] as const).map((tipo) => (
          <div
            key={tipo}
            className="border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-3"
          >
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {tipo}
            </h5>
            <PctSlider
              label="Umbral auto-envío"
              value={umbral[tipo]?.auto_envio ?? 0.9}
              onChange={(v) => setUmbral(tipo, 'auto_envio', v)}
            />
            <PctSlider
              label="Umbral descarte"
              value={umbral[tipo]?.descarte ?? 0.9}
              onChange={(v) => setUmbral(tipo, 'descarte', v)}
            />
          </div>
        ))}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className={labelClass + ' mb-0'}>Incluir bandera</span>
            <Toggle
              value={m.incluir_bandera}
              onChange={(v) => update({ incluir_bandera: v })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelClass + ' mb-0'}>Incluir semáforo</span>
            <Toggle
              value={m.incluir_semaforo}
              onChange={(v) => update({ incluir_semaforo: v })}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>
            Campos requeridos para envío (separados por coma)
          </label>
          {camposEsArray ? (
            <input
              type="text"
              value={camposArrayValue}
              onChange={(e) => {
                setCamposArrayValue(e.target.value);
                setDirty(true);
              }}
              placeholder="titulo, contenido, url"
              className={inputClass}
            />
          ) : (
            <div className="space-y-2">
              {(['redes', 'medios'] as const).map((tipo) => (
                <div key={tipo}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                    {tipo}
                  </label>
                  <input
                    type="text"
                    value={camposRequeridos[tipo]}
                    onChange={(e) => {
                      setCamposRequeridos((prev) => ({
                        ...prev,
                        [tipo]: e.target.value,
                      }));
                      setDirty(true);
                    }}
                    placeholder="titulo, contenido, url"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSemaforo = (m: MatrizCliente) => {
    const config = m.config_semaforo || {
      tipo: '',
      engagement_alto: {},
      reach_niveles: { bajo: [0, 0] as [number, number], medio: [0, 0] as [number, number], alto: 0 },
      emojis: {},
    };
    const engagementEntries = Object.entries(config.engagement_alto || {});
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Engagement alto por red</label>
          <div className="space-y-2">
            {engagementEntries.map(([red, valor]) => (
              <div key={red} className="flex gap-2 items-center">
                <span className="w-32 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {red}
                </span>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) =>
                    update({
                      config_semaforo: {
                        ...config,
                        engagement_alto: {
                          ...config.engagement_alto,
                          [red]: Number(e.target.value),
                        },
                      },
                    })
                  }
                  className={`${inputClass} w-32`}
                />
              </div>
            ))}
            {engagementEntries.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Sin redes configuradas
              </p>
            )}
          </div>
        </div>
        <div>
          <label className={labelClass}>Niveles de reach</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                🟢 Bajo (mín – máx)
              </label>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <input
                    key={i}
                    type="number"
                    value={config.reach_niveles?.bajo?.[i] ?? 0}
                    onChange={(e) => {
                      const bajo: [number, number] = [
                        ...(config.reach_niveles?.bajo || [0, 0]),
                      ] as [number, number];
                      bajo[i] = Number(e.target.value);
                      update({
                        config_semaforo: {
                          ...config,
                          reach_niveles: { ...config.reach_niveles, bajo },
                        },
                      });
                    }}
                    className={inputClass}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                🟡 Medio (mín – máx)
              </label>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <input
                    key={i}
                    type="number"
                    value={config.reach_niveles?.medio?.[i] ?? 0}
                    onChange={(e) => {
                      const medio: [number, number] = [
                        ...(config.reach_niveles?.medio || [0, 0]),
                      ] as [number, number];
                      medio[i] = Number(e.target.value);
                      update({
                        config_semaforo: {
                          ...config,
                          reach_niveles: { ...config.reach_niveles, medio },
                        },
                      });
                    }}
                    className={inputClass}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                🔴 Alto (desde)
              </label>
              <input
                type="number"
                value={config.reach_niveles?.alto ?? 0}
                onChange={(e) =>
                  update({
                    config_semaforo: {
                      ...config,
                      reach_niveles: {
                        ...config.reach_niveles,
                        alto: Number(e.target.value),
                      },
                    },
                  })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Emojis</label>
          <div className="space-y-2">
            {Object.entries(config.emojis || {}).map(([nivel, emoji]) => (
              <div key={nivel} className="flex gap-2 items-center">
                <span className="w-32 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {nivel}
                </span>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) =>
                    update({
                      config_semaforo: {
                        ...config,
                        emojis: { ...config.emojis, [nivel]: e.target.value },
                      },
                    })
                  }
                  className={`${inputClass} w-24`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (m: MatrizCliente) => {
    switch (section) {
      case 'general':
        return renderGeneral(m);
      case 'voceros':
        return renderVoceros(m);
      case 'marcas':
        return renderMarcas(m);
      case 'paises':
        return renderPaises(m);
      case 'reglas':
        return renderReglas(m);
      case 'sector':
        return renderSector(m);
      case 'tonalidad':
        return renderTonalidad(m);
      case 'autoenvio':
        return renderAutoEnvio(m);
      case 'semaforo':
        return renderSemaforo(m);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Matriz de cliente: ${proyectoNombre}`}
      size="xl"
    >
      {loading || !matriz ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Cargando matriz...
          </span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 max-h-[70vh]">
          <nav className="md:w-48 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`text-left px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                  section === s.key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1">
              {renderSection(matriz)}
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                isLoading={saving}
                disabled={saving}
                className="flex-1"
              >
                Guardar matriz
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MatrizClienteModal;
