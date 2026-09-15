import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import mcuRawData from '../data/mcuData.json';
import { MCUFullData, Pegawai, MCURecord, MCUDetail } from '../types/mcu';
import {
  setMCUData,
  departmentList,
  availableYears
} from '../utils/mcuAnalytics';
import {
  isSupabaseConfigured,
  getExtraDataLocally,
  saveMCURecordToSupabase,
  fetchCloudMCURecords,
  clearExtraDataLocally
} from '../lib/supabase';

interface MCUDataContextType {
  fullData: MCUFullData;
  isSyncing: boolean;
  cloudConnected: boolean;
  lastSyncTime: Date | null;
  addMCURecord: (
    pegawai: Pegawai,
    record: MCURecord,
    details: MCUDetail[]
  ) => Promise<{ success: boolean; error?: string }>;
  syncWithCloud: () => Promise<void>;
  resetToDefaultData: () => void;
  totalEmployeesCount: number;
  departments: string[];
  years: number[];
  dataRevision: number; // Increment to force child re-renders
}

const MCUDataContext = createContext<MCUDataContextType | null>(null);

function mergeWithExtra(base: MCUFullData, extra: { pegawai: Pegawai[]; mcu_records: MCURecord[]; mcu_details: MCUDetail[] }): MCUFullData {
  const mergedPegawai = [...base.pegawai];
  for (const emp of extra.pegawai) {
    const idx = mergedPegawai.findIndex(p => p.NIP === emp.NIP);
    if (idx >= 0) mergedPegawai[idx] = emp;
    else mergedPegawai.push(emp);
  }

  const mergedRecords = [...base.mcu_records];
  for (const rec of extra.mcu_records) {
    const idx = mergedRecords.findIndex(r => r.ID_MCU === rec.ID_MCU);
    if (idx >= 0) mergedRecords[idx] = rec;
    else mergedRecords.push(rec);
  }

  const mergedDetails = [...base.mcu_details];
  for (const det of extra.mcu_details) {
    const idx = mergedDetails.findIndex(d => d.ID_Detail === det.ID_Detail);
    if (idx >= 0) mergedDetails[idx] = det;
    else mergedDetails.push(det);
  }

  return {
    pegawai: mergedPegawai,
    parameters: base.parameters,
    mcu_records: mergedRecords,
    mcu_details: mergedDetails
  };
}

export const MCUDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fullData, setFullData] = useState<MCUFullData>(() => {
    const initialBase = mcuRawData as MCUFullData;
    const extra = getExtraDataLocally();
    const merged = mergeWithExtra(initialBase, extra);
    setMCUData(merged);
    return merged;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudConnected, setCloudConnected] = useState<boolean>(isSupabaseConfigured());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dataRevision, setDataRevision] = useState<number>(0);

  // Sync with cloud on initial mount if configured
  const syncWithCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCloudConnected(false);
      return;
    }

    setIsSyncing(true);
    try {
      const cloudData = await fetchCloudMCURecords();
      if (cloudData) {
        setFullData(prev => {
          const merged = mergeWithExtra(prev, cloudData);
          setMCUData(merged);
          return merged;
        });
        setCloudConnected(true);
        setLastSyncTime(new Date());
        setDataRevision(r => r + 1);
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncWithCloud();
  }, [syncWithCloud]);

  // Add a new MCU record (from AI scan or manual entry)
  const addMCURecord = async (
    pegawai: Pegawai,
    record: MCURecord,
    details: MCUDetail[]
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSyncing(true);

    try {
      // 1. Update React state immediately (optimistic UI)
      setFullData(prev => {
        const merged = mergeWithExtra(prev, {
          pegawai: [pegawai],
          mcu_records: [record],
          mcu_details: details
        });
        setMCUData(merged);
        return merged;
      });

      setDataRevision(r => r + 1);

      // 2. Persist to Cloud and/or LocalStorage
      const result = await saveMCURecordToSupabase(pegawai, record, details);
      setLastSyncTime(new Date());
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to default seed data
  const resetToDefaultData = () => {
    clearExtraDataLocally();
    const base = mcuRawData as MCUFullData;
    setMCUData(base);
    setFullData(base);
    setDataRevision(r => r + 1);
  };

  return (
    <MCUDataContext.Provider
      value={{
        fullData,
        isSyncing,
        cloudConnected,
        lastSyncTime,
        addMCURecord,
        syncWithCloud,
        resetToDefaultData,
        totalEmployeesCount: fullData.pegawai.length,
        departments: departmentList,
        years: availableYears,
        dataRevision
      }}
    >
      {children}
    </MCUDataContext.Provider>
  );
};

export const useMCUData = () => {
  const context = useContext(MCUDataContext);
  if (!context) {
    throw new Error('useMCUData must be used within a MCUDataProvider');
  }
  return context;
};
