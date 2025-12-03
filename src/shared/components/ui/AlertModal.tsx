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
  hora: string;
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
    const nowIso = new Date().toISOString();

    return {
      url: '',
      contenido: '',
      fecha: nowIso.slice(0, 10),
      hora: nowIso.slice(11, 16),
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

        let fecha = defaultData.fecha;
        let hora = defaultData.hora;

        if (editingAlert.fecha) {
          const date = new Date(editingAlert.fecha);

          // Formatear fecha en hora local (YYYY-MM-DD)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          fecha = `${year}-${month}-${day}`;

          // Formatear hora en hora local (HH:MM)
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          hora = `${hours}:${minutes}`;
        }

        setFormData({
          ...defaultData,
          ...editingAlert,
          fecha,
          hora,
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
      const buildFechaIsoString = () => {
        if (!formData.fecha) {
          return editingAlert?.fecha || new Date().toISOString();
        }

        if (editingAlert?.fecha) {
          const originalDateIso = new Date(editingAlert.fecha)
            .toISOString();
          const originalDate = originalDateIso.slice(0, 10);
          const originalTime = originalDateIso.slice(11, 16);

          if (
            originalDate === formData.fecha &&
            originalTime === (formData.hora || '')
          ) {
            return editingAlert.fecha;
          }
        }

        const [yearStr, monthStr, dayStr] = formData.fecha.split('-');
        const [hourStr = '0', minuteStr = '0'] = (formData.hora || '').split(':');

        if (!yearStr || !monthStr || !dayStr) {
          return new Date(formData.fecha).toISOString();
        }

        const year = Number.parseInt(yearStr, 10);
        const month = Number.parseInt(monthStr, 10);
        const day = Number.parseInt(dayStr, 10);
        const hours = Number.parseInt(hourStr, 10);
        const minutes = Number.parseInt(minuteStr, 10);

        if (
          Number.isNaN(year) ||
          Number.isNaN(month) ||
          Number.isNaN(day) ||
          Number.isNaN(hours) ||
          Number.isNaN(minutes)
        ) {
          return new Date(formData.fecha).toISOString();
        }

        // Construir ISO string manteniendo la hora exacta ingresada (sin conversión de zona horaria)
        const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
        return isoString;
      };

      const { hora, ...formDataWithoutHora } = formData;

      const alertaToSave: AlertaData = {
        ...formDataWithoutHora,
        fecha: buildFechaIsoString(),
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
          label="Fecha"
          type="date"
          value={formData.fecha}
          onChange={handleInputChange('fecha')}
          error={errors.fecha}
          disabled={isLoading}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hora
          </label>
          <div className="flex gap-2">
            <select
              value={formData.hora ? parseInt(formData.hora.split(':')[0]) % 12 || 12 : 12}
              onChange={(e) => {
                const hour12 = parseInt(e.target.value);
                const currentMinutes = formData.hora ? formData.hora.split(':')[1] : '00';
                const isPM = formData.hora ? parseInt(formData.hora.split(':')[0]) >= 12 : false;
                const hour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                setFormData((prev) => ({
                  ...prev,
                  hora: `${String(hour24).padStart(2, '0')}:${currentMinutes}`
                }));
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                <option key={hour} value={hour}>{hour}</option>
              ))}
            </select>
            <select
              value={formData.hora ? formData.hora.split(':')[1] : '00'}
              onChange={(e) => {
                const currentHour = formData.hora ? formData.hora.split(':')[0] : '00';
                setFormData((prev) => ({
                  ...prev,
                  hora: `${currentHour}:${e.target.value}`
                }));
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                <option key={minute} value={String(minute).padStart(2, '0')}>
                  {String(minute).padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              value={formData.hora && parseInt(formData.hora.split(':')[0]) >= 12 ? 'PM' : 'AM'}
              onChange={(e) => {
                const hour12 = formData.hora ? parseInt(formData.hora.split(':')[0]) % 12 || 12 : 12;
                const currentMinutes = formData.hora ? formData.hora.split(':')[1] : '00';
                const isPM = e.target.value === 'PM';
                const hour24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                setFormData((prev) => ({
                  ...prev,
                  hora: `${String(hour24).padStart(2, '0')}:${currentMinutes}`
                }));
              }}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

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
              ? new Intl.NumberFormat('es-ES').format(Number(formData.reach))
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
              ? new Intl.NumberFormat('es-ES').format(Number(formData.engagement))
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
