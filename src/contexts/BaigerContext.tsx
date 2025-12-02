/**
 * BaigerContext - Global state for Baiger AI Assistant
 * Allows any component to open Baiger with context
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface BaigerContextData {
  mode: 'general' | 'project_create' | 'candidate_search' | 'schedule_help';
  formRef?: React.RefObject<any>;
  initialMessage?: string;
  onFormUpdate?: (field: string, value: any) => void;
}

interface BaigerContextValue {
  isOpen: boolean;
  contextData: BaigerContextData | null;
  openBaiger: (data?: Partial<BaigerContextData>) => void;
  closeBaiger: () => void;
  toggleBaiger: () => void;
  setContextData: (data: BaigerContextData | null) => void;
}

const BaigerContext = createContext<BaigerContextValue | undefined>(undefined);

interface BaigerProviderProps {
  children: ReactNode;
}

export function BaigerProvider({ children }: BaigerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextData, setContextData] = useState<BaigerContextData | null>(null);

  const openBaiger = useCallback((data?: Partial<BaigerContextData>) => {
    if (data) {
      setContextData({
        mode: data.mode || 'general',
        formRef: data.formRef,
        initialMessage: data.initialMessage,
        onFormUpdate: data.onFormUpdate,
      });
    }
    setIsOpen(true);
  }, []);

  const closeBaiger = useCallback(() => {
    setIsOpen(false);
    // Don't clear context immediately to allow for animation
    setTimeout(() => {
      setContextData(null);
    }, 300);
  }, []);

  const toggleBaiger = useCallback(() => {
    if (isOpen) {
      closeBaiger();
    } else {
      openBaiger();
    }
  }, [isOpen, openBaiger, closeBaiger]);

  return (
    <BaigerContext.Provider
      value={{
        isOpen,
        contextData,
        openBaiger,
        closeBaiger,
        toggleBaiger,
        setContextData,
      }}
    >
      {children}
    </BaigerContext.Provider>
  );
}

export function useBaiger() {
  const context = useContext(BaigerContext);
  if (context === undefined) {
    throw new Error('useBaiger must be used within a BaigerProvider');
  }
  return context;
}
