import { useState, useCallback } from 'react';

export interface TerminalLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

const MAX_LOGS = 50;

export function useTerminalLogs() {
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const addLog = useCallback((message: string, type: TerminalLog['type'] = 'info') => {
    setTerminalLogs(prev =>
      [...prev, { id: Math.random().toString(36), timestamp: Date.now(), type, message }].slice(-MAX_LOGS)
    );
  }, []);

  const clearLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  return {
    terminalLogs,
    isTerminalOpen,
    setIsTerminalOpen,
    addLog,
    clearLogs,
  };
}
