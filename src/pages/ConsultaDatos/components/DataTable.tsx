import React from 'react';
import Button from '@shared/components/ui/Button';
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

// Estilos CSS para scrollbar sutil
const scrollbarStyles = `
  .subtle-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .subtle-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .subtle-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 2px;
  }
  .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.5);
  }
  .dark .subtle-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(107, 114, 128, 0.4);
  }
  .dark .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.6);
  }
`;

type TabType = 'medios' | 'redes';

interface DataTableProps {
  activeTab: TabType;
  filteredData: any[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  formatDate: (dateString: string) => string;
  formatNumber: (num: number) => string;
  onAddEmoji: (itemId: string) => void;
  onRemoveEmoji: (itemId: string, emojiIndex: number) => void;
  onEditItem: (item: any) => void;
  onPreviewItem: (item: any) => void;
  highlightKeywords: (
    text: string | null | undefined,
    keywords: string[]
  ) => string;
  showEmojiActions?: boolean;
  showEditActions?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  activeTab,
  filteredData,
  selectedItems,
  onSelectItem,
  onSelectAll,
  formatDate,
  formatNumber,
  onAddEmoji,
  onRemoveEmoji,
  onEditItem,
  onPreviewItem,
  highlightKeywords,
  showEmojiActions = true,
  showEditActions = true,
}) => {
  const isFieldEmpty = (value: any, fieldName: string) => {
    if (fieldName === 'autor' || fieldName === 'contenido') {
      return !value || value.trim() === '';
    }
    if (fieldName === 'reach' || fieldName === 'engagement') {
      return value === null || value === undefined;
    }
    if (fieldName === 'url') {
      return !value || value.trim() === '';
    }
    if (fieldName === 'fecha_publicacion') {
      return !value || value.trim() === '';
    }
    return !value || value.toString().trim() === '';
  };

  const renderFieldWithWarning = (content: React.ReactNode, item: any, fieldName: string) => {
    const isEmpty = isFieldEmpty(item[fieldName], fieldName);

    // Para medios, validar todos los campos incluyendo título
    // Para redes, validar todos los campos excepto título
    const shouldShowWarning = activeTab === 'medios'
      ? isEmpty
      : activeTab === 'redes' && fieldName !== 'titulo' && isEmpty;

    if (shouldShowWarning) {
      return (
        <span className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-1">
            <span className="text-red-500 text-lg" title="Campo requerido vacío">⚠️</span>
            <span className="text-red-600 dark:text-red-400 text-xs font-semibold">Campo obligatorio</span>
          </span>
          <span className="border-b-2 border-red-500 pb-1">
            {content}
          </span>
        </span>
      );
    }
    return content;
  };

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedItems.length === filteredData.length &&
                    filteredData.length > 0
                  }
                  onChange={onSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              {activeTab === 'medios' ? (
                <>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    style={{ minWidth: '320px' }}
                  >
                    Título
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    style={{ minWidth: '480px' }}
                  >
                    Contenido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                    Proyecto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Autor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Reach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Pub.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Estado Enviado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Estado Revisado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Acciones
                  </th>
                </>
              ) : (
                <>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    style={{ minWidth: '480px' }}
                  >
                    Contenido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                    Proyecto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Autor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Reach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Pub.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Estado Enviado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Estado Revisado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Acciones
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedItems.includes(item.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <td className="px-2 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => onSelectItem(item.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                {activeTab === 'medios' ? (
                  <>
                    <td className="px-4 py-4" style={{ minWidth: '320px' }}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {renderFieldWithWarning(
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(
                                item.titulo || '',
                                item.proyecto_keywords || []
                              ),
                            }}
                          />,
                          item,
                          'titulo'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4" style={{ minWidth: '480px' }}>
                      {renderFieldWithWarning(
                        <div
                          className="text-sm text-gray-900 dark:text-white max-h-20 overflow-y-auto overflow-x-hidden leading-tight subtle-scrollbar"
                          title={
                            item.mensaje_formateado ||
                            (item.emojis && item.emojis.length > 0
                              ? `${item.emojis.join(' ')} ${item.contenido}`
                              : item.contenido)
                          }
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor:
                              'rgba(156, 163, 175, 0.3) transparent',
                          }}
                        >
                          {item.emojis && item.emojis.length > 0 && (
                            <span className="inline-flex items-center gap-1 mr-2">
                              {item.emojis.map((emoji: string, index: number) =>
                                showEmojiActions ? (
                                  <button
                                    key={index}
                                    onClick={() => onRemoveEmoji(item.id, index)}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 transition-colors"
                                    title="Clic para remover emoji"
                                  >
                                    {emoji}
                                  </button>
                                ) : (
                                  <span key={index} className="px-1">
                                    {emoji}
                                  </span>
                                )
                              )}
                            </span>
                          )}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(
                                item.contenido,
                                item.proyecto_keywords || []
                              ),
                            }}
                          />
                        </div>,
                        item,
                        'contenido'
                      )}
                    </td>
                    <td className="px-4 py-4 w-40">
                      <div
                        className="text-sm text-gray-900 dark:text-white truncate"
                        title={item.proyecto_nombre || 'Sin proyecto'}
                      >
                        {item.proyecto_nombre || 'Sin proyecto'}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      {renderFieldWithWarning(
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate block"
                          title={item.url}
                        >
                          {item.url?.length > 20
                            ? `${item.url.substring(0, 20)}...`
                            : item.url}
                        </a>,
                        item,
                        'url'
                      )}
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {renderFieldWithWarning(
                          item.autor || <span className="text-gray-400 italic">Sin autor</span>,
                          item,
                          'autor'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        {renderFieldWithWarning(
                          item.reach !== null && item.reach !== undefined ? formatNumber(item.reach) : <span className="text-gray-400 italic">-</span>,
                          item,
                          'reach'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        {renderFieldWithWarning(
                          item.engagement !== null &&
                          item.engagement !== undefined &&
                          !isNaN(Number(item.engagement))
                            ? formatNumber(Number(item.engagement))
                            : <span className="text-gray-400 italic">-</span>,
                          item,
                          'engagement'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {renderFieldWithWarning(
                          formatDate(item.fecha_publicacion),
                          item,
                          'fecha_publicacion'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-28">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado_enviado === true ||
                          item.estado_enviado === 'Enviado'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}
                      >
                        {item.estado_enviado === true ||
                        item.estado_enviado === 'Enviado'
                          ? 'Enviado'
                          : 'No Enviado'}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-28">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado_revisado === true ||
                          item.estado_revisado === 'Revisado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {item.estado_revisado === true ||
                        item.estado_revisado === 'Revisado'
                          ? 'Revisado'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          onClick={() => onPreviewItem(item)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 p-2 text-blue-600 hover:text-blue-800 hover:border-blue-300"
                          title="Vista previa"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        {showEditActions && (
                          <Button
                            onClick={() => onEditItem(item)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-1 p-2 text-green-600 hover:text-green-800 hover:border-green-300"
                            title="Editar"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                        )}
                        {showEmojiActions && (
                          <Button
                            onClick={() => onAddEmoji(item.id)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-800 hover:border-yellow-300"
                            title="Agregar emoji"
                          >
                            <span className="text-sm">😊</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4" style={{ minWidth: '480px' }}>
                      {renderFieldWithWarning(
                        <div
                          className="text-sm text-gray-900 dark:text-white max-h-20 overflow-y-auto overflow-x-hidden leading-tight subtle-scrollbar"
                          title={
                            item.mensaje_formateado ||
                            (item.emojis && item.emojis.length > 0
                              ? `${item.emojis.join(' ')} ${item.contenido}`
                              : item.contenido)
                          }
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor:
                              'rgba(156, 163, 175, 0.3) transparent',
                          }}
                        >
                          {item.emojis && item.emojis.length > 0 && (
                            <span className="inline-flex items-center gap-1 mr-2">
                              {item.emojis.map((emoji: string, index: number) =>
                                showEmojiActions ? (
                                  <button
                                    key={index}
                                    onClick={() => onRemoveEmoji(item.id, index)}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 transition-colors"
                                    title="Clic para remover emoji"
                                  >
                                    {emoji}
                                  </button>
                                ) : (
                                  <span key={index} className="px-1">
                                    {emoji}
                                  </span>
                                )
                              )}
                            </span>
                          )}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(
                                item.contenido,
                                item.proyecto_keywords || []
                              ),
                            }}
                          />
                        </div>,
                        item,
                        'contenido'
                      )}
                    </td>
                    <td className="px-4 py-4 w-40">
                      <div
                        className="text-sm text-gray-900 dark:text-white truncate"
                        title={item.proyecto_nombre || 'Sin proyecto'}
                      >
                        {item.proyecto_nombre || 'Sin proyecto'}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      {renderFieldWithWarning(
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate block"
                          title={item.url}
                        >
                          {item.url?.length > 20
                            ? `${item.url.substring(0, 20)}...`
                            : item.url}
                        </a>,
                        item,
                        'url'
                      )}
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {renderFieldWithWarning(
                          item.autor || <span className="text-gray-400 italic">Sin autor</span>,
                          item,
                          'autor'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        {renderFieldWithWarning(
                          item.reach !== null && item.reach !== undefined ? formatNumber(item.reach) : <span className="text-gray-400 italic">-</span>,
                          item,
                          'reach'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {renderFieldWithWarning(
                          item.engagement !== null &&
                          item.engagement !== undefined &&
                          !isNaN(Number(item.engagement))
                            ? formatNumber(Number(item.engagement))
                            : <span className="text-gray-400 italic">-</span>,
                          item,
                          'engagement'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {renderFieldWithWarning(
                          formatDate(item.fecha_publicacion || item.fecha),
                          item,
                          'fecha_publicacion'
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-28">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado_enviado === true ||
                          item.estado_enviado === 'Enviado'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}
                      >
                        {item.estado_enviado === true ||
                        item.estado_enviado === 'Enviado'
                          ? 'Enviado'
                          : 'No Enviado'}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-28">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado_revisado === true ||
                          item.estado_revisado === 'Revisado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {item.estado_revisado === true ||
                        item.estado_revisado === 'Revisado'
                          ? 'Revisado'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          onClick={() => onPreviewItem(item)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 p-2 text-blue-600 hover:text-blue-800 hover:border-blue-300"
                          title="Vista previa"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        {showEditActions && (
                          <Button
                            onClick={() => onEditItem(item)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-1 p-2 text-green-600 hover:text-green-800 hover:border-green-300"
                            title="Editar"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                        )}
                        {showEmojiActions && (
                          <Button
                            onClick={() => onAddEmoji(item.id)}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-800 hover:border-yellow-300"
                            title="Agregar emoji"
                          >
                            <span className="text-sm">😊</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataTable;
