import { useState, useMemo, useEffect } from 'react';
import { Alert, AlertType } from '../types';
import { useFarm } from '../context/FarmContext';

const AlertReports: React.FC<{ filteredAlerts?: Alert[] }> = ({ filteredAlerts: propsAlerts }) => {
  const { alerts, deleteAlert, clearExpiredAlerts } = useFarm();
  const [filterType, setFilterType] = useState<AlertType | 'todos'>('todos');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'lidos' | 'nao-lidos'>('todos');
  const [dateRange, setDateRange] = useState<'7dias' | '30dias' | 'todos'>('todos');

  // Usar alertas filtrados das props se fornecidos, senão usar todos os alertas
  const baseAlerts = propsAlerts || alerts;

  // Limpar alertas muito antigos (mais de 90 dias) ao carregar o componente
  useEffect(() => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const veryOldAlerts = alerts.filter(alert => new Date(alert.createdAt) < ninetyDaysAgo);
    
    if (veryOldAlerts.length > 0) {
      console.log(`[AlertReports] Limpando ${veryOldAlerts.length} alertas com mais de 90 dias`);
      veryOldAlerts.forEach(alert => deleteAlert(alert.id));
    }
  }, [alerts, deleteAlert]);

  // Filtrar alertas baseado nos filtros selecionados
  const filteredAlerts = useMemo(() => {
    let filtered = [...baseAlerts];

    // Garantir que todos os alertas sejam incluídos, incluindo expirados e lidos
    console.log(`[AlertReports] Total de alertas no sistema: ${filtered.length}`);

    // Filtrar por tipo
    if (filterType !== 'todos') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    // Filtrar por status
    if (filterStatus === 'lidos') {
      filtered = filtered.filter(alert => alert.isRead);
    } else if (filterStatus === 'nao-lidos') {
      filtered = filtered.filter(alert => !alert.isRead);
    }

    // Filtrar por período
    const now = new Date();
    if (dateRange === '7dias') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(alert => new Date(alert.createdAt) >= sevenDaysAgo);
    } else if (dateRange === '30dias') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(alert => new Date(alert.createdAt) >= thirtyDaysAgo);
    }

    // Ordenar por data (mais recentes primeiro)
    const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`[AlertReports] Alertas filtrados: ${sorted.length}`);
    
    return sorted;
  }, [baseAlerts, filterType, filterStatus, dateRange]);

  // Estatísticas dos alertas
  const statistics = useMemo(() => {
    const total = baseAlerts.length;
    const read = baseAlerts.filter(a => a.isRead).length;
    const unread = baseAlerts.filter(a => !a.isRead).length;
    const expired = baseAlerts.filter(a => new Date(a.expiresAt) <= new Date()).length;

    const byType: Record<AlertType, number> = {
      'queda-producao': baseAlerts.filter(a => a.type === 'queda-producao').length,
      'aumento-producao': baseAlerts.filter(a => a.type === 'aumento-producao').length,
      'estoque-baixo': baseAlerts.filter(a => a.type === 'estoque-baixo').length,
      'mortalidade-alta': baseAlerts.filter(a => a.type === 'mortalidade-alta').length,
      'despesa-alta': baseAlerts.filter(a => a.type === 'despesa-alta').length,
    };

    return { total, read, unread, expired, byType };
  }, [baseAlerts]);

  const getAlertTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'queda-producao': return 'Queda de Produção';
      case 'aumento-producao': return 'Aumento de Produção';
      case 'estoque-baixo': return 'Estoque Baixo';
      case 'mortalidade-alta': return 'Mortalidade Alta';
      case 'despesa-alta': return 'Despesa Alta';
      default: return type;
    }
  };

  const getAlertTypeColor = (type: AlertType) => {
    switch (type) {
      case 'queda-producao': return 'text-amber-600 bg-amber-50';
      case 'aumento-producao': return 'text-green-600 bg-green-50';
      case 'estoque-baixo': return 'text-red-600 bg-red-50';
      case 'mortalidade-alta': return 'text-red-600 bg-red-50';
      case 'despesa-alta': return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (alert: Alert) => {
    return new Date(alert.expiresAt) <= new Date();
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatórios de Alertas</h1>
        <p className="text-slate-600">Visualize e gerencie todos os alertas do sistema</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Total de Alertas</p>
            <p className="text-2xl font-bold text-slate-800">{statistics.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Não Lidos</p>
            <p className="text-2xl font-bold text-red-600">{statistics.unread}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Lidos</p>
            <p className="text-2xl font-bold text-green-600">{statistics.read}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Expirados</p>
            <p className="text-2xl font-bold text-slate-400">{statistics.expired}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Alerta</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AlertType | 'todos')}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="todos">Todos</option>
              <option value="queda-producao">Queda de Produção</option>
              <option value="aumento-producao">Aumento de Produção</option>
              <option value="estoque-baixo">Estoque Baixo</option>
              <option value="mortalidade-alta">Mortalidade Alta</option>
              <option value="despesa-alta">Despesa Alta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'todos' | 'lidos' | 'nao-lidos')}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="todos">Todos</option>
              <option value="nao-lidos">Não Lidos</option>
              <option value="lidos">Lidos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7dias' | '30dias' | 'todos')}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="todos">Todo o período</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Alertas ({filteredAlerts.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja limpar todos os alertas expirados?')) {
                  clearExpiredAlerts();
                }
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              Limpar Expirados
            </button>
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja limpar todos os alertas lidos?')) {
                  alerts.filter(a => a.isRead).forEach(alert => deleteAlert(alert.id));
                }
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Limpar Lidos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredAlerts.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left">Tipo</th>
                  <th className="px-6 py-3 text-left">Título</th>
                  <th className="px-6 py-3 text-left">Mensagem</th>
                  <th className="px-6 py-3 text-left">Lote</th>
                  <th className="px-6 py-3 text-left">Data</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertTypeColor(alert.type)}`}>
                        {getAlertTypeLabel(alert.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{alert.title}</td>
                    <td className="px-6 py-4 text-slate-600">{alert.message}</td>
                    <td className="px-6 py-4 text-slate-600">{alert.flockName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(alert.createdAt)}</td>
                    <td className="px-6 py-4">
                      {alert.isRead ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Lido
                        </span>
                      ) : isExpired(alert) ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Expirado
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Não Lido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este alerta?')) {
                            deleteAlert(alert.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Nenhum alerta encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertReports;
