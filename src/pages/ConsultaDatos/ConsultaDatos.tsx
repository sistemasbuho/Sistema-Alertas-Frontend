import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import { getMedios, getRedes, setTempToken } from '@shared/services/api';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type TabType = 'medios' | 'redes';

const ConsultaDatos: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('medios');
  const [medios, setMedios] = useState<any[]>([]);
  const [redes, setRedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const mediosFilters = useUrlFilters({
    proyecto: '',
    nombre: '',
    tipo: '',
  });

  const redesFilters = useUrlFilters({
    proyecto: '',
    autor: '',
    url: '',
  });

  const getCurrentFilters = () => {
    return activeTab === 'medios' ? mediosFilters : redesFilters;
  };

  useEffect(() => {
    loadData();
  }, [activeTab, mediosFilters.filters, redesFilters.filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setSelectedItems([]);
      setTempToken();

      if (activeTab === 'medios') {
        const activeFilters = Object.fromEntries(
          Object.entries(mediosFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );
        const data = await getMedios(
          Object.keys(activeFilters).length > 0 ? activeFilters : undefined
        );
        setMedios(data);
      } else {
        const activeFilters = Object.fromEntries(
          Object.entries(redesFilters.filters).filter(
            ([_, value]) => value && value.trim() !== ''
          )
        );
        const data = await getRedes(
          Object.keys(activeFilters).length > 0 ? activeFilters : undefined
        );
        setRedes(data);
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

  const filteredData = getCurrentData().filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'medios') {
      return (
        item.titulo?.toLowerCase().includes(searchLower) ||
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower)
      );
    } else {
      return (
        item.contenido?.toLowerCase().includes(searchLower) ||
        item.autor?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower)
      );
    }
  });

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map((item) => item.id));
    }
  };

  const handleSendToAlertas = () => {
    const selectedData = filteredData.filter((item) =>
      selectedItems.includes(item.id)
    );

    if (selectedData.length === 0) {
      showError('Sin selección', 'No hay elementos seleccionados para enviar');
      return;
    }

    navigate('/alertas-preview', {
      state: {
        selectedItems: selectedData.map((item) => ({
          id: item.id,
          url: item.url,
          contenido: activeTab === 'medios' ? item.contenido : item.contenido,
          fecha: activeTab === 'medios' ? item.fecha_publicacion : item.fecha,
          titulo: activeTab === 'medios' ? item.titulo : undefined,
          autor: item.autor,
          reach: item.reach,
          engagement: item.engagement,
        })),
        tipo: activeTab,
        proyectoId:
          selectedData[0]?.proyecto || '2bd78e76-73d8-4561-9b91-42cac463366e', // Usar proyecto del primer item o default
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

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
              Medios ({medios.length})
            </button>
            <button
              onClick={() => setActiveTab('redes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'redes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Redes ({redes.length})
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
                <div className="flex items-center gap-4">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedItems.length} seleccionados
                  </span>
                  {selectedItems.length > 0 && (
                    <Button
                      onClick={handleSendToAlertas}
                      className="inline-flex items-center gap-2"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Enviar a Alertas
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Filtros de{' '}
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h3>
                    {getCurrentFilters().hasActiveFilters() && (
                      <Button
                        onClick={getCurrentFilters().clearFilters}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center gap-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeTab === 'medios' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.proyecto || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                proyecto: e.target.value,
                              })
                            }
                            placeholder="ID del proyecto"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.nombre || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                nombre: e.target.value,
                              })
                            }
                            placeholder="Ej: ElTiempo"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo
                          </label>
                          <input
                            type="text"
                            value={mediosFilters.filters.tipo || ''}
                            onChange={(e) =>
                              mediosFilters.updateFilters({
                                tipo: e.target.value,
                              })
                            }
                            placeholder="Ej: prensa"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.proyecto || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                proyecto: e.target.value,
                              })
                            }
                            placeholder="ID del proyecto"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Autor
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.autor || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                autor: e.target.value,
                              })
                            }
                            placeholder="Ej: Juan"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL
                          </label>
                          <input
                            type="text"
                            value={redesFilters.filters.url || ''}
                            onChange={(e) =>
                              redesFilters.updateFilters({
                                url: e.target.value,
                              })
                            }
                            placeholder="Ej: https://twitter.com/post/123"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === filteredData.length &&
                            filteredData.length > 0
                          }
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      {activeTab === 'medios' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Título
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contenido
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            URL
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Autor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Reach
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Publicación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Creación
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contenido
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            URL
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Autor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Reach
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Engagement
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Publicación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha Creación
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        {activeTab === 'medios' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.titulo}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                                title={item.contenido}
                              >
                                {item.contenido}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate max-w-xs block"
                              >
                                {item.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item.autor || 'Sin autor'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {formatNumber(item.reach)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.fecha_publicacion)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.created_at)}
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4">
                              <div
                                className="text-sm text-gray-900 dark:text-white max-w-xs truncate"
                                title={item.contenido}
                              >
                                {item.contenido}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm truncate max-w-xs block"
                              >
                                {item.url}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {item.autor || 'Sin autor'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {formatNumber(item.reach)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                {formatNumber(item.engagement)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.fecha)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(item.created_at)}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConsultaDatos;
