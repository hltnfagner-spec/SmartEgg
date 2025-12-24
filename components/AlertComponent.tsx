import { useState, useEffect, useMemo } from 'react';
import { Alert, AlertType } from '../types';

interface AlertComponentProps {
  alerts: Alert[];
  onAlertClose: (alertId: string) => void;
}

const AlertComponent: React.FC<AlertComponentProps> = ({ alerts, onAlertClose }) => {
  // Filtrar alertas que ainda não expiraram e não foram lidos
  const activeAlerts = useMemo(() => {
    const now = new Date();
    return alerts.filter(alert => {
      const expiresAt = new Date(alert.expiresAt);
      return !alert.isRead && expiresAt > now;
    });
  }, [alerts]);

  // Limpar alertas expirados automaticamente
  useEffect(() => {
    const expiredAlerts = alerts.filter(alert => {
      const expiresAt = new Date(alert.expiresAt);
      return expiresAt <= new Date();
    });

    expiredAlerts.forEach(alert => {
      onAlertClose(alert.id);
    });
  }, [alerts, onAlertClose]);

  // Calcular tempo restante para expiração
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min restantes`;
    } else {
      return `${minutes}min restantes`;
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const expiredAlerts = alerts.filter(alert => {
        const expiresAt = new Date(alert.expiresAt);
        return !alert.isRead && expiresAt <= now;
      });

      expiredAlerts.forEach(alert => {
        onAlertClose(alert.id);
      });
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [alerts, onAlertClose]);

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'queda-producao':
        return 'bg-amber-50 border-amber-500 text-amber-800';
      case 'aumento-producao':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'estoque-baixo':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'mortalidade-alta':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'despesa-alta':
        return 'bg-orange-50 border-orange-500 text-orange-800';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'queda-producao':
        return (
          <svg className="h-8 w-8 text-amber-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        );
      case 'aumento-producao':
        return (
          <svg className="h-8 w-8 text-green-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        );
      case 'estoque-baixo':
        return (
          <svg className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'mortalidade-alta':
        return (
          <svg className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'despesa-alta':
        return (
          <svg className="h-8 w-8 text-orange-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 mb-8">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 p-6 rounded-r-lg shadow-sm flex items-center hover:shadow-md transition-shadow cursor-pointer ${getAlertStyles(
            alert.type
          )}`}
          onClick={() => onAlertClose(alert.id)}
        >
          {getAlertIcon(alert.type)}
          <div className="flex-1">
            <p className="font-bold text-lg">{alert.title}</p>
            <p className="text-sm">{alert.message}</p>
            <p className="text-xs mt-2 opacity-60">
              ⏰ {getTimeRemaining(alert.expiresAt)}
            </p>
          </div>
          <button
            className="ml-4 text-sm opacity-75 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onAlertClose(alert.id);
            }}
          >
            Fechar
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertComponent;
