import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Dataset, ExportRecord } from './types';

interface AppState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  exports: ExportRecord[];
}

interface AppContextType extends AppState {
  addDataset: (dataset: Dataset) => void;
  deleteDataset: (id: string) => void;
  setActiveDataset: (id: string) => void;
  addExport: (exportRecord: ExportRecord) => void;
  clearExports: () => void;
}

const STORAGE_KEY = 'abc_bank_state';

const defaultState: AppState = {
  datasets: [],
  activeDatasetId: null,
  exports: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage', e);
    }
  }, [state]);

  const addDataset = (dataset: Dataset) => {
    setState(prev => ({
      ...prev,
      datasets: [dataset, ...prev.datasets],
      activeDatasetId: dataset.id,
    }));
  };

  const deleteDataset = (id: string) => {
    setState(prev => ({
      ...prev,
      datasets: prev.datasets.filter(d => d.id !== id),
      activeDatasetId: prev.activeDatasetId === id 
        ? (prev.datasets.find(d => d.id !== id)?.id || null) 
        : prev.activeDatasetId,
    }));
  };

  const setActiveDataset = (id: string) => {
    setState(prev => ({ ...prev, activeDatasetId: id }));
  };

  const addExport = (exportRecord: ExportRecord) => {
    setState(prev => ({
      ...prev,
      exports: [exportRecord, ...prev.exports],
    }));
  };

  const clearExports = () => {
    setState(prev => ({ ...prev, exports: [] }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addDataset,
        deleteDataset,
        setActiveDataset,
        addExport,
        clearExports,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
