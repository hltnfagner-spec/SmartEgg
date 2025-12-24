import React from 'react';
import AlertsHistory from './AlertsHistory';

const AlertsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Alertas</h1>
        <p className="text-gray-600 mt-2">
          Visualize todos os alertas arquivados por data e lote.
        </p>
      </div>
      
      <AlertsHistory />
    </div>
  );
};

export default AlertsPage;
