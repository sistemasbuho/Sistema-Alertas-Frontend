import { HistorialEnvio } from '@/shared/services/api';
import { Card } from '@/shared/components/ui';
import {
  ClockIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export const TablaHistorial = ({
  historial,
  loading,
  filters,
}: {
  historial: HistorialEnvio[];
  loading: boolean;
  filters: {
    filters: {
      search: string;
      usuario: string;
      proyecto: string;
      estado_enviado: string;
      medio__url: string;
      medio__url__icontains: string;
      red_social__red_social__nombre__icontains: string;
      created_at__gte: string;
      created_at__lte: string;
      inicio_envio__gte: string;
      fin_envio__lte: string;
    };
    updateFilters: (filters: any) => void;
    clearFilters: () => void;
    hasActiveFilters: () => boolean;
  };
}) => {
  const getTipoIcon = (item: HistorialEnvio) => {
    if (item.red_social) {
      return <GlobeAltIcon className="h-5 w-5 text-purple-500" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
  };

  const getTipoText = (item: HistorialEnvio) => {
    if (item.red_social) {
      return 'Redes Sociales';
    }
    return 'WhatsApp';
  };

  const getEstadoIcon = (estadoEnviado: boolean) => {
    return estadoEnviado ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getEstadoText = (estadoEnviado: boolean) => {
    return estadoEnviado ? 'Enviado' : 'Fallido';
  };

  const formatDate = (dateString: string | null) => {
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
      });
    } catch (error) {
      return 'Error en fecha';
    }
  };

  const formatTiempoEnvio = (tiempo: number | null) => {
    if (tiempo === null) return 'N/A';
    if (tiempo < 0) return 'Error en tiempo';
    return `${tiempo.toFixed(2)}s`;
  };

  return (
    <Card className="mt-6">
      <Card.Content className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando historial...
            </span>
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay historial disponible
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.hasActiveFilters()
                ? 'No se encontraron envíos con los filtros aplicados.'
                : 'Aún no se han realizado envíos de alertas.'}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400">
            En desarrollo
          </p>
          // <div className="overflow-x-auto">
          //   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          //     <thead className="bg-gray-50 dark:bg-gray-800">
          //       <tr>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Tipo / Estado
          //         </th>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Usuario
          //         </th>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Proyecto
          //         </th>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Mensaje
          //         </th>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Tiempo Envío
          //         </th>
          //         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          //           Fecha Creación
          //         </th>
          //       </tr>
          //     </thead>
          //     <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          //       {historial.map((item) => (
          //         <tr
          //           key={item.id}
          //           className="hover:bg-gray-50 dark:hover:bg-gray-800"
          //         >
          //           <td className="px-4 py-4 w-32">
          //             <div className="flex items-center gap-2">
          //               {getTipoIcon(item)}
          //               <div className="flex flex-col">
          //                 <span className="text-sm font-medium text-gray-900 dark:text-white">
          //                   {getTipoText(item)}
          //                 </span>
          //                 <div className="flex items-center gap-1">
          //                   {getEstadoIcon(item.estado_enviado)}
          //                   <span
          //                     className={`text-xs ${
          //                       item.estado_enviado
          //                         ? 'text-green-600 dark:text-green-400'
          //                         : 'text-red-600 dark:text-red-400'
          //                     }`}
          //                   >
          //                     {getEstadoText(item.estado_enviado)}
          //                   </span>
          //                 </div>
          //               </div>
          //             </div>
          //           </td>
          //           <td className="px-4 py-4 w-32">
          //             <div className="text-sm text-gray-900 dark:text-white">
          //               {item.usuario || 'Sin usuario'}
          //             </div>
          //           </td>
          //           <td className="px-4 py-4 w-48">
          //             <div className="text-sm text-gray-900 dark:text-white truncate">
          //               {item.proyecto}
          //             </div>
          //           </td>
          //           <td className="px-4 py-4 max-w-md">
          //             <div
          //               className="text-sm text-gray-900 dark:text-white truncate"
          //               title={item.mensaje || 'Sin mensaje'}
          //             >
          //               {item.mensaje || 'Sin mensaje'}
          //             </div>
          //           </td>
          //           <td className="px-4 py-4 w-32">
          //             <div className="text-sm text-gray-900 dark:text-white">
          //               {formatTiempoEnvio(item.tiempo_envio)}
          //             </div>
          //           </td>
          //           <td className="px-4 py-4 w-32">
          //             <div className="text-sm text-gray-900 dark:text-white">
          //               {formatDate(item.created_at)}
          //             </div>
          //           </td>
          //         </tr>
          //       ))}
          //     </tbody>
          //   </table>
          // </div>
        )}
      </Card.Content>
    </Card>
  );
};
