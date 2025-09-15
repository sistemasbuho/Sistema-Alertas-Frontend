import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/ui/Modal';
import Button from '../../../shared/components/ui/Button';
import Input from '../../../shared/components/ui/Input';
import { useToast } from '@shared/contexts/ToastContext';

export interface AlertaData {
  id?: string;
  url: string;
  contenido: string;
  fecha: string;
  titulo?: string;
  autor?: string;
  reach?: number;
  emojis?: string[];
  mensaje_formateado?: string;
}

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
  const [formData, setFormData] = useState<AlertaData>({
    url: '',
    contenido: '',
    fecha: new Date().toISOString().slice(0, 16),
    titulo: '',
    autor: '',
    reach: 0,
    emojis: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editingAlert) {
        setFormData({
          ...editingAlert,
          fecha: editingAlert.fecha
            ? new Date(editingAlert.fecha).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
          reach: editingAlert.reach || 0,
          emojis: editingAlert.emojis || [],
        });
      } else {
        setFormData({
          url: '',
          contenido: '',
          fecha: new Date().toISOString().slice(0, 16),
          titulo: '',
          autor: '',
          reach: 0,
          emojis: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, editingAlert]);

  const handleInputChange =
    (field: keyof AlertaData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: field === 'reach' ? Number(value) || 0 : value,
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

    if (!formData.contenido.trim()) {
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
      const alertaToSave: AlertaData = {
        ...formData,
        fecha: new Date(formData.fecha).toISOString(),
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
            Contenido *
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
          label="Fecha y Hora *"
          type="datetime-local"
          value={formData.fecha}
          onChange={handleInputChange('fecha')}
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

        <Input
          label="Alcance (Reach)"
          type="number"
          min="0"
          value={formData.reach || ''}
          onChange={handleInputChange('reach')}
          error={errors.reach}
          placeholder="0"
          disabled={isLoading}
        />

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
