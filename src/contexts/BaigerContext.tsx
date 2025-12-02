/**
 * BaigerContext - Global state for Baiger AI Assistant
 * Allows any component to open Baiger with context
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type BaigerMode =
  | 'general'
  | 'project_create'
  | 'candidate_search'
  | 'schedule_help'
  | 'error_report';

export interface ErrorReportContext {
  errorId: string;
  errorMessage: string;
  errorStack?: string;
  screenshot?: string;
  url: string;
  timestamp: string;
}

export interface BaigerContextData {
  mode: BaigerMode;
  formRef?: React.RefObject<any>;
  initialMessage?: string;
  onFormUpdate?: (field: string, value: any) => void;
  // Error reporting specific context
  errorReport?: ErrorReportContext;
}

interface BaigerContextValue {
  isOpen: boolean;
  contextData: BaigerContextData | null;
  openBaiger: (data?: Partial<BaigerContextData>) => void;
  closeBaiger: () => void;
  toggleBaiger: () => void;
  setContextData: (data: BaigerContextData | null) => void;
  openWithErrorReport: (errorReport: ErrorReportContext, userDescription?: string) => void;
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

  // Open Baiger with error report context
  const openWithErrorReport = useCallback((errorReport: ErrorReportContext, userDescription?: string) => {
    const initialMessage = `I just encountered an error and need help understanding it.

**Error ID:** ${errorReport.errorId}
**Error:** ${errorReport.errorMessage}
**Page:** ${errorReport.url}
**Time:** ${new Date(errorReport.timestamp).toLocaleString()}
${userDescription ? `\n**What I was doing:** ${userDescription}` : ''}

Can you help me understand what might have caused this and how to resolve it?`;

    setContextData({
      mode: 'error_report',
      initialMessage,
      errorReport,
    });
    setIsOpen(true);
  }, []);

  return (
    <BaigerContext.Provider
      value={{
        isOpen,
        contextData,
        openBaiger,
        closeBaiger,
        toggleBaiger,
        setContextData,
        openWithErrorReport,
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
