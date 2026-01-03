import { useState, FC, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { TrendUpIcon, TrendDownIcon, EggIcon, CalculatorIcon, ReportIcon } from './icons';

type PeriodType = 'today' | 'week' | 'month' | 'lastMonth' | 'custom';

interface FlockPerformance {
  id: string;
  name: string;
  totalEggs: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  status: 'profit' | 'loss' | 'breakeven';
}

const PerformanceDashboard: FC = () => {
  const { flocks, records, expenses, sales, getHensCountOnDate } = useFarm();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [showDetails, setShowDetails] = useState(false);

  // Calculate date range based on period
  const getDateRange = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - offset);
    
    let start: Date;
    let end: Date = localToday;
    
    switch (periodType) {
      case 'today':
        start = new Date(localToday);
        break;
      case 'week':
        start = new Date(localToday);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(localToday);
        start.setDate(start.getDate() - 30);
        break;
      case 'lastMonth':
        start = new Date(localToday);
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end = new Date(localToday);
        end.setDate(0); // Last day of previous month
        break;
      default:
        start = new Date(localToday);
        start.setDate(start.getDate() - 30);
    }
    
    return { start, end };
  }, [periodType]);

  // Calculate previous period for comparison
  const getPreviousPeriod = useMemo(() => {
    const { start, end } = getDateRange;
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    
    return { start: prevStart, end: prevEnd };
  }, [getDateRange]);

  // Calculate flock performance for current period
  const currentPerformance = useMemo(() => {
    const { start, end } = getDateRange;
    
    return flocks
      .filter(f => f.status === 'Ativo')
      .map(flock => {
        const flockRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return r.flockId === flock.id && recordDate >= start && recordDate <= end;
        });

        const flockExpenses = expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return e.flockId === flock.id && expenseDate >= start && expenseDate <= end;
        });

        const flockSales = sales.filter(s => {
          const saleDate = new Date(s.date);
          return s.flockId === flock.id && saleDate >= start && saleDate <= end;
        });

        const totalEggs = flockRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
        const totalCost = flockExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = flockSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const profit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
          id: flock.id,
          name: flock.name,
          totalEggs,
          totalCost,
          totalRevenue,
          profit,
          profitMargin,
          status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'breakeven'
        } as FlockPerformance;
      })
      .filter(f => f.totalEggs > 0 || f.totalCost > 0 || f.totalRevenue > 0);
  }, [flocks, records, expenses, sales, getDateRange]);

  // Calculate previous period performance for comparison
  const previousPerformance = useMemo(() => {
    const { start, end } = getPreviousPeriod;
    
    return flocks
      .filter(f => f.status === 'Ativo')
      .map(flock => {
        const flockRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return r.flockId === flock.id && recordDate >= start && recordDate <= end;
        });

        const flockExpenses = expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return e.flockId === flock.id && expenseDate >= start && expenseDate <= end;
        });

        const flockSales = sales.filter(s => {
          const saleDate = new Date(s.date);
          return s.flockId === flock.id && saleDate >= start && saleDate <= end;
        });

        const totalEggs = flockRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
        const totalCost = flockExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalRevenue = flockSales.reduce((sum, s) => sum + s.totalAmount, 0);
        const profit = totalRevenue - totalCost;

        return { profit, totalEggs };
      });
  }, [flocks, records, expenses, sales, getPreviousPeriod]);

  // Calculate totals and comparisons
  const totals = useMemo(() => {
    const currentTotal = currentPerformance.reduce((sum, f) => sum + f.profit, 0);
    const previousTotal = previousPerformance.reduce((sum, f) => sum + f.profit, 0);
    const currentEggs = currentPerformance.reduce((sum, f) => sum + f.totalEggs, 0);
    const previousEggs = previousPerformance.reduce((sum, f) => sum + f.totalEggs, 0);
    
    const profitChange = previousTotal !== 0 ? ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100 : 0;
    const productivityChange = previousEggs !== 0 ? ((currentEggs - previousEggs) / Math.abs(previousEggs)) * 100 : 0;
    
    const profitableFlocks = currentPerformance.filter(f => f.status === 'profit').length;
    const totalFlocks = currentPerformance.length;
    const profitabilityRate = totalFlocks > 0 ? (profitableFlocks / totalFlocks) * 100 : 0;

    return {
      currentTotal,
      previousTotal,
      profitChange,
      currentEggs,
      productivityChange,
      profitabilityRate,
      profitableFlocks,
      totalFlocks
    };
  }, [currentPerformance, previousPerformance]);

  const formatPeriodLabel = () => {
    switch (periodType) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'lastMonth': return 'Mês Anterior';
      default: return 'Período';
    }
  };

  const formatTrendIcon = (change: number) => {
    if (change > 0) return <TrendUpIcon className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendDownIcon className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const formatTrendText = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendUpIcon className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Performance por Lote</h2>
            <p className="text-sm text-gray-500">Análise de rentabilidade</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="lastMonth">Mês Anterior</option>
          </select>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">vs</span>
            <span className="text-sm font-medium text-gray-800">Período Anterior</span>
            {formatTrendIcon(totals.profitChange)}
            <span className={`text-sm font-bold ${getTrendColor(totals.profitChange)}`}>
              {formatTrendText(totals.profitChange)}
            </span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            {showDetails ? 'Resumir' : 'Detalhes'}
          </button>
        </div>
      </div>

      {/* Flock Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentPerformance.map((flock) => (
          <div
            key={flock.id}
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
              flock.status === 'profit' ? 'bg-green-50 border-green-200' :
              flock.status === 'loss' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">{flock.name}</h3>
              <div className={`w-3 h-3 rounded-full ${
                flock.status === 'profit' ? 'bg-green-500' :
                flock.status === 'loss' ? 'bg-red-500' :
                'bg-gray-400'
              }`} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Ovos:</span>
                <span className="font-medium">{flock.totalEggs.toLocaleString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Resultado:</span>
                <span className={`font-bold ${
                  flock.status === 'profit' ? 'text-green-700' :
                  flock.status === 'loss' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {flock.profit > 0 ? '+' : ''}R$ {flock.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border-2 ${
            totals.currentTotal >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Resultado Total</span>
              <CalculatorIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                totals.currentTotal >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {totals.currentTotal >= 0 ? '+' : ''}R$ {totals.currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {formatTrendIcon(totals.profitChange)}
              <span className={`text-sm font-bold ${getTrendColor(totals.profitChange)}`}>
                {formatTrendText(totals.profitChange)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Produtividade</span>
              <EggIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {totals.currentEggs.toLocaleString('pt-BR')} ovos
              </span>
              {formatTrendIcon(totals.productivityChange)}
              <span className={`text-sm font-bold ${getTrendColor(totals.productivityChange)}`}>
                {formatTrendText(totals.productivityChange)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Taxa de Sucesso</span>
              <ReportIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-700">
                {totals.profitabilityRate.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-600">
                ({totals.profitableFlocks}/{totals.totalFlocks} lotes)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
          📋 Análise Detalhada
        </button>
        <button className="flex-1 py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
          💰 Otimizar Custos
        </button>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
