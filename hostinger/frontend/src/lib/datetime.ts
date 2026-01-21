/**
 * Date/time helpers for Hostinger build.
 * We always render timestamps in Brazil time (America/Sao_Paulo), regardless of the device timezone.
 */

export type BrazilTimeFormat = 'time' | 'dateTime';

function parseBackendTimestampToDate(ts: string): Date {
  // Backend may return:
  // - ISO: 2026-01-21T13:00:00.000Z
  // - SQL: 2026-01-21 13:00:00
  // If it's SQL-like (no timezone), treat it as UTC.
  const raw = String(ts || '').trim();
  if (!raw) return new Date(NaN);

  const looksIso = raw.includes('T');
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw);

  if (looksIso || hasTz) {
    return new Date(raw);
  }

  // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ssZ" (assume UTC)
  return new Date(raw.replace(' ', 'T') + 'Z');
}

export function formatBrazilTime(ts: string, format: BrazilTimeFormat): string {
  const date = parseBackendTimestampToDate(ts);
  if (!Number.isFinite(date.getTime())) return '-';

  const parts: Intl.DateTimeFormatOptions =
    format === 'time'
      ? { hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };

  // Always Brazil time.
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...parts,
  }).format(date);
}
