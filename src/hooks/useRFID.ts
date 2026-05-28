import { useCallback, useEffect, useRef, useState } from 'react';
import { RFIDSimulator, StopScan } from '@/components/rfid/RFIDSimulator';
import { RFIDTag, ScanHistory } from '@/types';
import { addScanHistoryLocal } from '@/services/storageService';
import { useAppDispatch, useAppSelector } from '@/store';
import { addTag, clearTags, setScanning } from '@/store/rfidSlice';

export function useRFID() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.settings.username);
  const currentSite = useAppSelector((state) => state.settings.currentSite);
  const stopRef = useRef<StopScan | null>(null);
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const stopScan = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setIsScanning(false);
    dispatch(setScanning(false));
  }, [dispatch]);

  const startScan = useCallback((candidateEpcs?: string[]) => {
    if (stopRef.current) {
      return;
    }

    setIsScanning(true);
    dispatch(setScanning(true));
    stopRef.current = RFIDSimulator.startScan((epc, rssi) => {
      const timestamp = Date.now();
      const tag: RFIDTag = {
        id: epc,
        epc,
        toolId: '',
        rssi,
        timestamp,
        locked: false,
      };
      const scanRecord: ScanHistory = {
        id: `${epc}_${timestamp}`,
        epc,
        rssi,
        scanned_at: new Date(timestamp).toISOString(),
        scanned_by: username || 'Utilisateur local',
        site: currentSite,
      };

      void addScanHistoryLocal(scanRecord);

      setTags((currentTags) => {
        const exists = currentTags.some((currentTag) => currentTag.epc === epc);
        if (exists) {
          dispatch(addTag(tag));
          return currentTags.map((currentTag) => (currentTag.epc === epc ? tag : currentTag));
        }

        dispatch(addTag(tag));
        return [tag, ...currentTags];
      });
    }, { candidateEpcs, candidateHitRate: 0.8, interval: 800 });
  }, [currentSite, dispatch, username]);

  const resetScan = useCallback(() => {
    setTags([]);
    dispatch(clearTags());
  }, [dispatch]);

  const locateTag = useCallback((epc: string, onSignal: (rssi: number, found: boolean) => void) => {
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      const rssi = -75 + Math.floor(Math.random() * 41);
      onSignal(rssi, ticks > 6 && rssi > -50);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => stopScan, [stopScan]);

  return {
    tags,
    isScanning,
    count: tags.length,
    startScan,
    stopScan,
    resetScan,
    locateTag,
  };
}
