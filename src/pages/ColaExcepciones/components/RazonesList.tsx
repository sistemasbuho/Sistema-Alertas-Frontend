import React from 'react';

interface RazonesListProps {
  razones: string[];
  datosCompletados?: any[];
}

const formatDatoCompletado = (dato: any): string => {
  if (typeof dato === 'string') return dato;
  if (dato && typeof dato === 'object') {
    const campo = dato.campo || dato.field || '';
    const valor = dato.valor ?? dato.value ?? '';
    if (campo) return valor !== '' ? `${campo}: ${valor}` : String(campo);
    return JSON.stringify(dato);
  }
  return String(dato);
};

const RazonesList: React.FC<RazonesListProps> = ({
  razones,
  datosCompletados,
}) => {
  if ((!razones || razones.length === 0) && (!datosCompletados || datosCompletados.length === 0)) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        Sin razones registradas
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {razones && razones.length > 0 && (
        <ul className="list-disc list-inside space-y-0.5">
          {razones.map((razon, index) => (
            <li
              key={index}
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              {razon}
            </li>
          ))}
        </ul>
      )}
      {datosCompletados && datosCompletados.length > 0 && (
        <ul className="space-y-0.5 mt-1">
          {datosCompletados.map((dato, index) => (
            <li
              key={index}
              className="text-sm text-blue-700 dark:text-blue-300"
            >
              ✨ {formatDatoCompletado(dato)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RazonesList;
