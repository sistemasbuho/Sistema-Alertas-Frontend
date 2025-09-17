import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getPlantillaCampos,
  guardarCamposPlantilla,
  Campo,
  Plantilla,
} from '@shared/services/api';

interface CamposFormatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: string;
  proyectoNombre: string;
}

const CAMPOS_EXCLUIDOS = [
  'id',
  'proyecto',
  'created_at',
  'modified_at',
  'created_by',
  'modified_by',
];

const CamposFormatoModal: React.FC<CamposFormatoModalProps> = ({
  isOpen,
  onClose,
  proyectoId,
  proyectoNombre,
}) => {
  const { showSuccess, showError } = useToast();
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(
    null
  );
  const [campos, setCampos] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && proyectoId) {
      loadPlantillas();
    }
  }, [isOpen, proyectoId]);

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      const data = await getPlantillaCampos(proyectoId);

      if (data.length > 0 && data[0]) {
        const plantilla = data[0];
        setSelectedPlantilla(plantilla);

        const configCampos = plantilla.config_campos || {};

        const camposConfigurados: Campo[] = [];
        const camposBase: Campo[] = [];

        Object.entries(configCampos).forEach(([nombreCampo, config]) => {
          if (!CAMPOS_EXCLUIDOS.includes(nombreCampo)) {
            const configData = config as {
              orden?: number;
              estilo?: Record<string, any>;
            };
            camposConfigurados.push({
              id: `config-${nombreCampo}`,
              campo: nombreCampo,
              orden: configData.orden || 1,
              estilo: configData.estilo || {},
            });
          }
        });

        const camposYaConfigurados = Object.keys(configCampos).filter(
          (nombreCampo) => !CAMPOS_EXCLUIDOS.includes(nombreCampo)
        );
        plantilla.campos
          .filter((campo) => !CAMPOS_EXCLUIDOS.includes(campo.campo))
          .filter((campo) => !camposYaConfigurados.includes(campo.campo))
          .forEach((campo) => {
            camposBase.push({
              id: `base-${campo.campo}`,
              campo: campo.campo,
              orden: campo.orden || 1,
              estilo: campo.estilo || {},
            });
          });

        camposConfigurados.sort((a, b) => a.orden - b.orden);
        camposBase.sort((a, b) => a.orden - b.orden);

        const todosCampos = [...camposConfigurados, ...camposBase];

        setCampos(todosCampos);
      }
    } catch (error: any) {
      showError(
        'Error al cargar',
        error.message || 'No se pudieron cargar las plantillas'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCampoChange = useCallback(
    (index: number, field: keyof Campo, value: any) => {
      setCampos((prevCampos) => {
        const newCampos = [...prevCampos];
        if (newCampos[index]) {
          newCampos[index] = {
            ...newCampos[index],
            [field]: value,
          };
        }
        return newCampos;
      });
    },
    []
  );

  // const handleRemoveCampo = (index: number) => {
  //   const newCampos = campos.filter((_, i) => i !== index);
  //   const reorderedCampos = newCampos.map((campo, i) => ({
  //     ...campo,
  //     orden: i + 1,
  //   }));
  //   setCampos(reorderedCampos);
  // };

  const handleSave = async () => {
    if (!selectedPlantilla) {
      showError('Error', 'No hay plantilla seleccionada');
      return;
    }

    try {
      setSaving(true);

      const camposParaEnviar = campos
        .filter((campo) => {
          if (campo.id?.startsWith('config-')) return true;

          if (campo.id?.startsWith('base-')) {
            const campoOriginal = selectedPlantilla.campos.find(
              (c) => c.campo === campo.campo
            );

            const ordenCambio = campoOriginal?.orden !== campo.orden;
            const estiloCambio =
              JSON.stringify(campoOriginal?.estilo || {}) !==
              JSON.stringify(campo.estilo || {});

            return ordenCambio || estiloCambio;
          }

          return false;
        })
        .map((campo) => ({
          campo: campo.campo,
          orden: campo.orden,
          estilo: campo.estilo,
        }));

      await guardarCamposPlantilla(selectedPlantilla.id, camposParaEnviar);
      showSuccess(
        'Campos guardados',
        'La configuración se ha guardado correctamente'
      );
      onClose();
    } catch (error: any) {
      showError(
        'Error al guardar',
        error.message || 'No se pudo guardar la configuración'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const estiloOptions = [
    { value: 'normal', label: 'Normal (Sin Estilo)' },
    { value: 'negrita', label: 'Negrita' },
    { value: 'inclinado', label: 'Inclinado' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Formato de Campos - ${proyectoNombre}`}
      size="xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando plantillas...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedPlantilla && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                {selectedPlantilla.nombre}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Modelo: {selectedPlantilla.model_name}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Configuración de Campos
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configura el orden y estilo de cada campo. Los nombres de los
              campos no pueden modificarse.
            </p>

            {campos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay campos configurados.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center mb-4">
                  <div className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
                    Campos Configurados
                  </div>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600 ml-4"></div>
                </div>
                {campos.map((campo, index) => {
                  const isFirstBaseField =
                    campo.id?.startsWith('base-') &&
                    index > 0 &&
                    campos[index - 1]?.id?.startsWith('config-');

                  return (
                    <div key={campo.id}>
                      {isFirstBaseField && (
                        <div className="flex items-center my-6">
                          <div className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                            Campos Base
                          </div>
                          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>

                          <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                      )}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre del Campo
                              </label>
                              <Input
                                value={campo.campo}
                                readOnly
                                className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                placeholder="Ej: titulo, autor, contenido..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Orden *
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={campo.orden}
                                onChange={(e) =>
                                  handleCampoChange(
                                    index,
                                    'orden',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="text-center"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Estilo
                              </label>
                              <Select
                                options={estiloOptions}
                                value={
                                  campo.estilo.negrita
                                    ? 'negrita'
                                    : campo.estilo.inclinado
                                    ? 'inclinado'
                                    : 'normal'
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === 'negrita') {
                                    handleCampoChange(index, 'estilo', {
                                      negrita: true,
                                    });
                                  } else if (value === 'inclinado') {
                                    handleCampoChange(index, 'estilo', {
                                      inclinado: true,
                                    });
                                  } else {
                                    handleCampoChange(index, 'estilo', {});
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveCampo(index)}
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                          title="Eliminar campo"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div> */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              disabled={saving || campos.length === 0}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CamposFormatoModal;
