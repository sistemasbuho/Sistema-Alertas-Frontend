import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Input from '@shared/components/ui/Input';
import Button from '@shared/components/ui/Button';
import Modal from '@shared/components/ui/Modal';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getIngestionProjects,
  uploadIngestionDocument,
  triggerManualIngestion,
  type Proyecto,
} from '@shared/services/api';

const ACCEPTED_EXTENSIONS = ['xlsx', 'csv'];

const Ingestion: React.FC = () => {
  const navigate = useNavigate();
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
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fileInputKey, setFileInputKey] = useState<number>(0);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualProjectSearchTerm, setManualProjectSearchTerm] =
    useState<string>('');
  const [manualProjects, setManualProjects] = useState<Proyecto[]>([]);
  const [isManualLoadingProjects, setIsManualLoadingProjects] =
    useState<boolean>(false);
  const [manualHasSearchedProjects, setManualHasSearchedProjects] =
    useState<boolean>(false);
  const [manualProjectSearchError, setManualProjectSearchError] = useState<
    string | null
  >(null);
  const [manualSelectedProjectId, setManualSelectedProjectId] =
    useState<string>('');
  const [manualSelectedProjectName, setManualSelectedProjectName] =
    useState<string>('');
  const [manualUrl, setManualUrl] = useState<string>('');
  const [isManualSubmitting, setIsManualSubmitting] = useState<boolean>(false);

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

  useEffect(() => {
    if (!isManualModalOpen) {
      setManualProjects([]);
      setManualHasSearchedProjects(false);
      setIsManualLoadingProjects(false);
      setManualProjectSearchError(null);
      return;
    }

    const trimmedTerm = manualProjectSearchTerm.trim();

    if (!trimmedTerm) {
      setManualProjects([]);
      setManualHasSearchedProjects(false);
      setIsManualLoadingProjects(false);
      setManualProjectSearchError(null);
      return;
    }

    setIsManualLoadingProjects(true);
    setManualHasSearchedProjects(false);
    setManualProjectSearchError(null);
    let isCurrent = true;

    const handler = window.setTimeout(() => {
      const searchProjects = async () => {
        try {
          const data = await getIngestionProjects(trimmedTerm);
          if (isCurrent) {
            setManualProjects(data);
            setManualProjectSearchError(null);
          }
        } catch (error) {
          console.error(
            'Error al buscar proyectos para ingestión manual:',
            error
          );
          if (isCurrent) {
            showError(
              'Error al buscar proyectos',
              'No fue posible obtener la lista de proyectos disponibles.'
            );
            setManualProjects([]);
            setManualProjectSearchError(
              'Ocurrió un error al consultar los proyectos. Intenta nuevamente.'
            );
          }
        } finally {
          if (isCurrent) {
            setIsManualLoadingProjects(false);
            setManualHasSearchedProjects(true);
          }
        }
      };

      void searchProjects();
    }, 400);

    return () => {
      isCurrent = false;
      window.clearTimeout(handler);
    };
  }, [manualProjectSearchTerm, isManualModalOpen, showError]);

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
    setProjectSearchTerm(project.nombre);
    setProjects([]);
    setHasSearchedProjects(false);
  };

  const handleManualProjectSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setManualProjectSearchTerm(value);
    setManualSelectedProjectId('');
    setManualSelectedProjectName('');
    setManualHasSearchedProjects(false);
    setManualProjectSearchError(null);

    if (value.trim()) {
      setIsManualLoadingProjects(true);
    } else {
      setManualProjects([]);
      setIsManualLoadingProjects(false);
    }
  };

  const handleManualSelectProject = (project: Proyecto) => {
    setManualSelectedProjectId(project.id);
    setManualSelectedProjectName(project.nombre);
    setManualProjectSearchTerm(project.nombre);
    setManualProjects([]);
    setManualHasSearchedProjects(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    const invalidFiles = files.filter((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return !extension || !ACCEPTED_EXTENSIONS.includes(extension);
    });

    if (invalidFiles.length > 0) {
      showWarning(
        'Formato no soportado',
        `Los siguientes archivos no son válidos: ${invalidFiles
          .map((f) => f.name)
          .join(', ')}. Solo se permiten archivos en formato .xlsx o .csv.`
      );
      setSelectedFiles([]);
      setFileInputKey((prev) => prev + 1);
      return;
    }

    setSelectedFiles(files);
  };

  const handleManualSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!manualSelectedProjectId) {
      showWarning(
        'Proyecto requerido',
        'Selecciona un proyecto antes de enviar la alerta manual.'
      );
      return;
    }

    const trimmedUrl = manualUrl.trim();

    if (!trimmedUrl) {
      showWarning(
        'URL requerida',
        'Ingresa una URL válida para continuar con la ingestión manual.'
      );
      return;
    }

    try {
      // Validar formato de la URL
      new URL(trimmedUrl);
    } catch {
      showWarning(
        'URL inválida',
        'Verifica que la URL ingresada tenga un formato válido.'
      );
      return;
    }

    try {
      setIsManualSubmitting(true);
      const response = await triggerManualIngestion(
        manualSelectedProjectId,
        trimmedUrl
      );

      showSuccess(
        'Ingestión manual iniciada',
        'La alerta manual se ha enviado correctamente para su procesamiento.'
      );

      setIsManualModalOpen(false);
      setManualUrl('');

      navigate('/ingestion/resultados', {
        state: {
          ingestionResponse: response,
          projectId: manualSelectedProjectId,
          projectName: manualSelectedProjectName,
        },
      });
    } catch (error: any) {
      console.error('Error al enviar alerta manual de ingestión:', error);

      if (error?.response?.status === 400) {
        showError(
          'Error al enviar la alerta manual',
          'La URL ya existe para este proyecto'
        );
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Ocurrió un error al procesar la alerta manual.';
        showError('Error al enviar la alerta manual', message);
      }
    } finally {
      setIsManualSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isManualModalOpen) {
      setManualProjectSearchTerm('');
      setManualProjects([]);
      setManualHasSearchedProjects(false);
      setManualProjectSearchError(null);
      setManualSelectedProjectId('');
      setManualSelectedProjectName('');
      setManualUrl('');
    }
  }, [isManualModalOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProjectId) {
      showWarning(
        'Proyecto requerido',
        'Selecciona un proyecto antes de iniciar la ingestión.'
      );
      return;
    }

    if (selectedFiles.length === 0) {
      showWarning(
        'Archivo(s) requerido(s)',
        'Selecciona al menos un archivo .xlsx o .csv para continuar.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      // Procesar archivos uno por uno
      const results = [];
      for (const file of selectedFiles) {
        if (!file) continue;

        try {
          const response = await uploadIngestionDocument(
            selectedProjectId,
            file
          );
          results.push({ file: file.name, response, success: true });
        } catch (fileError) {
          console.error(`Error al subir ${file.name}:`, fileError);
          results.push({ file: file.name, error: fileError, success: false });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount === selectedFiles.length) {
        const mensaje =
          selectedFiles.length === 1
            ? 'El archivo se ha enviado correctamente para su procesamiento.'
            : `Los ${successCount} archivos se han enviado correctamente para su procesamiento.`;
        showSuccess('Ingestión iniciada', mensaje);
      } else if (successCount > 0) {
        const mensaje =
          selectedFiles.length === 1
            ? 'El archivo falló al procesarse.'
            : `${successCount} de ${selectedFiles.length} archivos enviados correctamente. ${failureCount} archivo(s) fallaron.`;
        showWarning('Ingestión parcial', mensaje);
      } else {
        const mensaje =
          selectedFiles.length === 1
            ? 'No se pudo enviar el archivo.'
            : `No se pudo enviar ninguno de los ${selectedFiles.length} archivos.`;
        showError('Error en la ingestión', mensaje);
        return;
      }

      setSelectedFiles([]);
      setFileInputKey((prev) => prev + 1);

      if (successCount > 0) {
        navigate('/ingestion/resultados', {
          state: {
            ingestionResponse:
              results.find((r) => r.success)?.response || results,
            multipleResults: results,
            projectId: selectedProjectId,
            projectName: selectedProjectName,
            isMultipleFiles: selectedFiles.length > 1,
          },
        });
      }
    } catch (error: any) {
      console.error('Error al enviar archivo(s) de ingestión:', error);
      const tituloError =
        selectedFiles.length === 1
          ? 'Error al enviar el archivo'
          : 'Error al enviar los archivos';

      if (error?.response?.status === 400) {
        showError(tituloError, 'La URL ya existe para este proyecto');
      } else {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          (selectedFiles.length === 1
            ? 'Ocurrió un error al procesar el archivo.'
            : 'Ocurrió un error al procesar los archivos.');
        showError(tituloError, message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedSearchTerm = projectSearchTerm.trim();
  const shouldShowProjectResults =
    !selectedProjectId &&
    (trimmedSearchTerm.length > 0 || isLoadingProjects || hasSearchedProjects);
  const trimmedManualSearchTerm = manualProjectSearchTerm.trim();
  const shouldShowManualProjectResults =
    isManualModalOpen &&
    !manualSelectedProjectId &&
    (trimmedManualSearchTerm.length > 0 ||
      isManualLoadingProjects ||
      manualHasSearchedProjects);

  return (
    <DashboardLayout title="Ingestión">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <Card.Header>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Envío de archivos para ingestión
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Busca un proyecto por nombre y carga un archivo en formato
                  .xlsx o .csv para iniciar el proceso de ingestión.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualModalOpen(true)}
              >
                Ingestión manual
              </Button>
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
                                  <span className="font-medium">
                                    {project.nombre}
                                  </span>
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
                          No se encontraron proyectos que coincidan con "
                          {trimmedSearchTerm}".
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
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
                  helperText="Formatos soportados: archivos .xlsx o .csv. Puedes seleccionar múltiples archivos."
                  required
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                  <p className="font-medium">
                    {selectedFiles.length === 1
                      ? 'Archivo listo para enviar'
                      : `${selectedFiles.length} archivos listos para enviar`}
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <p className="break-all text-xs">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = selectedFiles.filter(
                              (_, i) => i !== index
                            );
                            setSelectedFiles(newFiles);
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          title="Eliminar archivo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={
                    isSubmitting ||
                    !selectedProjectId ||
                    selectedFiles.length === 0 ||
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

      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Ingestión manual"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleManualSubmit}>
          <div className="space-y-3">
            <Input
              type="search"
              label="Proyecto"
              placeholder="Busca un proyecto por nombre"
              value={manualProjectSearchTerm}
              onChange={handleManualProjectSearchChange}
              autoComplete="off"
              helperText="Selecciona un proyecto para enviar la alerta manual."
            />

            {shouldShowManualProjectResults && (
              <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                {isManualLoadingProjects ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Buscando proyectos...
                  </div>
                ) : manualProjectSearchError ? (
                  <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {manualProjectSearchError}
                  </div>
                ) : manualProjects.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
                    {manualProjects.map((project) => {
                      const isSelected = manualSelectedProjectId === project.id;
                      return (
                        <li key={project.id}>
                          <button
                            type="button"
                            onClick={() => handleManualSelectProject(project)}
                            className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <span className="font-medium">
                              {project.nombre}
                            </span>
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
                ) : manualHasSearchedProjects ? (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron proyectos que coincidan con "
                    {trimmedManualSearchTerm}".
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    Escribe para buscar un proyecto por nombre.
                  </div>
                )}
              </div>
            )}

            {manualSelectedProjectId && manualSelectedProjectName && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                <p className="font-medium">Proyecto seleccionado</p>
                <p className="mt-1 break-all">
                  {manualSelectedProjectName}
                  <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-300">
                    ID: {manualSelectedProjectId}
                  </span>
                </p>
              </div>
            )}
          </div>

          <Input
            type="url"
            label="URL de la alerta"
            placeholder="https://ejemplo.com/articulo"
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
            helperText="Ingresa la URL que deseas procesar como alerta manual."
            required
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManualModalOpen(false)}
              disabled={isManualSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isManualSubmitting}
              disabled={
                isManualSubmitting ||
                !manualSelectedProjectId ||
                !manualUrl.trim()
              }
            >
              Enviar alerta
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Ingestion;
