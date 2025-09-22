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
  highlightKeywords: (text: string | null | undefined, keywords: string[]) => string;
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
}) => {
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Autor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Reach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Pub.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Estado
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
                    Estado
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
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightKeywords(
                              item.titulo || '',
                              item.proyecto_keywords || []
                            ),
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4" style={{ minWidth: '480px' }}>
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
                            {item.emojis.map((emoji: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => onRemoveEmoji(item.id, index)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 transition-colors"
                                title="Clic para remover emoji"
                              >
                                {emoji}
                              </button>
                            ))}
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
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
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
                      </a>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {item.autor || 'Sin autor'}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        {formatNumber(item.reach || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(item.fecha_publicacion)}
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
                          item.estado_revisado === 'Revisado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {item.estado_revisado || 'Pendiente'}
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
                        <Button
                          onClick={() => onEditItem(item)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 p-2 text-green-600 hover:text-green-800 hover:border-green-300"
                          title="Editar"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onAddEmoji(item.id)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-800 hover:border-yellow-300"
                          title="Agregar emoji"
                        >
                          <span className="text-sm">😊</span>
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4" style={{ minWidth: '480px' }}>
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
                            {item.emojis.map((emoji: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => onRemoveEmoji(item.id, index)}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 transition-colors"
                                title="Clic para remover emoji"
                              >
                                {emoji}
                              </button>
                            ))}
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
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
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
                      </a>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white truncate">
                        {item.autor || 'Sin autor'}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                        {formatNumber(item.reach || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-24">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {formatNumber(item.engagement || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(item.fecha_publicacion || item.fecha)}
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
                          item.estado_revisado === 'Revisado'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {item.estado_revisado || 'Pendiente'}
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
                        <Button
                          onClick={() => onEditItem(item)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1 p-2 text-green-600 hover:text-green-800 hover:border-green-300"
                          title="Editar"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onAddEmoji(item.id)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-800 hover:border-yellow-300"
                          title="Agregar emoji"
                        >
                          <span className="text-sm">😊</span>
                        </Button>
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
