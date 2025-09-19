import React, { useEffect, useState } from 'react';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
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
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [hasSearchedProjects, setHasSearchedProjects] =
    useState<boolean>(false);
  const [projectSearchError, setProjectSearchError] = useState<string | null>(
    null
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] =
    useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fileInputKey, setFileInputKey] = useState<number>(0);

  useEffect(() => {
    const trimmedTerm = projectSearchTerm.trim();

    if (!trimmedTerm) {
      setProjects([]);
      setHasSearchedProjects(false);
      setIsLoadingProjects(false);
      setProjectSearchError(null);
      return;
    }

    setIsLoadingProjects(true);
    setHasSearchedProjects(false);
    setProjectSearchError(null);
    let isCurrent = true;

    const handler = window.setTimeout(() => {
      const searchProjects = async () => {
        try {
          const data = await getIngestionProjects(trimmedTerm);
          if (isCurrent) {
            setProjects(data);
            setProjectSearchError(null);
          }
        } catch (error) {
          console.error('Error al buscar proyectos para ingestión:', error);
          if (isCurrent) {
            showError(
              'Error al buscar proyectos',
              'No fue posible obtener la lista de proyectos disponibles.'
            );
            setProjects([]);
            setProjectSearchError(
              'Ocurrió un error al consultar los proyectos. Intenta nuevamente.'
            );
          }
        } finally {
          if (isCurrent) {
            setIsLoadingProjects(false);
            setHasSearchedProjects(true);
          }
        }
      };

      void searchProjects();
    }, 400);

    return () => {
      isCurrent = false;
      window.clearTimeout(handler);
    };
  }, [projectSearchTerm, showError]);

  const handleProjectSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setProjectSearchTerm(value);
    setSelectedProjectId('');
    setSelectedProjectName('');
    setHasSearchedProjects(false);
    setProjectSearchError(null);

    if (value.trim()) {
      setIsLoadingProjects(true);
    } else {
      setProjects([]);
      setIsLoadingProjects(false);
    }
  };

  const handleSelectProject = (project: Proyecto) => {
    setSelectedProjectId(project.id);
    setSelectedProjectName(project.nombre);
  };

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

  const trimmedSearchTerm = projectSearchTerm.trim();
  const shouldShowProjectResults =
    trimmedSearchTerm.length > 0 || isLoadingProjects || hasSearchedProjects;

  return (
    <DashboardLayout title="Ingestión">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <Card.Header>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Envío de archivos para ingestión
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Busca un proyecto por nombre y carga un archivo en formato
                .xlsx o .csv para iniciar el proceso de ingestión.
              </p>
            </div>
          </Card.Header>
          <Card.Content>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Input
                    type="search"
                    label="Proyecto"
                    placeholder="Busca un proyecto por nombre"
                    value={projectSearchTerm}
                    onChange={handleProjectSearchChange}
                    autoComplete="off"
                    helperText="Las coincidencias se consultan en la API usando el parámetro nombre."
                  />

                  {shouldShowProjectResults && (
                    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                      {isLoadingProjects ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Buscando proyectos...
                        </div>
                      ) : projectSearchError ? (
                        <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                          {projectSearchError}
                        </div>
                      ) : projects.length > 0 ? (
                        <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                          {projects.map((project) => {
                            const isSelected = selectedProjectId === project.id;
                            return (
                              <li key={project.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectProject(project)}
                                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                  }`}
                                  aria-pressed={isSelected}
                                >
                                  <span className="font-medium">{project.nombre}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {project.id}
                                  </span>
                                  {project.proveedor && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Proveedor: {project.proveedor}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                                      Seleccionado
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : hasSearchedProjects ? (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron proyectos que coincidan con "{trimmedSearchTerm}".
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Escribe para buscar un proyecto por nombre.
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProjectId && selectedProjectName && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                      <p className="font-medium">Proyecto seleccionado</p>
                      <p className="mt-1 break-all">
                        {selectedProjectName}
                        <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-300">
                          ID: {selectedProjectId}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

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
