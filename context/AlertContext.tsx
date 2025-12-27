import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertBatch, DismissedAlert } from '../types/alerts';

interface AlertContextType {
  activeAlerts: Alert[];
  alertHistory: AlertBatch[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'batchDate' | 'fingerprint'>) => void;
  dismissAlert: (alertId: string, ttl?: '1h' | '24h' | 'forever') => void;
  clearActiveAlerts: () => void;
  moveToHistory: (alertId: string, ttl?: '1h' | '24h' | 'forever') => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider');
  }
  return context;
};

// Função para gerar fingerprint único (sem data para consistência)
const generateAlertFingerprint = (alert: Partial<Alert>): string => {
  const parts = [
    alert.type,
    alert.flockName || alert.itemName || 'general',
    alert.metadata?.flockId || alert.metadata?.itemId || 'no-id'
  ];
  return btoa(parts.join('_'));
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertBatch[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<DismissedAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastAlertCheck = useRef<Record<string, number>>({});

  // Carregar alertas do localStorage ao iniciar
  useEffect(() => {
    const savedActive = localStorage.getItem('smartegg_active_alerts');
    const savedHistory = localStorage.getItem('smartegg_alert_history');
    const savedDismissed = localStorage.getItem('smartegg_dismissed_alerts');
    
    let loadedDismissed: DismissedAlert[] = [];
    
    if (savedActive) {
      const alerts = JSON.parse(savedActive).map((alert: any) => ({
        ...alert,
        createdAt: new Date(alert.createdAt)
      }));
      
      if (savedDismissed) {
        loadedDismissed = JSON.parse(savedDismissed).map((d: any) => ({
          ...d,
          dismissedAt: new Date(d.dismissedAt),
          expiresAt: new Date(d.expiresAt)
        }));

        // Filtrar expirados
        loadedDismissed = loadedDismissed.filter((d: DismissedAlert) => 
          d.ttl === 'forever' || new Date() < d.expiresAt
        );
      }
      
      // Filtrar ativos que já foram descartados (dupla verificação)
      const validAlerts = alerts.filter((alert: Alert) => {
        const isDismissed = loadedDismissed.some(d => {
          if (d.fingerprint !== alert.fingerprint) return false;
          if (d.ttl === 'forever') return true;
          return new Date() < d.expiresAt;
        });
        return !isDismissed;
      });
      
      setActiveAlerts(validAlerts);
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
    
    setDismissedAlerts(loadedDismissed);
    setIsLoaded(true); // Marcar como carregado para permitir saves futuros
  }, []);

  // Salvar no localStorage sempre que mudar (só após carregamento completo)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('smartegg_active_alerts', JSON.stringify(activeAlerts));
  }, [activeAlerts, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('smartegg_alert_history', JSON.stringify(alertHistory));
  }, [alertHistory, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('smartegg_dismissed_alerts', JSON.stringify(dismissedAlerts));
    
    // Limpar dados expirados do localStorage
    const expiredDismissed = dismissedAlerts.filter(d => 
      d.ttl !== 'forever' && new Date() >= d.expiresAt
    );
    
    if (expiredDismissed.length > 0) {
      // Se há descartados expirados, limpar o localStorage
      const validDismissed = dismissedAlerts.filter(d => 
        d.ttl === 'forever' || new Date() < d.expiresAt
      );
      localStorage.setItem('smartegg_dismissed_alerts', JSON.stringify(validDismissed));
    }
  }, [dismissedAlerts]);

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
      
      // Limpar alertas descartados expirados
      setDismissedAlerts(prev => 
        prev.filter(d => d.ttl === 'forever' || new Date() < d.expiresAt)
      );
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, []);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'createdAt' | 'batchDate' | 'fingerprint'>) => {
    const batchDate = new Date().toISOString().slice(0, 10);
    const fingerprint = generateAlertFingerprint({ ...alertData, batchDate });
    
    // Verificar se foi descartado recentemente
    const wasDismissed = dismissedAlerts.some(d => {
      const matches = d.fingerprint === fingerprint;
      if (d.ttl === 'forever') return matches;
      return matches && new Date() < d.expiresAt;
    });
    
    if (wasDismissed) {
      return;
    }
    
    // Verificar cooldown (5 minutos)
    const now = Date.now();
    const lastCheck = lastAlertCheck.current[fingerprint] || 0;
    const cooldown = 5 * 60 * 1000;
    const timeSinceLastCheck = now - lastCheck;
    
    if (timeSinceLastCheck < cooldown) {
      return;
    }
    
    lastAlertCheck.current[fingerprint] = now;
    
    setActiveAlerts(prev => {
      // Verificar se já existe alerta ativo com mesmo fingerprint
      const isDuplicate = prev.some(existing => existing.fingerprint === fingerprint);
      if (isDuplicate) {
        return prev;
      }

      const newAlert: Alert = {
        ...alertData,
        id: Math.random().toString(36).substr(2, 9),
        fingerprint,
        createdAt: new Date(),
        batchDate
      };

      return [...prev, newAlert];
    });
  }, [dismissedAlerts]);

  const moveToHistory = useCallback((alertId: string, ttl: '1h' | '24h' | 'forever' = '24h') => {
    setActiveAlerts(prev => {
      const alert = prev.find(a => a.id === alertId);
      if (!alert) {
        return prev;
      }
      
      const remaining = prev.filter(a => a.id !== alertId);
      
      // Adicionar ao histórico
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
      
      // Adicionar aos descartados com TTL
      const now = new Date();
      const expiresAt = new Date();
      
      if (ttl === '1h') {
        expiresAt.setHours(now.getHours() + 1);
      } else if (ttl === '24h') {
        expiresAt.setHours(now.getHours() + 24);
      } else {
        expiresAt.setFullYear(now.getFullYear() + 10); // "forever"
      }
      
      const newDismissedAlert = {
        fingerprint: alert.fingerprint,
        dismissedAt: now,
        expiresAt,
        ttl
      };
      
      setDismissedAlerts(dismissed => {
        const newDismissed = [
          ...dismissed.filter(d => d.fingerprint !== alert.fingerprint),
          newDismissedAlert
        ];
        
        return newDismissed;
      });
      
      return remaining;
    });
  }, []);

  const dismissAlert = useCallback((alertId: string, ttl: '1h' | '24h' | 'forever' = '24h') => {
    moveToHistory(alertId, ttl);
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
