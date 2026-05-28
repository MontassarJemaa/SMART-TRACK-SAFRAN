const HEX_PATTERN = /[^0-9A-F]/g;

export function normalizeEPC(value: string): string {
  return value.toUpperCase().replace(HEX_PATTERN, '').slice(0, 24);
}

export function formatEPC(value: string): string {
  const epc = normalizeEPC(value);
  return epc.match(/.{1,4}/g)?.join(' ') ?? '';
}

export function isValidEPC(value: string): boolean {
  return normalizeEPC(value).length === 24;
}

export function padEPC(value: string): string {
  return normalizeEPC(value).padEnd(24, '0');
}
