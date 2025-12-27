import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { EggIcon, FlockIcon, InventoryIcon, TrendUpIcon, TrendDownIcon } from './icons';

const AlertsDashboard: React.FC = () => {
  const { activeAlerts, dismissAlert, moveToHistory } = useAlerts();

  if (activeAlerts.length === 0) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'production_up':
        return <TrendUpIcon className="h-6 w-6 text-green-600" />;
      case 'production_down':
        return <TrendDownIcon className="h-6 w-6 text-amber-600" />;
      case 'inventory_low':
        return <InventoryIcon className="h-6 w-6 text-red-600" />;
      default:
        return <FlockIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'production_up':
        return 'bg-green-50 border-green-500';
      case 'production_down':
        return 'bg-amber-50 border-amber-500';
      case 'inventory_low':
        return 'bg-red-50 border-red-500';
      default:
        return 'bg-gray-50 border-gray-500';
    }
  };

  const getTextColorStyles = (type: string) => {
    switch (type) {
      case 'production_up':
        return 'text-green-800 text-green-700';
      case 'production_down':
        return 'text-amber-800 text-amber-700';
      case 'inventory_low':
        return 'text-red-800 text-red-700';
      default:
        return 'text-gray-800 text-gray-700';
    };
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} dia(s) atrás`;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 mb-6">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getAlertStyles(alert.type)} border-l-4 p-4 rounded-r shadow-sm flex items-center justify-between`}
        >
          <div className="flex items-center flex-1">
            {getAlertIcon(alert.type)}
            <div className="ml-3 flex-1">
              <p className={`font-bold ${getTextColorStyles(alert.type).split(' ')[0]}`}>
                {alert.title}
              </p>
              <p className={`text-sm ${getTextColorStyles(alert.type).split(' ')[1]}`}>
                {alert.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(alert.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <select
              onChange={(e) => {
                const ttl = e.target.value as '1h' | '24h' | 'forever';
                moveToHistory(alert.id, ttl);
              }}
              className="text-xs bg-white px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              defaultValue=""
            >
              <option value="" disabled>Arquivar...</option>
              <option value="1h">Silenciar 1h</option>
              <option value="24h">Silenciar 24h</option>
              <option value="forever">Arquivar</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertsDashboard;
