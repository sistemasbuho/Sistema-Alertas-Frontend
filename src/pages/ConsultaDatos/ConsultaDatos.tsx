import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import {
  getMedios,
  getRedes,
  // capturaAlertaMedios,
  // capturaAlertaRedes,
  // updateAlerta, // COMENTADO - NO VA POR AHORA
  // enviarAlertasWhatsApp,
  enviarAlertasAPI,
  enviarAlertasIngestion,
  type MediosPaginationParams,
  type RedesPaginationParams,
  // type WhatsAppEnvioRequest,
  type EnvioAlertaRequest,
  type EnviarAlertasIngestionRequest,
  MarcarRevisadoRequest,
  marcarRevisadoAPI,
  exportarMedios,
  exportarRedes,
} from '@shared/services/api';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  // PlusIcon, // COMENTADO - NO VA POR AHORA
} from '@heroicons/react/24/outline';
// import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'; // COMENTADO - NO VA POR AHORA
// import AlertModal, { AlertaData } from '@shared/components/ui/AlertModal'; // COMENTADO - NO VA POR AHORA
import { DataTable, DataFilters, DataPagination } from './components';

type TabType = 'medios' | 'redes';

const ConsultaDatos: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('medios');
  const [medios, setMedios] = useState<any[]>([]);
  const [redes, setRedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // const [captureLoading, setCaptureLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  // const [showResultModal, setShowResultModal] = useState(false);
  // const [captureResult, setCaptureResult] = useState<{
  //   procesadas: any[];
  //   duplicadas: any[];
  //   mensaje: string;
  //   plantilla_mensaje?: any;
  //   codigo_acceso?: string;
  // } | null>(null);

  const [mediosPagination, setMediosPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 10,
  });

  const [redesPagination, setRedesPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 10,
  });

  const mediosFilters = useUrlFilters({
    usuario_nombre: '',
    proyecto_nombre: '',
    autor: '',
    url: '',
    estado_enviado: '',
    estado_revisado: '',
    medio_url: '',
    medio_url_coincide: '',
    red_social_nombre: '',
    created_at_desde: '',
    created_at_hasta: '',
  });

  const redesFilters = useUrlFilters({
    usuario_nombre: '',
    proyecto_nombre: '',
    autor: '',
    url: '',
    estado_enviado: '',
    estado_revisado: '',
    medio_url: '',
    medio_url_coincide: '',
    red_social_nombre: '',
    created_at_desde: '',
    created_at_hasta: '',
  });

  const [isInitializing, setIsInitializing] = useState(true);

  // ESTADOS COMENTADOS - FUNCIONALIDADES NO VAN POR AHORA
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>('all');
  // const [customText, setCustomText] = useState('');
  // const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  // const [editingAlert, setEditingAlert] = useState<any>(null);
  // const [isAlertLoading, setIsAlertLoading] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  // const [isEnviando, setIsEnviando] = useState(false);
  const [isEnviandoAlertas, setIsEnviandoAlertas] = useState(false);
  const [alertProgress, setAlertProgress] = useState({
    current: 0,
    total: 0,
    message: '',
  });
  const [isMarcandoRevisado, setIsMarcandoRevisado] = useState(false);

  // ESTADOS COMENTADOS - FUNCIONALIDADES NO VAN POR AHORA
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>('all');
  // const [customText, setCustomText] = useState('');
  // const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  // const [editingAlert, setEditingAlert] = useState<any>(null);
  // const [isAlertLoading, setIsAlertLoading] = useState(false);

  const getCurrentFilters = () => {
    const filters = activeTab === 'medios' ? mediosFilters : redesFilters;
    return filters;
  };

  const getProjectName = () => {
    const currentData = activeTab === 'medios' ? medios : redes;
    const item = currentData.find(
      (item) => item.proyecto === selectedProjectId
    );
    return item?.proyecto_nombre || selectedProjectId;
  };

  useEffect(() => {
    setIsInitializing(true);
    setSelectedItems([]);
    setSelectedProjectId('');

    if (activeTab === 'medios') {
      setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
    }

    loadData({ page: 1 }).finally(() => {
      setIsInitializing(false);
    });
  }, [activeTab]);

  useEffect(() => {
    if (!isInitializing && activeTab === 'medios') {
      setMediosPagination((prev) => ({ ...prev, currentPage: 1 }));
      loadData({ page: 1 });
    }
  }, [mediosFilters.filters]);

  useEffect(() => {
    if (!isInitializing && activeTab === 'redes') {
      setRedesPagination((prev) => ({ ...prev, currentPage: 1 }));
      loadData({ page: 1 });
    }
  }, [redesFilters.filters]);

  const loadData = async (params?: { page?: number; pageSize?: number }) => {
    try {
      setLoading(true);
      setSelectedItems([]);

      if (activeTab === 'medios') {
        const rawFilters = Object.fromEntries(
          Object.entries(mediosFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );

        const activeFilters: MediosPaginationParams = {
          page: params?.page || mediosPagination.currentPage,
          page_size: params?.pageSize || mediosPagination.pageSize,
        };

        Object.entries(rawFilters).forEach(([key, value]) => {
          if (key === 'proyecto_nombre') {
            activeFilters.proyecto = value;
          } else if (key === 'estado_enviado') {
            activeFilters.estado_enviado = value === 'true';
          } else if (key === 'estado_revisado') {
            activeFilters.estado_revisado = value === 'true';
          } else {
            (activeFilters as any)[key] = value;
          }
        });

        const response = await getMedios(activeFilters);
        setMedios(response.results);
        setMediosPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: params?.page || mediosPagination.currentPage,
          pageSize: params?.pageSize || mediosPagination.pageSize,
        });
      } else {
        const rawFilters = Object.fromEntries(
          Object.entries(redesFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );

        const activeFilters: RedesPaginationParams = {
          page: params?.page || redesPagination.currentPage,
          page_size: params?.pageSize || redesPagination.pageSize,
        };

        Object.entries(rawFilters).forEach(([key, value]) => {
          if (key === 'proyecto_nombre') {
            activeFilters.proyecto = value;
          } else if (key === 'estado_enviado') {
            activeFilters.estado_enviado = value === 'true';
          } else if (key === 'estado_revisado') {
            activeFilters.estado_revisado = value === 'true';
          } else {
            (activeFilters as any)[key] = value;
          }
        });

        const response = await getRedes(activeFilters);
        setRedes(response.results);
        setRedesPagination({
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: params?.page || redesPagination.currentPage,
          pageSize: params?.pageSize || redesPagination.pageSize,
        });
      }
    } catch (err: any) {
      console.error(`Error cargando ${activeTab}:`, err);
      showError(
        `Error al cargar ${activeTab}`,
        err.message || `Error al cargar los ${activeTab}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    return activeTab === 'medios' ? medios : redes;
  };

  const getCurrentPagination = () => {
    return activeTab === 'medios' ? mediosPagination : redesPagination;
  };

  const handlePageChange = (newPage: number) => {
    loadData({ page: newPage });
  };

  const handleNextPage = () => {
    const currentPagination = getCurrentPagination();
    if (currentPagination.next) {
      const nextPage = currentPagination.currentPage + 1;
      handlePageChange(nextPage);
    }
  };

  const handlePreviousPage = () => {
    const currentPagination = getCurrentPagination();
    if (currentPagination.previous) {
      const prevPage = currentPagination.currentPage - 1;
      handlePageChange(prevPage);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      const currentFilters = getCurrentFilters();
      const exportParams: MediosPaginationParams | RedesPaginationParams = {};

      if (currentFilters.filters.usuario_nombre) {
        exportParams.usuario_nombre = currentFilters.filters.usuario_nombre;
      }
      if (currentFilters.filters.proyecto_nombre) {
        exportParams.proyecto_nombre = currentFilters.filters.proyecto_nombre;
      }
      if (currentFilters.filters.autor) {
        exportParams.autor = currentFilters.filters.autor;
      }
      if (currentFilters.filters.url) {
        exportParams.url = currentFilters.filters.url;
      }
      if (currentFilters.filters.estado_enviado) {
        exportParams.estado_enviado = currentFilters.filters.estado_enviado === 'true';
      }
      if (currentFilters.filters.estado_revisado) {
        exportParams.estado_revisado = currentFilters.filters.estado_revisado === 'true';
      }
      if (currentFilters.filters.medio_url) {
        exportParams.medio_url = currentFilters.filters.medio_url;
      }
      if (currentFilters.filters.medio_url_coincide) {
        exportParams.medio_url_coincide = currentFilters.filters.medio_url_coincide;
      }
      if (currentFilters.filters.created_at_desde) {
        exportParams.created_at_desde = currentFilters.filters.created_at_desde;
      }
      if (currentFilters.filters.created_at_hasta) {
        exportParams.created_at_hasta = currentFilters.filters.created_at_hasta;
      }

      if (activeTab === 'redes' && currentFilters.filters.red_social_nombre) {
        (exportParams as RedesPaginationParams).red_social_nombre = currentFilters.filters.red_social_nombre;
      }

      const blob = activeTab === 'medios'
        ? await exportarMedios(exportParams as MediosPaginationParams)
        : await exportarRedes(exportParams as RedesPaginationParams);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      link.download = `${activeTab}-${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`${activeTab === 'medios' ? 'Medios' : 'Redes'} descargados correctamente`);
    } catch (error) {
      console.error('Error al descargar:', error);
      showError('Error al descargar el archivo. Por favor, intenta nuevamente.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const filteredData = getCurrentData().filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'medios') {
      return (
        item.titulo?.toLowerCase().includes(searchLower) ||
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower) ||
        item.proyecto_nombre?.toLowerCase().includes(searchLower) ||
        item.proyecto?.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        item.proyecto_nombre?.toLowerCase().includes(searchLower) ||
        item.proyecto?.toLowerCase().includes(searchLower)
      );
    }
  });

  const handlePageSizeChange = (newPageSize: number) => {
    if (activeTab === 'medios') {
      setMediosPagination((prev) => ({
        ...prev,
        pageSize: newPageSize,
        currentPage: 1,
      }));
    } else {
      setRedesPagination((prev) => ({
        ...prev,
        pageSize: newPageSize,
        currentPage: 1,
      }));
    }

    loadData({ page: 1, pageSize: newPageSize });
  };

  const handleSelectItem = (id: string) => {
    const currentData = activeTab === 'medios' ? medios : redes;
    const item = currentData.find((item) => item.id === id);

    if (!item) return;

    if (!selectedProjectId && selectedItems.length === 0) {
      setSelectedProjectId(item.proyecto);
    }

    if (selectedProjectId && item.proyecto !== selectedProjectId) {
      showError(
        `Solo puedes seleccionar elementos del proyecto: ${getProjectName()}`
      );
      return;
    }

    setSelectedItems((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      if (newSelection.length === 0) {
        setSelectedProjectId('');
      }

      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length && selectedProjectId) {
      setSelectedItems([]);
      setSelectedProjectId('');
    } else {
      if (!selectedProjectId && filteredData.length > 0) {
        const firstProject = filteredData[0].proyecto;
        setSelectedProjectId(firstProject);

        const sameProjectItems = filteredData
          .filter((item) => item.proyecto === firstProject)
          .map((item) => item.id);
        setSelectedItems(sameProjectItems);
      } else {
        const sameProjectItems = filteredData
          .filter((item) => item.proyecto === selectedProjectId)
          .map((item) => item.id);
        setSelectedItems(sameProjectItems);
      }
    }
  };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Agregar emoji o texto personalizado a todos los elementos seleccionados
   */
  // const handleAddEmojiToAll = (emoji: string) => {
  //   const currentData = getCurrentData();
  //   const updatedData = currentData.map((item) => {
  //     if (selectedItems.includes(item.id)) {
  //       const newEmojis = [...(item.emojis || []), emoji];
  //       return {
  //         ...item,
  //         emojis: newEmojis,
  //         mensaje_formateado:
  //           newEmojis.length > 0
  //             ? `${newEmojis.join(' ')} ${item.mensaje || item.contenido}`
  //             : item.mensaje || item.contenido,
  //       };
  //     }
  //     return item;
  //   });

  //   if (activeTab === 'medios') {
  //     setMedios(updatedData);
  //   } else {
  //     setRedes(updatedData);
  //   }
  //   setShowEmojiPicker(false);
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Agregar emoji o texto personalizado a un elemento específico
   */
  // const handleAddEmojiToItem = (itemId: string, emoji: string) => {
  //   const currentData = getCurrentData();
  //   const updatedData = currentData.map((item) => {
  //     if (item.id === itemId) {
  //       const newEmojis = [...(item.emojis || []), emoji];
  //       return {
  //         ...item,
  //         emojis: newEmojis,
  //         mensaje_formateado:
  //           newEmojis.length > 0
  //             ? `${newEmojis.join(' ')} ${item.mensaje || item.contenido}`
  //             : item.mensaje || item.contenido,
  //       };
  //     }
  //     return item;
  //   });

  //   if (activeTab === 'medios') {
  //     setMedios(updatedData);
  //   } else {
  //     setRedes(updatedData);
  //   }
  //   setShowEmojiPicker(false);
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Remover emoji de un elemento específico
   */
  // const handleRemoveEmoji = (itemId: string, emojiIndex: number) => {
  //   const currentData = getCurrentData();
  //   const updatedData = currentData.map((item) => {
  //     if (item.id === itemId) {
  //       const newEmojis =
  //         item.emojis?.filter(
  //           (_: string, index: number) => index !== emojiIndex
  //         ) || [];
  //       return {
  //         ...item,
  //         emojis: newEmojis,
  //         mensaje_formateado:
  //           newEmojis.length > 0
  //             ? `${newEmojis.join(' ')} ${item.mensaje || item.contenido}`
  //             : item.mensaje || item.contenido,
  //       };
  //     }
  //     return item;
  //   });

  //   if (activeTab === 'medios') {
  //     setMedios(updatedData);
  //   } else {
  //     setRedes(updatedData);
  //   }
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Abrir el picker de emojis
   */
  // const handleOpenEmojiPicker = (target: string | 'all') => {
  //   setEmojiPickerTarget(target);
  //   setCustomText('');
  //   setShowEmojiPicker(true);
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Manejar click en emoji del picker
   */
  // const handleEmojiClick = (emojiData: EmojiClickData) => {
  //   const emojiContent = customText.trim()
  //     ? `${emojiData.emoji} ${customText.trim()}`
  //     : emojiData.emoji;

  //   if (emojiPickerTarget === 'all') {
  //     handleAddEmojiToAll(emojiContent);
  //   } else {
  //     handleAddEmojiToItem(emojiPickerTarget, emojiContent);
  //   }
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Agregar solo texto personalizado sin emoji
   */
  // const handleAddCustomTextOnly = () => {
  //   if (!customText.trim()) return;

  //   if (emojiPickerTarget === 'all') {
  //     handleAddEmojiToAll(customText.trim());
  //   } else {
  //     handleAddEmojiToItem(emojiPickerTarget, customText.trim());
  //   }
  // };

  const handlePreviewItem = (item: any) => {
    setPreviewItem(item);
    setShowPreviewModal(true);
  };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Editar un elemento específico
   */
  // const handleEditItem = (item: any) => {
  //   setEditingAlert(item);
  //   setIsAlertModalOpen(true);
  // };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewItem(null);
  };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Cerrar modal de edición de alerta
   */
  // const handleCloseAlertModal = () => {
  //   setIsAlertModalOpen(false);
  //   setEditingAlert(null);
  // };

  /**
   * FUNCIONALIDAD COMENTADA - NO VA POR AHORA
   * Guardar cambios de una alerta editada
   */
  // const handleSaveAlert = async (alertData: AlertaData) => {
  //   setIsAlertLoading(true);

  //   try {
  //     if (editingAlert) {
  //       await updateAlerta(
  //         editingAlert.id,
  //         {
  //           url: alertData.url,
  //           contenido: alertData.contenido,
  //           fecha: alertData.fecha,
  //           titulo: alertData.titulo,
  //           autor: alertData.autor,
  //           reach: alertData.reach || 0,
  //         },
  //         activeTab,
  //         editingAlert.proyecto
  //       );

  //       const currentData = getCurrentData();
  //       const updatedData = currentData.map((item) =>
  //         item.id === editingAlert.id ? { ...item, ...alertData } : item
  //       );

  //       if (activeTab === 'medios') {
  //         setMedios(updatedData);
  //       } else {
  //         setRedes(updatedData);
  //       }

  //       showSuccess(
  //         'Elemento actualizado',
  //         'El elemento se ha actualizado correctamente'
  //       );

  //       handleCloseAlertModal();
  //     }
  //   } catch (error: any) {
  //     showError(
  //       'Error al actualizar',
  //       error.response?.data?.message || 'No se pudo actualizar el elemento'
  //     );
  //   } finally {
  //     setIsAlertLoading(false);
  //   }
  // };

  // const handleEnviarAlertas = async () => {
  //   if (selectedItems.length === 0) {
  //     showError(
  //       'Sin selección',
  //       'Debes seleccionar al menos una alerta para enviar'
  //     );
  //     return;
  //   }

  //   const selectedData = filteredData.filter((item) =>
  //     selectedItems.includes(item.id)
  //   );

  //   if (!selectedProjectId) {
  //     showError('Error de configuración', 'No se ha seleccionado un proyecto');
  //     return;
  //   }

  //   // Obtener información del proyecto para el grupo_id
  //   const projectInfo = selectedData[0]; // Los elementos seleccionados deben ser del mismo proyecto
  //   if (!projectInfo || !projectInfo.codigo_acceso) {
  //     showError(
  //       'Error de configuración',
  //       'No se encontró el código de acceso del grupo de WhatsApp'
  //     );
  //     return;
  //   }

  //   try {
  //     setIsEnviando(true);

  //     const payload: WhatsAppEnvioRequest = {
  //       proyecto_id: selectedProjectId,
  //       grupo_id: projectInfo.codigo_acceso,
  //       tipo_alerta: activeTab === 'medios' ? 'medio' : 'redes',
  //       alertas: selectedData.map((item) => {
  //         const mensaje = item.mensaje_formateado
  //           ? item.mensaje_formateado
  //           : item.emojis && item.emojis.length > 0
  //           ? `${item.emojis.join(' ')} ${item.mensaje || item.contenido}`
  //           : item.mensaje || item.contenido;

  //         return {
  //           publicacion_id: item.id,
  //           mensaje: mensaje,
  //         };
  //       }),
  //     };

  //     const result = await enviarAlertasWhatsApp(payload);

  //     const totalEnviadas = result.enviados.length;
  //     const totalNoEnviadas = result.no_enviados.length;

  //     if (totalEnviadas > 0) {
  //       showSuccess(
  //         'Alertas enviadas',
  //         `${result.success}. Enviadas: ${totalEnviadas}, No enviadas: ${totalNoEnviadas}`
  //       );

  //       // Limpiar selección después del envío exitoso
  //       setSelectedItems([]);
  //       setSelectedProjectId('');
  //     } else {
  //       showError('Error al enviar', 'No se pudo enviar ninguna alerta');
  //     }
  //   } catch (error: any) {
  //     console.error('Error enviando alertas a WhatsApp:', error);
  //     showError(
  //       'Error al enviar',
  //       error.message || 'No se pudieron enviar las alertas a WhatsApp'
  //     );
  //   } finally {
  //     setIsEnviando(false);
  //   }
  // };

  const handleEnviarAlertasAPI = async () => {
    if (selectedItems.length === 0) {
      showError(
        'Sin selección',
        'Debes seleccionar al menos una alerta para enviar'
      );
      return;
    }

    const selectedData = filteredData.filter((item) =>
      selectedItems.includes(item.id)
    );

    if (!selectedProjectId) {
      showError('Error de configuración', 'No se ha seleccionado un proyecto');
      return;
    }

    try {
      setIsEnviandoAlertas(true);
      setAlertProgress({
        current: 0,
        total: selectedData.length,
        message: 'Preparando alertas...',
      });

      const payload: EnviarAlertasIngestionRequest = {
        proyecto_id: selectedProjectId,
        tipo_alerta: activeTab === 'medios' ? 'medios' : 'redes',
        alertas: selectedData.map((item) => ({
          id: item.id,
          url: item.url,
          contenido: item.contenido,
          fecha:
            item.fecha_publicacion ||
            item.fecha ||
            item.created_at ||
            new Date().toISOString(),
          titulo: item.titulo || '',
          autor: item.autor || '',
          reach: item.reach ?? null,
          engagement: item.engagement ?? null,
          red_social: activeTab === 'redes' ? (item.red_social_nombre || item.red_social || '') : undefined,
        })),
      };

      setAlertProgress((prev) => ({
        ...prev,
        message: 'Enviando alertas a ingestion...',
      }));

      const result = await enviarAlertasIngestion(payload);

      const totalProcesadas = result.procesadas?.length || 0;
      const totalDuplicadas = result.duplicadas?.length || 0;

      setAlertProgress((prev) => ({
        ...prev,
        current: totalProcesadas,
        message: 'Finalizando envío...',
      }));

      if (result.success) {
        setAlertProgress((prev) => ({
          ...prev,
          current: prev.total,
          message: 'Alertas enviadas correctamente',
        }));

        showSuccess(
          'Alertas enviadas correctamente',
          `Procesadas: ${totalProcesadas}, Duplicadas: ${totalDuplicadas}`
        );

        setSelectedItems([]);
        setSelectedProjectId('');

        // Redirigir a la página de resultados con los datos
        setTimeout(() => {
          navigate('/ingestion/resultados', {
            state: {
              ingestionResponse: {
                mensaje: result.message,
                listado: result.procesadas || [],
                errores: [],
                duplicados: result.duplicadas?.length || 0,
                descartados: 0,
                proveedor: 'consulta_datos',
              },
              projectId: selectedProjectId,
              projectName: getProjectName(),
            },
          });
        }, 1500);
      } else {
        setAlertProgress((prev) => ({
          ...prev,
          message: 'Error en el envío',
        }));

        showError(
          'Error al enviar',
          result.message || 'No se pudieron enviar las alertas'
        );
      }
    } catch (error: any) {
      console.error('Error enviando alertas:', error);

      setAlertProgress((prev) => ({
        ...prev,
        message: 'Error en el envío',
      }));

      showError(
        'Error al enviar',
        error.message || 'No se pudieron enviar las alertas'
      );
    } finally {
      setIsEnviandoAlertas(false);
      setTimeout(() => {
        setAlertProgress({ current: 0, total: 0, message: '' });
      }, 2000);
    }
  };

  const handleMarcarRevisado = async () => {
    if (selectedItems.length === 0) {
      showError(
        'Sin selección',
        'Debes seleccionar al menos una alerta para marcar como revisada'
      );
      return;
    }

    try {
      setIsMarcandoRevisado(true);

      const payload: MarcarRevisadoRequest = {
        tipo_alerta: activeTab === 'medios' ? 'medios' : 'redes',
        alertas: selectedItems.map((id) => ({ id })),
      };

      const result = await marcarRevisadoAPI(payload);

      if (result.success) {
        showSuccess(
          'Alertas marcadas como revisadas',
          `Se han marcado ${selectedItems.length} alertas como revisadas exitosamente`
        );

        setSelectedItems([]);
        setSelectedProjectId('');
        await loadData();
      } else {
        showError('Error', result.message || 'Error al marcar como revisadas');
      }
    } catch (error: any) {
      console.error('Error marcando como revisado:', error);
      showError(
        'Error',
        error.response?.data?.message || 'Error al marcar como revisadas'
      );
    } finally {
      setIsMarcandoRevisado(false);
    }
  };

  // const handleSendToAlertas = async () => {
  //   const selectedData = filteredData.filter((item) =>
  //     selectedItems.includes(item.id)
  //   );

  //   if (selectedData.length === 0) {
  //     showError('Sin selección', 'No hay elementos seleccionados para enviar');
  //     return;
  //   }

  //   if (activeTab === 'medios') {
  //     try {
  //       setCaptureLoading(true);

  //       const capturePayload = {
  //         proyecto_id: selectedData[0]?.proyecto,
  //         enviar: true,
  //         alertas: selectedData.map((item) => ({
  //           id: item.id,
  //           url: item.url,
  //           contenido: item.contenido,
  //           fecha: item.fecha_publicacion,
  //           titulo: item.titulo,
  //           autor: item.autor,
  //           reach: item.reach,
  //         })),
  //       };

  //       const response = await capturaAlertaMedios(capturePayload);

  //       const totalProcesadas = response.procesadas?.length || 0;
  //       const totalDuplicadas = response.duplicadas?.length || 0;

  //       showSuccess(
  //         'Captura completada',
  //         `Procesadas: ${totalProcesadas}, Duplicadas: ${totalDuplicadas}`
  //       );

  //       await loadData();
  //     } catch (error: any) {
  //       console.error('Error en captura de medios:', error);
  //       showError(
  //         'Error en captura',
  //         error.message || 'Error al capturar alerta de medios'
  //       );
  //       return;
  //     } finally {
  //       setCaptureLoading(false);
  //     }
  //   } else {
  //     try {
  //       setCaptureLoading(true);

  //       const capturePayload = {
  //         proyecto_id: selectedData[0]?.proyecto,
  //         enviar: true,
  //         alertas: selectedData.map((item) => ({
  //           id: item.id,
  //           titulo: item.titulo || '',
  //           url: item.url,
  //           contenido: item.contenido,
  //           fecha: item.fecha_publicacion,
  //           autor: item.autor || '',
  //           reach: item.reach?.toString() || '0',
  //         })),
  //       };

  //       const response = await capturaAlertaRedes(capturePayload);

  //       // Mostrar notificación de éxito
  //       const totalProcesadas = response.procesadas?.length || 0;
  //       const totalDuplicadas = response.duplicadas?.length || 0;

  //       showSuccess(
  //         'Captura completada',
  //         `Procesadas: ${totalProcesadas}, Duplicadas: ${totalDuplicadas}`
  //       );

  //       // Recargar los datos para mostrar los nuevos elementos
  //       await loadData();
  //     } catch (error: any) {
  //       console.error('Error en captura de redes:', error);
  //       showError(
  //         'Error en captura',
  //         error.message || 'Error al capturar alerta de redes'
  //       );
  //       return;
  //     } finally {
  //       setCaptureLoading(false);
  //     }
  //   }
  // };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formateando fecha:', dateString, error);
      return 'Error en fecha';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const highlightKeywords = (
    text: string | null | undefined,
    keywords: string[] = []
  ) => {
    const safeText = text ?? '';
    if (!safeText) return '';
    if (!keywords || keywords.length === 0) return safeText;

    let highlightedText = safeText;

    keywords.forEach((keyword) => {
      if (keyword && keyword.trim()) {
        const regex = new RegExp(`(${keyword.trim()})`, 'gi');
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded">$1</mark>'
        );
      }
    });

    return highlightedText;
  };

  // const handleModalClose = () => {
  //   setShowResultModal(false);
  //   setCaptureResult(null);
  // };

  return (
    <DashboardLayout title="Consulta de Datos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Consulta de Datos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Consulta y selecciona medios o redes sociales para enviar a
              alertas
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('medios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'medios'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Medios
            </button>
            <button
              onClick={() => setActiveTab('redes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'redes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Redes
            </button>
          </nav>
        </div>

        <Card>
          <Card.Content className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Buscar ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                  >
                    <FunnelIcon className="h-4 w-4" />
                    Filtros
                    {getCurrentFilters().hasActiveFilters() && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {
                          Object.values(getCurrentFilters().filters).filter(
                            (v) => v && v.trim() !== ''
                          ).length
                        }
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={handleDownload}
                    disabled={downloadLoading}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                    title={`Descargar ${activeTab === 'medios' ? 'medios' : 'redes'} (Excel)`}
                  >
                    {downloadLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    )}
                    {downloadLoading ? 'Descargando...' : 'Descargar'}
                  </Button>

                </div>

                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    {/* <Button
                      onClick={() => handleOpenEmojiPicker('all')}
                      variant="outline"
                      className="inline-flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Agregar emoji
                    </Button> */}
                    <Button
                      onClick={handleMarcarRevisado}
                      disabled={isMarcandoRevisado}
                      variant="outline"
                      className="inline-flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 dark:bg-green-900/10 dark:hover:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    >
                      {isMarcandoRevisado ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          Marcando...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Revisados
                        </>
                      )}
                    </Button>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleEnviarAlertasAPI}
                        disabled={isEnviandoAlertas}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isEnviandoAlertas ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                            Enviar Alertas
                          </>
                        )}
                      </Button>

                      {isEnviandoAlertas && alertProgress.total > 0 && (
                        <div className="w-full">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {alertProgress.message}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {alertProgress.current}/{alertProgress.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{
                                width: `${
                                  (alertProgress.current /
                                    alertProgress.total) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {selectedItems.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItems.length} seleccionados
                    </span>
                    {selectedProjectId && selectedItems.length > 0 && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                        📂 {getProjectName()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {showFilters && (
                <DataFilters
                  activeTab={activeTab}
                  mediosFilters={mediosFilters}
                  redesFilters={redesFilters}
                />
              )}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Cargando {activeTab}...
                </p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm
                    ? `No se encontraron ${activeTab} que coincidan con tu búsqueda.`
                    : `No hay ${activeTab} disponibles.`}
                </p>
              </div>
            ) : (
              <DataTable
                activeTab={activeTab}
                filteredData={filteredData}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                formatDate={formatDate}
                formatNumber={formatNumber}
                onAddEmoji={() => {}}
                onRemoveEmoji={() => {}}
                onEditItem={() => {}}
                // onAddEmoji={handleOpenEmojiPicker}
                // onRemoveEmoji={handleRemoveEmoji}
                // onEditItem={handleEditItem}
                onPreviewItem={handlePreviewItem}
                highlightKeywords={highlightKeywords}
                showEmojiActions={false}
                showEditActions={false}
              />
            )}

            <DataPagination
              activeTab={activeTab}
              currentData={getCurrentData()}
              pagination={getCurrentPagination()}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </Card.Content>
        </Card>
      </div>
      {/* {showEmojiPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Agregar Emoji y Texto
              </h3>
              <Button
                onClick={() => setShowEmojiPicker(false)}
                size="sm"
                className="p-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto personalizado (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Escribe un texto personalizado..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customText.trim()) {
                      handleAddCustomTextOnly();
                      setShowEmojiPicker(false);
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    handleAddCustomTextOnly();
                    setShowEmojiPicker(false);
                  }}
                  disabled={!customText.trim()}
                  size="sm"
                  variant="outline"
                >
                  Solo Texto
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Presiona Enter o selecciona un emoji. El texto se agregará
                automáticamente.
              </p>
            </div>

            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={350}
              height={400}
            />
          </div>
        </div>
      )} */}

      {showPreviewModal && previewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Vista Previa del Mensaje
                </h3>
              </div>
              <Button
                onClick={handleClosePreview}
                size="sm"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Mensaje que se enviará
                    </span>
                  </div>
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
                      <p className="text-gray-900 dark:text-white text-base leading-relaxed whitespace-pre-wrap font-medium">
                        {previewItem.mensaje_formateado ||
                          (previewItem.emojis && previewItem.emojis.length > 0
                            ? `${previewItem.emojis.join(' ')} ${
                                previewItem.mensaje || previewItem.contenido
                              }`
                            : previewItem.mensaje || previewItem.contenido)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Detalles del contenido
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Autor
                          </span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {previewItem.autor || 'Sin autor'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Fecha de publicación
                          </span>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {formatDate(
                              previewItem.fecha_publicacion || previewItem.fecha
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {previewItem.reach && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Alcance
                            </span>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {formatNumber(previewItem.reach)} personas
                            </p>
                          </div>
                        )}
                        {previewItem.titulo && (
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Título
                            </span>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {previewItem.titulo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {previewItem.url && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          URL original
                        </span>
                        <div className="mt-1">
                          <a
                            href={previewItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            <span className="truncate max-w-md">
                              {previewItem.url}
                            </span>
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-end">
                <Button
                  onClick={handleClosePreview}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* <AlertModal
        isOpen={isAlertModalOpen}
        onClose={handleCloseAlertModal}
        onSave={handleSaveAlert}
        editingAlert={editingAlert}
        isLoading={isAlertLoading}
      /> */}
    </DashboardLayout>
  );
};

export default ConsultaDatos;
