import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import { enviarAlertas } from '@shared/services/api';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface AlertaItem {
  id: string;
  url: string;
  contenido: string;
  fecha: string;
  titulo?: string;
  autor?: string;
  reach?: number;
  engagement?: number;
  emojis?: string[];
}

interface LocationState {
  selectedItems: AlertaItem[];
  tipo: 'medios' | 'redes';
  proyectoId: string;
}

const AlertasPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const state = location.state as LocationState;
  const [alertas, setAlertas] = useState<AlertaItem[]>(
    state?.selectedItems || []
  );
  const [isEnviando, setIsEnviando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlertas, setFilteredAlertas] = useState<AlertaItem[]>(alertas);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<string | 'all'>(
    'all'
  );

  if (!state || !state.selectedItems.length) {
    return (
      <DashboardLayout title="Alertas">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No hay elementos seleccionados para enviar alertas.
          </p>
          <Button onClick={() => navigate('/consulta-datos')} className="mt-4">
            Volver a Consulta de Datos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    const filtered = alertas.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.contenido.toLowerCase().includes(searchLower) ||
        (item.titulo && item.titulo.toLowerCase().includes(searchLower)) ||
        (item.autor && item.autor.toLowerCase().includes(searchLower)) ||
        item.url.toLowerCase().includes(searchLower)
      );
    });
    setFilteredAlertas(filtered);
  }, [alertas, searchTerm]);

  const handleRemoveAlerta = (id: string) => {
    setAlertas((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddEmojiToAll = (emoji: string) => {
    setAlertas((prev) =>
      prev.map((item) => ({
        ...item,
        emojis: [...(item.emojis || []), emoji],
      }))
    );
    setShowEmojiPicker(false);
    showSuccess('Emoji agregado', `Se agregó ${emoji} a todas las alertas`);
  };

  const handleAddEmojiToItem = (alertaId: string, emoji: string) => {
    setAlertas((prev) =>
      prev.map((item) =>
        item.id === alertaId
          ? { ...item, emojis: [...(item.emojis || []), emoji] }
          : item
      )
    );
    setShowEmojiPicker(false);
    showSuccess('Emoji agregado', `Se agregó ${emoji} a la alerta`);
  };

  const handleRemoveEmoji = (alertaId: string, emojiIndex: number) => {
    setAlertas((prev) =>
      prev.map((item) =>
        item.id === alertaId
          ? {
              ...item,
              emojis:
                item.emojis?.filter((_, index) => index !== emojiIndex) || [],
            }
          : item
      )
    );
  };

  const handleOpenEmojiPicker = (target: string | 'all') => {
    setEmojiPickerTarget(target);
    setShowEmojiPicker(true);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiPickerTarget === 'all') {
      handleAddEmojiToAll(emojiData.emoji);
    } else {
      handleAddEmojiToItem(emojiPickerTarget, emojiData.emoji);
    }
  };

  const handleEnviarAlertas = async () => {
    try {
      setIsEnviando(true);

      const payload = {
        proyecto_id: state.proyectoId,
        enviar: true,
        alertas: alertas.map((item) => ({
          url: item.url,
          contenido:
            item.emojis && item.emojis.length > 0
              ? `${item.emojis.join(' ')} ${item.contenido}`
              : item.contenido,
          fecha: item.fecha,
          emojis: item.emojis || [],
        })),
      };

      await enviarAlertas(payload);

      showSuccess(
        'Alertas enviadas',
        `Se han enviado ${alertas.length} alertas correctamente`
      );

      navigate('/consulta-datos');
    } catch (error: any) {
      console.error('Error enviando alertas:', error);
      showError('Error al enviar', 'No se pudieron enviar las alertas');
    } finally {
      setIsEnviando(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconForUrl = (url: string) => {
    if (url.includes('twitter.com') || url.includes('x.com')) {
      return (
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    }
    if (url.includes('facebook.com')) {
      return (
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );
    }
    if (url.includes('instagram.com')) {
      return (
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.017 0C8.396 0 7.989.016 6.756.072 5.526.127 4.73.302 4.032.567a5.892 5.892 0 0 0-2.13 1.387A5.892 5.892 0 0 0 .567 4.032C.302 4.73.127 5.526.072 6.756.016 7.989 0 8.396 0 12.017c0 3.624.016 4.031.072 5.264.055 1.23.23 2.025.495 2.723.266.789.637 1.459 1.387 2.13.671.75 1.341 1.121 2.13 1.387.698.265 1.494.44 2.723.495 1.233.056 1.64.072 5.264.072 3.624 0 4.031-.016 5.264-.072 1.23-.055 2.025-.23 2.723-.495a5.892 5.892 0 0 0 2.13-1.387 5.892 5.892 0 0 0 1.387-2.13c.265-.698.44-1.494.495-2.723.056-1.233.072-1.64.072-5.264 0-3.621-.016-4.028-.072-5.261-.055-1.23-.23-2.025-.495-2.723a5.892 5.892 0 0 0-1.387-2.13A5.892 5.892 0 0 0 19.25.567c-.698-.265-1.494-.44-2.723-.495C15.294.016 14.887 0 11.263 0h.754zm-.132 2.25c3.57 0 3.996.014 5.407.07 1.305.059 2.012.274 2.482.456.624.243 1.07.533 1.537 1 .467.467.757.913 1 1.537.182.47.397 1.177.456 2.482.056 1.411.07 1.837.07 5.407 0 3.57-.014 3.996-.07 5.407-.059 1.305-.274 2.012-.456 2.482-.243.624-.533 1.07-1 1.537-.467.467-.913.757-1.537 1-.47.182-1.177.397-2.482.456-1.411.056-1.837.07-5.407.07-3.57 0-3.996-.014-5.407-.07-1.305-.059-2.012-.274-2.482-.456-.624-.243-1.07-.533-1.537-1-.467-.467-.757-.913-1-1.537-.182-.47-.397-1.177-.456-2.482-.056-1.411-.07-1.837-.07-5.407 0-3.57.014-3.996.07-5.407.059-1.305.274-2.012.456-2.482.243-.624.533-1.07 1-1.537.467-.467.913-.757 1.537-1 .47-.182 1.177-.397 2.482-.456 1.411-.056 1.837-.07 5.407-.07l-.002-.002zm-.717 3.998c-3.628 0-6.565 2.937-6.565 6.565 0 3.628 2.937 6.565 6.565 6.565 3.628 0 6.565-2.937 6.565-6.565 0-3.628-2.937-6.565-6.565-6.565zm0 10.83c-2.355 0-4.265-1.91-4.265-4.265 0-2.355 1.91-4.265 4.265-4.265 2.355 0 4.265 1.91 4.265 4.265 0 2.355-1.91 4.265-4.265 4.265zm8.377-11.085c0 .847-.687 1.535-1.535 1.535-.847 0-1.535-.688-1.535-1.535 0-.847.688-1.535 1.535-1.535.848 0 1.535.688 1.535 1.535z" />
          </svg>
        </div>
      );
    }
    if (url.includes('linkedin.com')) {
      return (
        <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </div>
      );
    }
    if (url.includes('youtube.com')) {
      return (
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );
    }
    if (url.includes('tiktok.com')) {
      return (
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center shadow-lg">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
          />
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout title="Vista Previa de Alertas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/consulta-datos')}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Alertas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {alertas.length} alertas seleccionadas para enviar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {}}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Alerta
            </Button>
            <Button
              onClick={handleEnviarAlertas}
              disabled={alertas.length === 0 || isEnviando}
              isLoading={isEnviando}
              className="inline-flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {isEnviando ? 'Enviando...' : 'Enviar Alertas'}
            </Button>
          </div>
        </div>

        <Card>
          <Card.Content className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Buscar alerta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                  <option>Fecha</option>
                  <option>Última semana</option>
                  <option>Último mes</option>
                </select>

                {state?.tipo === 'redes' && (
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                    <option>Red social</option>
                    <option>Twitter</option>
                    <option>Facebook</option>
                    <option>Instagram</option>
                    <option>LinkedIn</option>
                    <option>YouTube</option>
                    <option>TikTok</option>
                  </select>
                )}
              </div>

              <Button
                onClick={() => handleOpenEmojiPicker('all')}
                className="inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar emoji
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mensaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reach
                  </th>
                  {state?.tipo === 'redes' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Engagement
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAlertas.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIconForUrl(item.url)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.autor || 'Sin autor'}
                            </span>
                            {state?.tipo === 'redes' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {item.url.includes('twitter.com') ||
                                item.url.includes('x.com')
                                  ? 'Twitter'
                                  : item.url.includes('facebook.com')
                                  ? 'Facebook'
                                  : item.url.includes('instagram.com')
                                  ? 'Instagram'
                                  : item.url.includes('linkedin.com')
                                  ? 'LinkedIn'
                                  : item.url.includes('youtube.com')
                                  ? 'YouTube'
                                  : item.url.includes('tiktok.com')
                                  ? 'TikTok'
                                  : 'Alerta subida hoy'}
                              </span>
                            )}
                          </div>
                          {item.titulo && (
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {item.titulo}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {item.contenido}
                          </p>

                          {item.emojis && item.emojis.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 mb-2">
                              {item.emojis.map((emoji, index) => (
                                <button
                                  key={index}
                                  onClick={() =>
                                    handleRemoveEmoji(item.id, index)
                                  }
                                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                  title="Clic para remover"
                                >
                                  <span className="mr-1">{emoji}</span>
                                  <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-red-500" />
                                </button>
                              ))}
                            </div>
                          )}

                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 inline-block"
                          >
                            🔗 enlace
                          </a>
                          {state?.tipo === 'redes' && (
                            <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                Reach{' '}
                                {item.reach ? item.reach.toLocaleString() : '0'}
                              </span>
                              <span>
                                Eng.{' '}
                                {item.engagement
                                  ? item.engagement.toLocaleString()
                                  : '0'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.reach ? item.reach.toLocaleString() : '0'}
                    </td>
                    {state?.tipo === 'redes' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.engagement
                          ? item.engagement.toLocaleString()
                          : '0'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => window.open(item.url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1"
                          title="Ver enlace"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleOpenEmojiPicker(item.id)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 hover:text-yellow-800 hover:border-yellow-300"
                          title="Agregar emoji"
                        >
                          <span className="text-sm">😊</span>
                        </Button>
                        <Button
                          onClick={() => handleRemoveAlerta(item.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:border-red-300"
                          title="Eliminar alerta"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAlertas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {alertas.length === 0
                  ? 'No hay alertas seleccionadas'
                  : 'No se encontraron alertas con ese criterio'}
              </p>
            </div>
          )}
        </Card>

        {alertas.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <Button
              onClick={() => navigate('/consulta-datos')}
              variant="outline"
              disabled={isEnviando}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarAlertas}
              disabled={isEnviando}
              isLoading={isEnviando}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isEnviando ? 'Enviando...' : 'Enviar Alerta'}
            </Button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="fixed inset-0 z-[99999] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                onClick={() => setShowEmojiPicker(false)}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-4 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Seleccionar Emoji
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {emojiPickerTarget === 'all'
                      ? 'Se agregará a todas las alertas'
                      : 'Se agregará a esta alerta específica'}
                  </p>
                </div>

                <div className="flex justify-center">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    autoFocusSearch={false}
                    width={400}
                    height={400}
                    searchPlaceholder="Buscar emoji..."
                    previewConfig={{
                      showPreview: false,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-3 px-2">
                  <Button
                    onClick={() => setShowEmojiPicker(false)}
                    variant="outline"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AlertasPreview;
