import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useToast } from '@shared/contexts/ToastContext';

export interface AlertaData {
  id?: string;
  url: string;
  contenido: string;
  fecha: string;
  titulo?: string;
  autor?: string;
  reach?: number;
  engagement?: number;
  emojis?: string[];
  mensaje_formateado?: string;
  tipo?: string;
  red_social?: string;
}

type AlertFormData = AlertaData & {
  fechaHora: string; // datetime-local format: YYYY-MM-DDTHH:mm
};

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alerta: AlertaData) => Promise<void>;
  editingAlert?: AlertaData | null;
  isLoading?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAlert,
  isLoading = false,
}) => {
  const { showError } = useToast();
  const createDefaultFormData = (): AlertFormData => {
    // Formato para datetime-local: YYYY-MM-DDTHH:mm
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    return {
      url: '',
      contenido: '',
      fecha: now.toISOString(),
      fechaHora: `${year}-${month}-${day}T${hours}:${minutes}`,
      titulo: '',
      autor: '',
      reach: 0,
      engagement: 0,
      emojis: [],
    };
  };

  const [formData, setFormData] = useState<AlertFormData>(createDefaultFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editingAlert) {
        const defaultData = createDefaultFormData();

        let fechaHora = defaultData.fechaHora;

        if (editingAlert.fecha) {
          const date = new Date(editingAlert.fecha);

          // Detectar si la fecha es UTC o local
          const isUTC = editingAlert.fecha.endsWith('Z') ||
                        (editingAlert.fecha.includes('T') && editingAlert.fecha.includes('+'));

          let year, month, day, hours, minutes;

          if (isUTC) {
            // Si es UTC, usar métodos UTC para mantener la hora exacta
            year = date.getUTCFullYear();
            month = String(date.getUTCMonth() + 1).padStart(2, '0');
            day = String(date.getUTCDate()).padStart(2, '0');
            hours = String(date.getUTCHours()).padStart(2, '0');
            minutes = String(date.getUTCMinutes()).padStart(2, '0');
          } else {
            // Si es hora local del backend, usar métodos locales
            year = date.getFullYear();
            month = String(date.getMonth() + 1).padStart(2, '0');
            day = String(date.getDate()).padStart(2, '0');
            hours = String(date.getHours()).padStart(2, '0');
            minutes = String(date.getMinutes()).padStart(2, '0');
          }

          fechaHora = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        setFormData({
          ...defaultData,
          ...editingAlert,
          fechaHora,
          reach: editingAlert.reach || 0,
          engagement: editingAlert.engagement || 0,
          emojis: editingAlert.emojis || [],
        });
      } else {
        setFormData(createDefaultFormData());
      }
      setErrors({});
    }
  }, [isOpen, editingAlert]);

  const handleInputChange =
    (field: keyof AlertFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]:
          field === 'reach' || field === 'engagement'
            ? Number(value) || 0
            : value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.url.trim()) {
      newErrors.url = 'La URL es requerida';
    } else if (!/^https?:\/\/.+/.test(formData.url.trim())) {
      newErrors.url =
        'La URL debe ser válida (debe empezar con http:// o https://)';
    }

    // El contenido NO es obligatorio cuando se edita una alerta desde ingestion
    // (tanto para medios como para redes)
    if (!editingAlert && !formData.contenido.trim()) {
      newErrors.contenido = 'El contenido es requerido';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError(
        'Formulario incompleto',
        'Por favor completa todos los campos requeridos'
      );
      return;
    }

    try {
      // El datetime-local da formato YYYY-MM-DDTHH:mm en hora LOCAL del navegador
      // Necesitamos convertirlo a ISO pero respetando que es hora local, no UTC
      let fechaIso: string;

      if (formData.fechaHora) {
        // Parsearlo como fecha local y luego generar el ISO en zona horaria local
        const localDate = new Date(formData.fechaHora);

        // Obtener el offset de zona horaria en minutos
        const offset = localDate.getTimezoneOffset();
        const offsetHours = Math.abs(Math.floor(offset / 60));
        const offsetMinutes = Math.abs(offset % 60);
        const offsetSign = offset <= 0 ? '+' : '-';

        // Construir el string ISO con la zona horaria local
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = '00';

        fechaIso = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
      } else {
        fechaIso = new Date().toISOString();
      }

      console.log('📅 AlertModal - Fecha original:', editingAlert?.fecha);
      console.log('📅 AlertModal - fechaHora del input:', formData.fechaHora);
      console.log('📅 AlertModal - fechaIso que se enviará:', fechaIso);

      const { fechaHora, ...formDataWithoutFechaHora } = formData;

      const alertaToSave: AlertaData = {
        ...formDataWithoutFechaHora,
        fecha: fechaIso,
        id: editingAlert?.id,
      };

      await onSave(alertaToSave);
      onClose();
    } catch (error: any) {
      showError(
        'Error al guardar',
        error.message || 'Ocurrió un error al guardar la alerta'
      );
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const title = editingAlert ? 'Editar Alerta' : 'Agregar Nueva Alerta';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="URL *"
          type="url"
          value={formData.url}
          onChange={handleInputChange('url')}
          error={errors.url}
          placeholder="https://ejemplo.com/noticia"
          disabled={isLoading}
        />

        <Input
          label="Título"
          type="text"
          value={formData.titulo || ''}
          onChange={handleInputChange('titulo')}
          error={errors.titulo}
          placeholder="Título de la noticia o publicación"
          disabled={isLoading}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contenido {!editingAlert && '*'}
          </label>
          <textarea
            value={formData.contenido}
            onChange={handleInputChange('contenido')}
            rows={4}
            className={`
              w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400
              transition-colors resize-vertical
              ${
                errors.contenido
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                  : ''
              }
            `}
            placeholder="Contenido de la alerta..."
            disabled={isLoading}
          />
          {errors.contenido && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.contenido}
            </p>
          )}
        </div>

        <Input
          label="Fecha y Hora"
          type="datetime-local"
          value={formData.fechaHora}
          onChange={handleInputChange('fechaHora')}
          error={errors.fecha}
          disabled={isLoading}
        />

        <Input
          label="Autor"
          type="text"
          value={formData.autor || ''}
          onChange={handleInputChange('autor')}
          error={errors.autor}
          placeholder="Nombre del autor"
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Alcance (Reach)"
            type="text"
            value={formData.reach !== undefined && formData.reach !== null && formData.reach !== 0
              ? new Intl.NumberFormat('es-CO').format(Number(formData.reach))
              : formData.reach === 0 ? '0' : ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\./g, '');
              const numValue = value === '' ? 0 : Number(value);
              setFormData((prev) => ({
                ...prev,
                reach: isNaN(numValue) ? 0 : numValue,
              }));
              if (errors.reach) {
                setErrors((prev) => ({ ...prev, reach: '' }));
              }
            }}
            error={errors.reach}
            placeholder="0"
            disabled={isLoading}
          />

          <Input
            label="Interacción (Engagement)"
            type="text"
            value={formData.engagement !== undefined && formData.engagement !== null && formData.engagement !== 0
              ? new Intl.NumberFormat('es-CO').format(Number(formData.engagement))
              : formData.engagement === 0 ? '0' : ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\./g, '');
              const numValue = value === '' ? 0 : Number(value);
              setFormData((prev) => ({
                ...prev,
                engagement: isNaN(numValue) ? 0 : numValue,
              }));
              if (errors.engagement) {
                setErrors((prev) => ({ ...prev, engagement: '' }));
              }
            }}
            error={errors.engagement}
            placeholder="0"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {editingAlert ? 'Actualizar' : 'Agregar'} Alerta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AlertModal;
