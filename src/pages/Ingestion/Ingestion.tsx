import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Select from '@shared/components/ui/Select';
import Input from '@shared/components/ui/Input';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getIngestionProjects,
  uploadIngestionDocument,
  type Proyecto,
} from '@shared/services/api';

const ACCEPTED_EXTENSIONS = ['xlsx', 'csv'];

const Ingestion: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToast();
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fileInputKey, setFileInputKey] = useState<number>(0);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      const data = await getIngestionProjects();
      setProjects(data);
      setSelectedProjectId((current) => {
        if (!current) {
          return current;
        }

        const exists = data.some((project) => project.id === current);
        return exists ? current : '';
      });
    } catch (error) {
      console.error('Error al cargar proyectos para ingestión:', error);
      showError(
        'Error al cargar proyectos',
        'No fue posible obtener la lista de proyectos disponibles.'
      );
    } finally {
      setIsLoadingProjects(false);
    }
  }, [showError]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      showWarning(
        'Formato no soportado',
        'Solo se permiten archivos en formato .xlsx o .csv.'
      );
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProjectId) {
      showWarning(
        'Proyecto requerido',
        'Selecciona un proyecto antes de iniciar la ingestión.'
      );
      return;
    }

    if (!selectedFile) {
      showWarning(
        'Archivo requerido',
        'Selecciona un archivo .xlsx o .csv para continuar.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await uploadIngestionDocument(selectedProjectId, selectedFile);
      showSuccess(
        'Ingestión iniciada',
        'El archivo se ha enviado correctamente para su procesamiento.'
      );
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch (error: any) {
      console.error('Error al enviar archivo de ingestión:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error al procesar el archivo.';
      showError('Error al enviar el archivo', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.nombre,
  }));

  return (
    <DashboardLayout title="Ingestión">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <Card.Header>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Envío de archivos para ingestión
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Selecciona un proyecto con el filtro requerido y carga un archivo
                  en formato .xlsx o .csv para iniciar el proceso de ingestión.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void loadProjects();
                }}
                isLoading={isLoadingProjects}
              >
                Actualizar lista
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Select
                  label="Proyecto"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  options={projectOptions}
                  placeholder={
                    isLoadingProjects
                      ? 'Cargando proyectos...'
                      : 'Selecciona un proyecto'
                  }
                  disabled={isLoadingProjects || projects.length === 0}
                  required
                  helperText="Los proyectos se consultan usando el filtro nombre=Proyecto."
                />
                <Input
                  key={fileInputKey}
                  type="file"
                  label="Documento"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
                  helperText="Formatos soportados: archivos .xlsx o .csv."
                  required
                />
              </div>

              {selectedFile && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                  <p className="font-medium">Archivo listo para enviar</p>
                  <p className="mt-1 break-all">{selectedFile.name}</p>
                </div>
              )}

              {!isLoadingProjects && projects.length === 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  No se encontraron proyectos disponibles con el filtro solicitado.
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={
                    isSubmitting ||
                    !selectedProjectId ||
                    !selectedFile ||
                    isLoadingProjects
                  }
                >
                  Iniciar ingestión
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Ingestion;
