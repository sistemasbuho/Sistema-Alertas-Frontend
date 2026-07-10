import React from 'react';
import type { EstadoIa } from '@shared/services/api';
import { countryFlag, countryName } from '@shared/utils/countries';

// Clases completas por color para que Tailwind no las purgue
const PILL_CLASSES: Record<string, string> = {
  green:
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  yellow:
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  red: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  gray: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  blue: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  orange:
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  purple:
    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
};

export const ConfianzaBadge: React.FC<{
  value: number | null | undefined;
  umbral?: number;
}> = ({ value, umbral }) => {
  if (value === null || value === undefined) return null;
  const pct = Math.round(value * 100);
  const high = umbral !== undefined ? value >= umbral : value >= 0.8;
  const color = high ? 'green' : value >= 0.5 ? 'yellow' : 'red';
  return (
    <span className={PILL_CLASSES[color]} title="Confianza global de la IA">
      {pct}%
    </span>
  );
};

export const TonalidadChip: React.FC<{
  value: string | null | undefined;
}> = ({ value }) => {
  if (!value) return null;
  const v = value.toLowerCase();
  const color =
    v === 'positivo' || v === 'positiva'
      ? 'green'
      : v === 'neutral' || v === 'neutro'
      ? 'gray'
      : v === 'negativo' || v === 'negativa'
      ? 'red'
      : 'blue';
  return (
    <span className={PILL_CLASSES[color]} title="Tonalidad">
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </span>
  );
};

const SEMAFORO_EMOJI: Record<string, string> = {
  bajo: '🟢',
  medio: '🟡',
  alto: '🔴',
};

export const SemaforoBadge: React.FC<{
  nivel: string | null | undefined;
}> = ({ nivel }) => {
  if (!nivel) return null;
  const v = nivel.toLowerCase();
  const emoji = SEMAFORO_EMOJI[v] || '⚪';
  const color = v === 'bajo' ? 'green' : v === 'medio' ? 'yellow' : v === 'alto' ? 'red' : 'gray';
  return (
    <span className={PILL_CLASSES[color]} title="Semáforo de riesgo">
      <span className="mr-1">{emoji}</span>
      {v.charAt(0).toUpperCase() + v.slice(1)}
    </span>
  );
};

const ESTADO_IA_CONFIG: Record<EstadoIa, { label: string; color: string }> = {
  pendiente_ia: { label: 'Pendiente IA', color: 'gray' },
  clasificando: { label: 'Clasificando', color: 'gray' },
  enriqueciendo: { label: 'Enriqueciendo', color: 'blue' },
  auto_aprobada: { label: 'Auto (IA)', color: 'green' },
  cola_excepciones: { label: 'En cola', color: 'orange' },
  aprobada_humana: { label: 'Aprobada humana', color: 'green' },
  descartada_ia: { label: 'Descartada IA', color: 'red' },
  descartada_humana: { label: 'Descartada humana', color: 'red' },
  enviada: { label: 'Enviada', color: 'green' },
  error_envio: { label: 'Error envío', color: 'red' },
  manual: { label: '—', color: 'gray' },
};

export const EstadoIaBadge: React.FC<{
  estado: EstadoIa | string | null | undefined;
}> = ({ estado }) => {
  if (!estado) return null;
  const config = ESTADO_IA_CONFIG[estado as EstadoIa] || {
    label: estado,
    color: 'gray',
  };
  return (
    <span className={PILL_CLASSES[config.color]} title="Estado del pipeline IA">
      {config.label}
    </span>
  );
};

export const PaisFlag: React.FC<{
  iso: string | null | undefined;
  showName?: boolean;
}> = ({ iso, showName = false }) => {
  if (!iso) return null;
  const flag = countryFlag(iso);
  if (!flag) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-sm"
      title={countryName(iso)}
    >
      <span>{flag}</span>
      {showName && (
        <span className="text-gray-700 dark:text-gray-300 text-xs">
          {countryName(iso)}
        </span>
      )}
    </span>
  );
};
