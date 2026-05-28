export type RFIDTagCallback = (epc: string, rssi: number) => void;
export type StopScan = () => void;

export interface StartScanOptions {
  candidateEpcs?: string[];
  candidateHitRate?: number;
  interval?: number;
}

const REAL_EPCS = [
  'E20034120189074000000001',
  'E20034120189074000000002',
  'E20034120189074000000003',
  'E20034120189074000000004',
  'E20034120189074000000005',
  'E20034120189074000000006',
  'E20034120189074000000007',
  'E20034120189074000000008',
  'E20034120189074000000009',
  'E20034120189074000000010',
];

function randomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
}

function randomRssi(): number {
  return -40 - Math.floor(Math.random() * 41);
}

function pickRandom(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)];
}

export function generateFakeEPC(): string {
  if (Math.random() < 0.6) {
    return pickRandom(REAL_EPCS);
  }

  return randomHex(24);
}

export function startScan(
  onTag: RFIDTagCallback,
  intervalOrOptions: number | StartScanOptions = 800
): StopScan {
  const options =
    typeof intervalOrOptions === 'number'
      ? { interval: intervalOrOptions }
      : intervalOrOptions;
  const interval = options.interval ?? 800;
  const candidateEpcs = [...new Set(options.candidateEpcs ?? [])].filter(Boolean);
  const candidateHitRate = options.candidateHitRate ?? 0.8;

  const timer = setInterval(() => {
    const shouldUseCandidate = candidateEpcs.length > 0 && Math.random() < candidateHitRate;
    const epc = shouldUseCandidate ? pickRandom(candidateEpcs) : generateFakeEPC();
    onTag(epc, randomRssi());
  }, interval);

  return () => clearInterval(timer);
}

export const RFIDSimulator = {
  generateFakeEPC,
  startScan,
};
