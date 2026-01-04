import { useState, useMemo, FC, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { TrendUpIcon, TrendDownIcon, EggIcon, CalculatorIcon, ReportIcon } from './icons';

// Tipos
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';
type SortType = 'profit' | 'margin' | 'production' | 'cost';
type FlockPhase = 'Crescimento' | 'Pico' | 'Declínio';

// Interface para dados de performance do lote
interface FlockPerformance {
  id: string;
  name: string;
  totalEggs: number;
  totalCost: number;
  feedCost: number;
  otherCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  costPerEgg: number;
  feedCostPerEgg: number;
  roi: number;
  ageInWeeks: number;
  phase: FlockPhase;
  status: 'profit' | 'loss' | 'breakeven';
  layingRatePercentage: number; // NOVO: Taxa de postura
  // Variações vs período anterior
  profitChange: number;
  productionChange: number;
  marginChange: number;
}

// Props para compatibilidade com Dashboard existente
interface PerformanceDashboardV2Props {
  initialPeriod?: 'this-month' | 'last-month' | 'all-time';
  initialFlockId?: string;
}

const PerformanceDashboardV2: FC<PerformanceDashboardV2Props> = ({ 
  initialPeriod = 'this-month',
  initialFlockId = 'all'
}) => {
  // Hooks do contexto
  const { flocks, records, expenses, sales, getHensCountOnDate } = useFarm();
  
  // Estados
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortType, setSortType] = useState<SortType>('profit');
  const [sortDesc, setSortDesc] = useState(true);
  const [showInsights, setShowInsights] = useState(false);
  
  // Inicializar com um valor temporário, será atualizado após o cálculo do ranking
  const [flockFilter, setFlockFilter] = useState<string>(initialFlockId !== 'all' ? initialFlockId : '');

  // Converter período do Dashboard para o novo formato
  useMemo(() => {
    switch (initialPeriod) {
      case 'this-month':
        setPeriodType('monthly');
        break;
      case 'last-month':
        // Configurar datas personalizadas para mês anterior
        const today = new Date();
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setCustomStartDate(firstDayLastMonth.toISOString().split('T')[0]);
        setCustomEndDate(lastDayLastMonth.toISOString().split('T')[0]);
        setPeriodType('custom');
        break;
      case 'all-time':
        // Configurar datas personalizadas para todo o período
        const firstFlock = flocks.reduce((earliest, flock) => {
          const arrivalDate = new Date(flock.arrivalDate);
          return earliest && new Date(earliest) < arrivalDate ? earliest : flock.arrivalDate;
        }, '');
        setCustomStartDate(firstFlock ? firstFlock.split('T')[0] : '');
        setCustomEndDate(new Date().toISOString().split('T')[0]);
        setPeriodType('custom');
        break;
    }
  }, [initialPeriod, flocks]);

  // Cálculo de datas baseado no período selecionado
  const dateRange = useMemo(() => {
    const today = new Date();
    let end = new Date(today);
    let start = new Date(today);
    
    // Normalizar para início/fim do dia usando data local
    end.setHours(23, 59, 59, 999);
    
    switch (periodType) {
      case 'daily':
        // Usar data local para compatibilidade com usuário
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        if (customStartDate) {
          start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
        }
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }
    
    return { start, end };
  }, [periodType, customStartDate, customEndDate]);

  // Cálculo do período anterior para comparações
  const previousDateRange = useMemo(() => {
    const { start, end } = dateRange;
    const duration = end.getTime() - start.getTime();
    
    // Para período diário, usar ontem inteiro com data local
    if (periodType === 'daily') {
      const yesterday = new Date(start);
      yesterday.setDate(yesterday.getDate() - 1);
      const prevStart = new Date(yesterday);
      prevStart.setHours(0, 0, 0, 0);
      const prevEnd = new Date(yesterday);
      prevEnd.setHours(23, 59, 59, 999);
      return { start: prevStart, end: prevEnd };
    }
    
    // Para outros períodos, usar lógica original
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return { start: prevStart, end: prevEnd };
  }, [dateRange, periodType]);

  // Função para calcular a idade do lote em semanas
  const calculateFlockAge = (flock: any): { ageInWeeks: number, phase: FlockPhase } => {
    const today = new Date();
    const birthDate = new Date(flock.birthDate);
    const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageInWeeks = Math.floor(ageInDays / 7);
    
    // Determinar fase baseado na idade
    let phase: FlockPhase;
    if (ageInWeeks < 25) {
      phase = 'Crescimento';
    } else if (ageInWeeks < 65) {
      phase = 'Pico';
    } else {
      phase = 'Declínio';
    }
    
    return { ageInWeeks, phase };
  };

  // Função auxiliar para calcular dados de um período
  const calculatePeriodData = (startDate: Date, endDate: Date, flockId: string) => {
    // Converter datas locais para UTC para compatibilidade com dados salvos
    const startUTC = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
    const endUTC = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
    
    // Filtrar registros do período - usar UTC para compatibilidade
    const flockRecords = records.filter(r => {
      const d = new Date(r.date);
      return r.flockId === flockId && d >= startUTC && d <= endUTC;
    });

    // Filtrar despesas do período - usar UTC para compatibilidade
    const flockExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      // Apenas despesas específicas do lote
      return e.flockId === flockId && d >= startUTC && d <= endUTC;
    });

    // Calcular rateio de despesas gerais (se houver)
    const generalExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return !e.flockId && d >= startUTC && d <= endUTC;
    });

    let generalExpensesRateio = 0;
    let totalGeneralCost = 0;
    let totalHensAllFlocks = 0;
    let flockHens = 0;
    let rateioPerHen = 0;
    
    if (generalExpenses.length > 0) {
      // Rateio por número de aves
      totalGeneralCost = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Calcular número total de aves em lotes ativos no período
      const activeFlocks = flocks.filter(f => f.status === 'Ativo');
      totalHensAllFlocks = activeFlocks.reduce((sum, flock) => {
        // Usar número de aves no final do período
        const flockHensCount = getHensCountOnDate(flock.id, endUTC);
        return sum + flockHensCount;
      }, 0);
      
      // Rateio proporcional por número de aves
      if (totalHensAllFlocks > 0) {
        flockHens = getHensCountOnDate(flockId, endUTC);
        rateioPerHen = totalGeneralCost / totalHensAllFlocks;
        generalExpensesRateio = flockHens * rateioPerHen;
      }
    }

    // Calcular custo específico do lote
    const flockSpecificCost = flockExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Debug para verificar rateio
    if (periodType === 'weekly' && flockId.includes('28bb75')) {
      console.log('[DEBUG RATEIO]');
      console.log(`  Custo geral total: R$${totalGeneralCost}`);
      console.log(`  Total aves todos lotes: ${totalHensAllFlocks}`);
      console.log(`  Aves deste lote: ${flockHens}`);
      console.log(`  Rateio por ave: R$${rateioPerHen.toFixed(4)}`);
      console.log(`  Rateio total lote: R$${generalExpensesRateio.toFixed(2)}`);
      console.log(`  Despesas específicas: R$${flockSpecificCost}`);
      console.log(`  Custo final: R$${flockSpecificCost + generalExpensesRateio}`);
    }

    // Filtrar vendas do período - usar UTC para compatibilidade
    const flockSales = sales.filter(s => {
      const d = new Date(s.date);
      return s.flockId === flockId && d >= startUTC && d <= endUTC;
    });

    // Calcular totais
    const totalEggs = flockRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
    const totalRevenue = flockSales.reduce((sum, s) => sum + s.totalAmount, 0);
    
    // Separar custos de ração dos demais
    const feedExpenses = flockExpenses.filter(e => 
      e.category?.toLowerCase().includes('ração') || 
      e.description?.toLowerCase().includes('ração')
    );
    const feedCost = feedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCost = flockSpecificCost + generalExpensesRateio;
    const otherCost = totalCost - feedCost;

    // Métricas financeiras
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return {
      totalEggs,
      totalCost,
      feedCost,
      otherCost,
      totalRevenue,
      profit,
      profitMargin
    };
  };

  // Cálculo principal de performance dos lotes
  const performanceData = useMemo(() => {
    const data = flocks
      .filter(f => f.status === 'Ativo')
      .map(flock => {
        // Calcular idade e fase
        const { ageInWeeks, phase } = calculateFlockAge(flock);
        
        // Dados do período atual
        const current = calculatePeriodData(dateRange.start, dateRange.end, flock.id);
        
        // Dados do período anterior para comparação
        const previous = calculatePeriodData(previousDateRange.start, previousDateRange.end, flock.id);

        // Métricas derivadas
        const costPerEgg = current.totalEggs > 0 ? current.totalCost / current.totalEggs : 0;
        const feedCostPerEgg = current.totalEggs > 0 ? current.feedCost / current.totalEggs : 0;
        const roi = current.totalCost > 0 ? (current.profit / current.totalCost) * 100 : 0;

        // Calcular taxa de postura
        let layingRatePercentage = 0;
        // Calcular com base nos dados do período atual
        if (current.totalEggs > 0) {
          // Obter os registros do período atual para calcular dias únicos
          const periodRecords = records.filter(r => {
            const d = new Date(r.date);
            return r.flockId === flock.id && d >= dateRange.start && d <= dateRange.end;
          });
          
          const uniqueDays = new Set(periodRecords.map(r => r.date.split('T')[0])).size;
          const avgDailyEggs = current.totalEggs / uniqueDays;
          const currentHens = getHensCountOnDate(flock.id, new Date());
          layingRatePercentage = (avgDailyEggs / currentHens) * 100;
          layingRatePercentage = Math.min(layingRatePercentage, 100);
        }

        // Calcular variações (deltas) em relação ao período anterior
        const calculateDelta = (curr: number, prev: number) => {
          // Se não há dados anteriores, mostrar "novo período"
          if (prev === 0) return curr === 0 ? 0 : 0;
          
          // Calcular variação percentual
          const delta = ((curr - prev) / Math.abs(prev)) * 100;
          
          // Limitar variação a ±100% para valores impossíveis
          if (Math.abs(delta) > 100) {
            return delta > 0 ? 100 : -100;
          }
          
          return delta;
        };

        return {
          id: flock.id,
          name: flock.name,
          ...current,
          costPerEgg,
          feedCostPerEgg,
          roi,
          layingRatePercentage, // NOVO: Adicionar taxa de postura
          ageInWeeks,
          phase,
          status: current.profit > 0 ? 'profit' : current.profit < 0 ? 'loss' : 'breakeven',
          profitChange: calculateDelta(current.profit, previous.profit),
          productionChange: calculateDelta(current.totalEggs, previous.totalEggs),
          marginChange: current.profitMargin - previous.profitMargin // Diferença absoluta para %
        } as FlockPerformance;
      });

    // Ordenação conforme selecionado
    return data.sort((a, b) => {
      let valA = a[sortType];
      let valB = b[sortType];
      
      // Ajuste para margem que é calculada
      if (sortType === 'margin') {
        valA = a.profitMargin;
        valB = b.profitMargin;
      }

      return sortDesc ? valB - valA : valA - valB;
    });
  }, [flocks, records, expenses, sales, dateRange, previousDateRange, sortType, sortDesc]);

  // Selecionar o lote do topo do ranking se nenhum filtro estiver definido
  useEffect(() => {
    // Se não temos um filtro definido e temos dados de performance calculados
    if (flockFilter === '' && performanceData.length > 0) {
      // Seleciona o ID do primeiro lote do ranking (já ordenado conforme sortType)
      setFlockFilter(performanceData[0].id);
    }
  }, [performanceData, flockFilter]);

  // Filtrar por lote específico se selecionado
  const filteredPerformanceData = useMemo(() => {
    // Se o filtro ainda estiver vazio (carregando inicial) ou for 'all', retorna todos
    if (flockFilter === '' || flockFilter === 'all') {
      return performanceData;
    }
    // Caso contrário, filtra pelo lote selecionado
    return performanceData.filter(f => f.id === flockFilter);
  }, [performanceData, flockFilter]);

  // Calcular totais gerais
  const totals = useMemo(() => {
    return filteredPerformanceData.reduce((acc, curr) => ({
      revenue: acc.revenue + curr.totalRevenue,
      cost: acc.cost + curr.totalCost,
      feedCost: acc.feedCost + curr.feedCost,
      profit: acc.profit + curr.profit,
      eggs: acc.eggs + curr.totalEggs
    }), { revenue: 0, cost: 0, feedCost: 0, profit: 0, eggs: 0 });
  }, [filteredPerformanceData]);

  // Métricas derivadas dos totais
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const feedCostPercentage = totals.cost > 0 ? (totals.feedCost / totals.cost) * 100 : 0;

  // Componente visual para indicadores de tendência
  const TrendBadge = ({ value, isPercent = true, invertColor = false }: { value: number, isPercent?: boolean, invertColor?: boolean }) => {
    if (Math.abs(value) < 0.1) return <span className="text-gray-400 text-xs">-</span>;
    
    const isPositive = value > 0;
    // Se invertColor for true, positivo é ruim (ex: custo aumentou)
    const isGood = invertColor ? !isPositive : isPositive;
    
    const ColorClass = isGood ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    const Icon = isPositive ? TrendUpIcon : TrendDownIcon;

    return (
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${ColorClass}`}>
        <Icon className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}{isPercent ? '%' : ''}
      </div>
    );
  };

  // Gerar insights automáticos baseados nos dados
  const insights = useMemo(() => {
    const results: string[] = [];
    
    filteredPerformanceData.forEach(flock => {
      // Alerta de margem baixa persistente
      if (flock.profitMargin < 10 && flock.marginChange <= 0 && flock.totalRevenue > 0) {
        results.push(`⚠️ Lote ${flock.name}: margem abaixo de 10% há 2 semanas. Avaliar renovação.`);
      }
      
      // Alerta de custo de ração alto
      const feedCostRatio = flock.feedCost / flock.totalCost * 100;
      if (feedCostRatio > 80) {
        results.push(`📈 Lote ${flock.name}: custo de ração acima de 80%. Revisar formulação.`);
      }
      
      // Alerta de queda brusca na produção
      if (flock.productionChange < -15 && flock.totalEggs > 0) {
        results.push(`📉 Lote ${flock.name}: queda de ${Math.abs(flock.productionChange).toFixed(1)}% na produção. Verificar manejo e saúde.`);
      }
      
      // Alerta de lote em fase final com baixa margem
      if (flock.phase === 'Declínio' && flock.profitMargin < 15) {
        results.push(`🔴 Lote ${flock.name}: ${flock.ageInWeeks} semanas com margem baixa. Considerar descarte.`);
      }
    });
    
    return results;
  }, [filteredPerformanceData]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header e Controles */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalculatorIcon className="h-6 w-6 text-purple-600" />
              Performance por Lote
            </h2>
            <p className="text-sm text-slate-600 mt-1">Análise de rentabilidade e eficiência por período</p>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Período */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                📅 Período
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPeriodType('daily')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    periodType === 'daily' 
                      ? 'bg-white text-purple-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Diário
                </button>
                <button
                  onClick={() => setPeriodType('weekly')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    periodType === 'weekly' 
                      ? 'bg-white text-purple-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setPeriodType('monthly')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    periodType === 'monthly' 
                      ? 'bg-white text-purple-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setPeriodType('custom')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    periodType === 'custom' 
                      ? 'bg-white text-purple-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            </div>
            
            {/* Date Picker para período personalizado */}
            {periodType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                />
                <span className="text-slate-500">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-slate-200 rounded-md"
                />
              </div>
            )}
            
            {/* Seletor de Lote */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Lote
              </label>
              <select 
                value={flockFilter}
                onChange={(e) => setFlockFilter(e.target.value)}
                className="w-full sm:w-auto min-w-[180px] text-sm font-medium border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white py-2 pl-3 pr-10 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value="all">Todos os Lotes</option>
                {flocks.filter(f => f.status === 'Ativo').map(flock => (
                  <option key={flock.id} value={flock.id}>{flock.name}</option>
                ))}
              </select>
            </div>
            
            {/* Ordenação */}
            <div className="flex items-center gap-2 border-l pl-3 ml-1 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Ordenar:</span>
              <select 
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                className="text-sm border-none bg-transparent font-medium text-slate-700 focus:ring-0 cursor-pointer"
              >
                <option value="profit">Lucro Total</option>
                <option value="margin">Margem %</option>
                <option value="production">Produção</option>
                <option value="cost">Custo/Ovo</option>
              </select>
              <button 
                onClick={() => setSortDesc(!sortDesc)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                {sortDesc ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
        {/* KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-purple-100 text-sm font-medium mb-1">Lucro Líquido (Período)</p>
              <h3 className="text-3xl font-bold mb-1">
                {totals.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                  Margem: {totalMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <CalculatorIcon className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/10" />
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Receita Total</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {totals.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendUpIcon className="w-3 h-3" /> Vendas confirmadas
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Custo Total</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {totals.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-xs text-amber-600 mt-1">
              Ração: {feedCostPercentage.toFixed(0)}% do total
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium mb-1">Produção Total</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {totals.eggs.toLocaleString('pt-BR')} <span className="text-sm font-normal text-slate-500">ovos</span>
            </h3>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <EggIcon className="w-3 h-3" /> Coletados no período
            </p>
          </div>
        </div>
        
        {/* Insights e Alertas */}
        {insights.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Insights e Recomendações
              </h3>
              <button 
                onClick={() => setShowInsights(!showInsights)}
                className="text-amber-700 text-sm hover:underline"
              >
                {showInsights ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showInsights && (
              <ul className="space-y-2">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {/* Ranking de Lotes */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Ranking de Lotes</h3>
            <div className="text-xs text-slate-500">{filteredPerformanceData.length} lotes ativos</div>
          </div>
          
          {filteredPerformanceData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPerformanceData.map((flock, index) => (
                <div 
                  key={flock.id}
                  className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all p-5 ${
                    flock.status === 'profit' ? 'border-l-green-500' : 
                    flock.status === 'loss' ? 'border-l-red-500' : 'border-l-gray-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    
                    {/* Lote Info & Rank */}
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-lg">{flock.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${flock.phase === 'Crescimento' ? 'bg-blue-100 text-blue-700' : flock.phase === 'Pico' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {flock.ageInWeeks} semanas • {flock.phase}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            flock.status === 'profit' ? 'bg-green-100 text-green-700' : 
                            flock.status === 'loss' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {flock.status === 'profit' ? 'Lucrativo' : flock.status === 'loss' ? 'Prejuízo' : 'Estável'}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{flock.totalEggs.toLocaleString()} ovos</span>
                          <TrendBadge value={flock.productionChange} />
                        </div>
                      </div>
                    </div>

                    {/* Financial & Production Metrics Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 md:border-l md:border-r border-slate-100 md:px-6">
                      
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Lucro</p>
                        <div className="flex items-end gap-2">
                          <span className={`text-lg font-bold ${flock.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {flock.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-slate-400">vs anterior:</span>
                          <TrendBadge value={flock.profitChange} />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Margem %</p>
                        <div className="flex items-end gap-2">
                          <span className={`text-lg font-bold ${flock.profitMargin >= 20 ? 'text-green-600' : flock.profitMargin > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {flock.profitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendBadge value={flock.marginChange} isPercent={true} />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Postura %</p>
                        <div className="flex items-end gap-2">
                          <span className={`text-lg font-bold ${
                            flock.layingRatePercentage >= 85 ? 'text-green-600' : 
                            flock.layingRatePercentage >= 70 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {flock.layingRatePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {flock.totalEggs > 0 ? `${(flock.totalEggs / Math.max(1, flock.ageInWeeks)).toFixed(0)} ovos/sem` : 'Sem dados'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Custo/Ovo</p>
                        <p className="text-lg font-bold text-slate-700">
                          {flock.costPerEgg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Ração: {((flock.feedCost / flock.totalCost) * 100 || 0).toFixed(0)}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">ROI</p>
                        <p className={`text-lg font-bold ${flock.roi >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {flock.roi.toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Retorno Invest.</p>
                      </div>

                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end">
                       <button 
                        onClick={() => {/* TODO: Open details modal */}}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-purple-600 transition-colors"
                        title="Ver detalhes completos"
                       >
                         <ReportIcon className="w-5 h-5" />
                       </button>
                    </div>

                  </div>
                  
                  {/* Barra de Progresso Visual do Lucro/Prejuízo */}
                  <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                     {flock.status === 'profit' ? (
                       <>
                         <div style={{ width: `${Math.min(flock.profitMargin * 2, 100)}%` }} className="h-full bg-green-500 rounded-full" />
                       </>
                     ) : (
                       <div className="w-full h-full bg-red-100">
                          <div style={{ width: '100%' }} className="h-full bg-red-400 opacity-50" />
                       </div>
                     )}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">Nenhum lote ativo encontrado para análise.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboardV2;
