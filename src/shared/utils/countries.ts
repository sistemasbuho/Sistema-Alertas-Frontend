export interface Country {
  iso: string;
  nombre: string;
}

export const COUNTRIES: Country[] = [
  { iso: 'AR', nombre: 'Argentina' },
  { iso: 'BO', nombre: 'Bolivia' },
  { iso: 'BR', nombre: 'Brasil' },
  { iso: 'CA', nombre: 'Canadá' },
  { iso: 'CL', nombre: 'Chile' },
  { iso: 'CO', nombre: 'Colombia' },
  { iso: 'CR', nombre: 'Costa Rica' },
  { iso: 'CU', nombre: 'Cuba' },
  { iso: 'DO', nombre: 'República Dominicana' },
  { iso: 'EC', nombre: 'Ecuador' },
  { iso: 'ES', nombre: 'España' },
  { iso: 'GB', nombre: 'Reino Unido' },
  { iso: 'GT', nombre: 'Guatemala' },
  { iso: 'HN', nombre: 'Honduras' },
  { iso: 'MX', nombre: 'México' },
  { iso: 'NI', nombre: 'Nicaragua' },
  { iso: 'PA', nombre: 'Panamá' },
  { iso: 'PE', nombre: 'Perú' },
  { iso: 'PR', nombre: 'Puerto Rico' },
  { iso: 'PY', nombre: 'Paraguay' },
  { iso: 'SV', nombre: 'El Salvador' },
  { iso: 'US', nombre: 'Estados Unidos' },
  { iso: 'UY', nombre: 'Uruguay' },
  { iso: 'VE', nombre: 'Venezuela' },
];

export const countryFlag = (iso: string | null | undefined): string => {
  if (!iso || iso.length !== 2) return '';
  const upper = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  return String.fromCodePoint(
    ...upper.split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
};

export const countryName = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const found = COUNTRIES.find((c) => c.iso === iso.toUpperCase());
  return found ? found.nombre : iso.toUpperCase();
};
