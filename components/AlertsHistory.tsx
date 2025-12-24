import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { Alert } from '../types/alerts';
import { EggIcon, FlockIcon, InventoryIcon, TrendUpIcon, TrendDownIcon } from './icons';

const AlertsHistory: React.FC = () => {
  const { alertHistory } = useAlerts();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'production_up':
        return <TrendUpIcon className="h-5 w-5 text-green-600" />;
      case 'production_down':
        return <TrendDownIcon className="h-5 w-5 text-amber-600" />;
      case 'inventory_low':
        return <InventoryIcon className="h-5 w-5 text-red-600" />;
      default:
        return <FlockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'production_up':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'production_down':
        return 'bg-amber-50 border-amber-500 text-amber-800';
      case 'inventory_low':
        return 'bg-red-50 border-red-500 text-red-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedBatch = selectedDate 
    ? alertHistory.find(batch => batch.date === selectedDate)
    : null;

  // Função para gerar relatório por lote
  const generateBatchReport = (batchDate: string) => {
    const batch = alertHistory.find(b => b.date === batchDate);
    if (!batch) return null;

    const report = {
      date: batchDate,
      totalAlerts: batch.alerts.length,
      byType: {
        production_up: batch.alerts.filter(a => a.type === 'production_up').length,
        production_down: batch.alerts.filter(a => a.type === 'production_down').length,
        inventory_low: batch.alerts.filter(a => a.type === 'inventory_low').length,
      },
      byFlock: batch.alerts.reduce((acc, alert) => {
        if (alert.flockName) {
          acc[alert.flockName] = (acc[alert.flockName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      averageVariation: batch.alerts
        .filter(a => a.percentage)
        .reduce((sum, a) => sum + (a.percentage || 0), 0) / 
        batch.alerts.filter(a => a.percentage).length || 0
    };

    return report;
  };

  if (alertHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Histórico de Alertas</h2>
        <p className="text-gray-500">Nenhum alerta arquivado encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Histórico de Alertas</h2>
          <button
            onClick={() => setShowReport(!showReport)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showReport ? 'Ocultar Relatório' : 'Ver Relatório Geral'}
          </button>
        </div>

        {/* Relatório Geral */}
        {showReport && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">📊 Relatório Geral por Lotes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertHistory.map(batch => {
                const report = generateBatchReport(batch.date);
                if (!report) return null;
                
                return (
                  <div key={batch.date} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{formatDate(batch.date)}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {report.totalAlerts} alertas
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Produção ↓:</span>
                        <span className="text-amber-600 font-medium">{report.byType.production_down}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Produção ↑:</span>
                        <span className="text-green-600 font-medium">{report.byType.production_up}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estoque Baixo:</span>
                        <span className="text-red-600 font-medium">{report.byType.inventory_low}</span>
                      </div>
                      {report.averageVariation > 0 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-600">Variação Média:</span>
                          <span className="font-medium">{report.averageVariation.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Lista de datas/lotes */}
        <div className="space-y-2">
          {alertHistory.map((batch) => (
            <button
              key={batch.date}
              onClick={() => setSelectedDate(selectedDate === batch.date ? null : batch.date)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedDate === batch.date
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(batch.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {batch.alerts.length} alerta(s)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {batch.alerts.some(a => a.type === 'production_down') && (
                    <TrendDownIcon className="h-4 w-4 text-amber-600" />
                  )}
                  {batch.alerts.some(a => a.type === 'production_up') && (
                    <TrendUpIcon className="h-4 w-4 text-green-600" />
                  )}
                  {batch.alerts.some(a => a.type === 'inventory_low') && (
                    <InventoryIcon className="h-4 w-4 text-red-600" />
                  )}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      selectedDate === batch.date ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detalhes do lote selecionado */}
      {selectedBatch && (
        <div className="p-6 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-4">
            Alertas de {formatDate(selectedBatch.date)}
          </h3>
          <div className="space-y-3">
            {selectedBatch.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm opacity-75 mt-1">{alert.message}</p>
                    <p className="text-xs opacity-50 mt-2">
                      {formatTime(alert.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsHistory;
