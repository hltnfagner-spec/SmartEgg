import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, AlertBatch } from '../types/alerts';

interface AlertContextType {
  activeAlerts: Alert[];
  alertHistory: AlertBatch[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'batchDate'>) => void;
  dismissAlert: (alertId: string) => void;
  clearActiveAlerts: () => void;
  moveToHistory: (alertId: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertBatch[]>([]);

  // Carregar alertas do localStorage ao iniciar
  useEffect(() => {
    const savedActive = localStorage.getItem('smartegg_active_alerts');
    const savedHistory = localStorage.getItem('smartegg_alert_history');
    
    if (savedActive) {
      const alerts = JSON.parse(savedActive).map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }));
      setActiveAlerts(alerts);
    }
    
    if (savedHistory) {
      const history = JSON.parse(savedHistory).map((batch: any) => ({
        ...batch,
        alerts: batch.alerts.map((alert: any) => ({
          ...alert,
          createdAt: new Date(alert.createdAt)
        }))
      }));
      setAlertHistory(history);
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('smartegg_active_alerts', JSON.stringify(activeAlerts));
  }, [activeAlerts]);

  useEffect(() => {
    localStorage.setItem('smartegg_alert_history', JSON.stringify(alertHistory));
  }, [alertHistory]);

  // Verificar alertas com mais de 24 horas e mover para histórico
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      setActiveAlerts(prev => {
        const expired = prev.filter(alert => alert.createdAt <= twentyFourHoursAgo);
        const stillActive = prev.filter(alert => alert.createdAt > twentyFourHoursAgo);
        
        // Mover expirados para o histórico
        if (expired.length > 0) {
          setAlertHistory(history => {
            const newHistory = [...history];
            
            expired.forEach(alert => {
              const existingBatch = newHistory.find(batch => batch.date === alert.batchDate);
              
              if (existingBatch) {
                existingBatch.alerts.push(alert);
              } else {
                newHistory.push({
                  date: alert.batchDate,
                  alerts: [alert]
                });
              }
            });
            
            // Ordenar por data (mais recente primeiro)
            return newHistory.sort((a, b) => b.date.localeCompare(a.date));
          });
        }
        
        return stillActive;
      });
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'createdAt' | 'batchDate'>) => {
    setActiveAlerts(prev => {
      // Verificar se já existe um alerta idêntico (mesmo tipo, título e mensagem)
      const isDuplicate = prev.some(existing => 
        existing.type === alertData.type &&
        existing.title === alertData.title &&
        existing.message === alertData.message
      );

      if (isDuplicate) {
        return prev; // Não adiciona se já existir
      }

      const newAlert: Alert = {
        ...alertData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        batchDate: new Date().toISOString().slice(0, 10)
      };

      return [...prev, newAlert];
    });
  }, []);

  const moveToHistory = useCallback((alertId: string) => {
    setActiveAlerts(prev => {
      const alert = prev.find(a => a.id === alertId);
      if (!alert) return prev;
      
      const remaining = prev.filter(a => a.id !== alertId);
      
      setAlertHistory(history => {
        const newHistory = [...history];
        const existingBatch = newHistory.find(batch => batch.date === alert.batchDate);
        
        if (existingBatch) {
          existingBatch.alerts.push(alert);
        } else {
          newHistory.push({
            date: alert.batchDate,
            alerts: [alert]
          });
        }
        
        return newHistory.sort((a, b) => b.date.localeCompare(a.date));
      });
      
      return remaining;
    });
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    // Agora também arquiva em vez de descartar
    moveToHistory(alertId);
  }, [moveToHistory]);

  const clearActiveAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  return (
    <AlertContext.Provider value={{
      activeAlerts,
      alertHistory,
      addAlert,
      dismissAlert,
      clearActiveAlerts,
      moveToHistory
    }}>
      {children}
    </AlertContext.Provider>
  );
};
