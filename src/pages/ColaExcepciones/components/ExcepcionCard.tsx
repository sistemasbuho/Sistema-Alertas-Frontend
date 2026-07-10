import React, { useState } from 'react';
import Button from '@shared/components/ui/Button';
import {
  ConfianzaBadge,
  TonalidadChip,
  SemaforoBadge,
  PaisFlag,
} from '@shared/components/ui/AiBadges';
import type { AlertaExcepcion } from '@shared/services/api';
import {
  CheckIcon,
  PencilIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import RazonesList from './RazonesList';

interface ExcepcionCardProps {
  item: AlertaExcepcion;
  selected: boolean;
  resolving: boolean;
  onToggleSelect: (id: string) => void;
  onConfirmar: (item: AlertaExcepcion) => void;
  onCorregir: (item: AlertaExcepcion) => void;
  onDescartar: (item: AlertaExcepcion, motivo?: string) => void;
  onPreview: (item: AlertaExcepcion) => void;
}

const formatFecha = (fecha: string | null) => {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return fecha;
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ExcepcionCard: React.FC<ExcepcionCardProps> = ({
  item,
  selected,
  resolving,
  onToggleSelect,
  onConfirmar,
  onCorregir,
  onDescartar,
  onPreview,
}) => {
  const [showDescartar, setShowDescartar] = useState(false);
  const [motivo, setMotivo] = useState('');

  const ev = item.evaluacion_ia;

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-4 transition-colors ${
        selected
          ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400 dark:ring-blue-500'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                item.tipo === 'redes'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
              }`}
            >
              {item.tipo === 'redes'
                ? item.red_social_nombre || 'Redes'
                : 'Medios'}
            </span>
            <PaisFlag iso={ev?.pais_detectado} />
            <SemaforoBadge nivel={ev?.riesgo} />
            <TonalidadChip value={ev?.tonalidad} />
            <ConfianzaBadge value={ev?.confianza_global} />
            {ev?.categoria_sector && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                {ev.categoria_sector}
              </span>
            )}
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.proyecto_nombre}
            </span>
          </div>

          {item.titulo && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {item.titulo}
            </h3>
          )}
          {item.contenido && (
            <div className="text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto whitespace-pre-line mb-2">
              {item.contenido}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {item.autor && <span>{item.autor}</span>}
            {item.autor && item.fecha_publicacion && <span>·</span>}
            {item.fecha_publicacion && (
              <span>{formatFecha(item.fecha_publicacion)}</span>
            )}
            {item.url && (
              <>
                <span>·</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-xs"
                  title={item.url}
                >
                  {item.url}
                </a>
              </>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Sugerencia IA
            </p>
            <RazonesList
              razones={ev?.razones || []}
              datosCompletados={ev?.datos_completados}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => onConfirmar(item)}
              disabled={resolving}
              className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500"
            >
              <CheckIcon className="h-4 w-4" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCorregir(item)}
              disabled={resolving}
              className="inline-flex items-center gap-1"
            >
              <PencilIcon className="h-4 w-4" />
              Corregir
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDescartar(!showDescartar)}
                disabled={resolving}
                className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:border-red-300"
              >
                <XMarkIcon className="h-4 w-4" />
                Descartar
              </Button>
              {showDescartar && (
                <div className="absolute left-0 bottom-full mb-2 z-20 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    ¿Descartar esta alerta?
                  </p>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="w-full px-2 py-1.5 mb-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowDescartar(false);
                        onDescartar(item, motivo.trim() || undefined);
                        setMotivo('');
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500"
                    >
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDescartar(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(item)}
              disabled={resolving}
              className="inline-flex items-center gap-1"
              title="Vista previa del mensaje"
            >
              <EyeIcon className="h-4 w-4" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcepcionCard;
