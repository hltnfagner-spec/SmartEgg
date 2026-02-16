
import { useMemo, useRef, useEffect, FC, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import StatCard from './StatCard';
import SubscriptionCard from './SubscriptionCard';
import { EggIcon, FlockIcon, ExpenseIcon, SalesIcon, ArrowUpIcon, ArrowDownIcon, InventoryIcon, TrendUpIcon, TrendDownIcon, ChickenIcon } from './icons';
import NotificationBell from './NotificationBell';
import { AddRecordForm } from './DataEntry';
import { AddExpenseForm } from './Expenses';
import { AddSaleForm } from './Sales';
import { AddMortalityForm } from './Mortality';
import PerformanceDashboardV2 from './PerformanceDashboardV2';

const getLocalYMD = (date: Date | string) => {
    // Se for string, assume que já está no formato YYYY-MM-DD ou ISO
    if (typeof date === 'string') {
        return date.slice(0, 10);
    }
    // Se for Date, converte para o formato local YYYY-MM-DD
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const Dashboard: FC = () => {
  const { flocks, records, expenses, sales, tasks, toggleTaskCompletion, getHensCountOnDate, getFlockById, inventory, navigate } = useFarm();
  
  const [activeModal, setActiveModal] = useState<'collection' | 'expense' | 'sale' | 'mortality' | null>(null);
  const [performanceFilter, setPerformanceFilter] = useState<'this-month' | 'last-month' | 'all-time'>('this-month');
  const [flockFilter, setFlockFilter] = useState<string>('all');

  const chartContainer = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const handleCloseModal = () => setActiveModal(null);

  const todayProduction = useMemo(() => {
    const todayStr = getLocalYMD(new Date());
    return records
        .filter(r => getLocalYMD(r.date) === todayStr)
        .reduce((sum, r) => sum + r.eggsCollected, 0);
  }, [records]);
  
  const totalHens = useMemo(() => {
    const today = new Date();
    return flocks
        .filter(f => f.status === 'Ativo')
        .reduce((sum, flock) => sum + getHensCountOnDate(flock.id, today), 0);
  }, [flocks, getHensCountOnDate]);
  
  const monthlyExpenses = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const total = expenses
      .filter(e => new Date(e.date) >= firstDayOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [expenses]);

  const monthlyRevenue = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const total = sales
      .filter(s => new Date(s.date) >= firstDayOfMonth && s.paymentStatus === 'Pago')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [sales]);

  const monthlyProfit = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const totalRevenue = sales
      .filter(s => new Date(s.date) >= firstDayOfMonth && s.paymentStatus === 'Pago')
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = expenses
      .filter(e => new Date(e.date) >= firstDayOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      value: totalRevenue - totalExpenses,
      formatted: (totalRevenue - totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    };
  }, [sales, expenses]);

  // Egg Stock Logic for Dashboard
  const eggStock = useMemo(() => {
      const item = inventory.find(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
      return item ? item.quantity : 0;
  }, [inventory]);

  const productionData = useMemo(() => {
    // ... existing logic ...
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return records
        .filter(r => new Date(r.date) >= last30Days)
        .reduce((acc, curr) => {
            const total = acc.totalCollected + curr.eggsCollected;
            const broken = acc.totalBroken + (curr.brokenEggs || 0);
            return {
                totalCollected: total,
                totalBroken: broken,
                goodEggs: total - broken
            };
        }, { totalCollected: 0, totalBroken: 0, goodEggs: 0 });
  }, [records]);

  const qualityMetrics = useMemo(() => {
    const { totalCollected, totalBroken, goodEggs } = productionData;
    const lossPercentage = totalCollected > 0 ? (totalBroken / totalCollected) * 100 : 0;
    
    return {
        totalCollected,
        goodEggs,
        totalBroken,
        lossPercentage: lossPercentage.toFixed(1)
    };
  }, [productionData]);

  const flockSummaryData = useMemo(() => {
    // Definir datas de filtro
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    if (performanceFilter === 'this-month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (performanceFilter === 'last-month') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    } else {
        startDate = new Date(0); // All time
    }

    return flocks
      .filter(flock => flock.status === 'Ativo')
      .map(flock => {
        // Filtros de data
        const isWithinPeriod = (dateStr: string) => {
            const date = new Date(dateStr);
            return date >= startDate && date <= endDate;
        };

        const flockExpenses = expenses.filter(e => e.flockId === flock.id && isWithinPeriod(e.date));
        
        const flockSales = sales.filter(s => 
            s.flockId === flock.id && 
            s.productType !== 'Aves' && 
            s.productType !== 'Cama' &&
            isWithinPeriod(s.date)
        );
        
        const flockRecords = records.filter(r => r.flockId === flock.id && isWithinPeriod(r.date));

        const totalCost = flockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalRevenue = flockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalProduction = flockRecords.reduce((sum, record) => sum + record.eggsCollected, 0);
        const profitability = totalRevenue - totalCost;
        const costPerEgg = totalProduction > 0 ? totalCost / totalProduction : 0;
        
        // Calcular custo por ovo apenas com ração de postura (registrada nas coletas)
        const feedItem = inventory.find(i => i.category === 'Ração');
        const feedPricePerKg = feedItem ? (typeof feedItem.costPerUnit === 'number' ? feedItem.costPerUnit : parseFloat(feedItem.costPerUnit || '0')) : 0;
        const totalFeedConsumedKg = flockRecords.reduce((sum, record) => sum + (record.feedConsumedKg || 0), 0);
        const totalFeedCost = totalFeedConsumedKg * feedPricePerKg;
        const feedCostPerEgg = totalProduction > 0 ? totalFeedCost / totalProduction : 0;

        // Calcular porcentagem de postura (média do período)
        let layingRatePercentage = 0;
        
        if (flockRecords.length > 0) {
            // Agrupar registros por dia para evitar duplicatas e contar dias com coleta
            const uniqueDays = new Set(flockRecords.map(r => getLocalYMD(r.date))).size;
            
            // Calcular média de aves no período
            // Para ser mais preciso, deveria iterar dia a dia, mas vamos pegar a média dos registros
            const totalHensInRecords = flockRecords.reduce((sum, r) => {
                return sum + getHensCountOnDate(flock.id, new Date(r.date));
            }, 0);
            
            // Se temos registros de produção, usamos eles para calcular a média de aves
            // Nota: se houver dias sem registro, eles não entram na média de postura, o que é correto (não baixam a média artificialmente)
            const averageHens = flockRecords.length > 0 ? totalHensInRecords / flockRecords.length : 0;

            if (uniqueDays > 0 && averageHens > 0) {
                // Média diária de ovos
                const avgDailyEggs = totalProduction / uniqueDays;
                
                // Taxa = (Ovos / Dias) / Aves * 100
                layingRatePercentage = (avgDailyEggs / averageHens) * 100;
                layingRatePercentage = Math.min(layingRatePercentage, 100);
            }
        } else if (performanceFilter === 'this-month') {
             // Fallback para comportamento antigo se não tiver registros no mês (mostra status atual)
             const today = new Date();
             const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
             const currentHensCount = getHensCountOnDate(flock.id, today);
             const recentRecords = records.filter(r => {
                 const d = new Date(r.date);
                 return r.flockId === flock.id && d >= sevenDaysAgo && d <= today;
             });
             const totalRecent = recentRecords.reduce((s, r) => s + r.eggsCollected, 0);
             const days = recentRecords.length;
             if (days > 0 && currentHensCount > 0) {
                 layingRatePercentage = Math.min(((totalRecent/days)/currentHensCount)*100, 100);
             }
        }

        // Get current hens count for display (always current status)
        const currentHensCount = getHensCountOnDate(flock.id, new Date());

        return {
          id: flock.id,
          name: flock.name,
          totalCost,
          totalRevenue,
          totalProduction,
          profitability,
          costPerEgg,
          feedCostPerEgg,
          layingRatePercentage: layingRatePercentage.toFixed(1),
          currentHensCount,
        };
      });
  }, [flocks, expenses, sales, records, getHensCountOnDate, performanceFilter]);
  
  const latestTransactions = useMemo(() => {
    const combined = [
      ...sales.map(s => ({
        id: s.id,
        date: s.date,
        description: `Venda (${s.quantity} ${s.productType || 'Ovos'})`,
        amount: s.totalAmount,
        type: 'sale' as const,
      })),
      ...expenses.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description ? `${e.category} - ${e.description}` : e.category,
        amount: -e.amount,
        type: 'expense' as const,
      })),
    ];
    
    return combined.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        
        const timestampA = parseInt(a.id.split('-')[1] || '0');
        const timestampB = parseInt(b.id.split('-')[1] || '0');
        return timestampB - timestampA;
    });
  }, [sales, expenses]);

  const upcomingTasks = useMemo(() => {
    const now = new Date();

    return tasks
        .filter(t => !t.isCompleted) // Show only pending
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5) // Top 5
        .map(task => {
            const taskDate = new Date(task.dueDate);
            
            // Fix: Usar Date.UTC para cálculo de dias exatos do calendário
            const targetUTC = Date.UTC(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate());
            const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

            const diffTime = targetUTC - todayUTC;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let statusLabel = '';
            let statusColor = '';

            if (diffDays < 0) {
                statusLabel = 'Atrasada';
                statusColor = 'text-red-600 bg-red-100';
            } else if (diffDays === 0) {
                statusLabel = 'Hoje';
                statusColor = 'text-amber-600 bg-amber-100';
            } else if (diffDays === 1) {
                statusLabel = 'Amanhã';
                statusColor = 'text-blue-600 bg-blue-100';
            } else {
                statusLabel = `${new Date(task.dueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', timeZone: 'UTC'})}`;
                statusColor = 'text-slate-600 bg-slate-100';
            }

            return { ...task, statusLabel, statusColor };
        });
  }, [tasks]);

  const productionChartData = useMemo(() => {
      const labels: string[] = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      }

      const activeFlocks = flocks.filter(f => f.status === 'Ativo');
      const datasets = activeFlocks.map((flock, index) => {
          const data: number[] = [];
          for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(today.getDate() - i);
              const dateString = getLocalYMD(date);
              
              const dayRecords = records.filter(r => 
                  r.flockId === flock.id && 
                  getLocalYMD(new Date(r.date)) === dateString
              );
              
              const dayTotal = dayRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
              data.push(dayTotal);
          }
          const colors = ['#f97316', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
          return {
              label: flock.name,
              data: data,
              borderColor: colors[index % colors.length],
              backgroundColor: `${colors[index % colors.length]}33`, 
              fill: false,
              tension: 0.3,
              pointBackgroundColor: colors[index % colors.length],
              pointRadius: 4,
          };
      });

      return { labels, datasets };
  }, [flocks, records]);

  useEffect(() => {
      if (chartInstance.current) {
          chartInstance.current.destroy();
      }

      if (chartContainer.current && productionChartData.datasets.length > 0 && (window as any).Chart) {
          const ctx = chartContainer.current.getContext('2d');
          if (ctx) {
              chartInstance.current = new (window as any).Chart(ctx, {
                  type: 'line',
                  data: productionChartData,
                  options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                          legend: {
                              position: 'bottom',
                              labels: { boxWidth: 10, padding: 15, font: { family: 'Inter', size: 11 } },
                          },
                          tooltip: {
                              backgroundColor: '#fff',
                              titleColor: '#1e293b',
                              bodyColor: '#475569',
                              borderColor: '#e2e8f0',
                              borderWidth: 1,
                              padding: 10,
                              displayColors: true,
                              titleFont: { family: 'Inter', size: 13, weight: 'bold' },
                              bodyFont: { family: 'Inter', size: 12 },
                          },
                      },
                      scales: {
                          y: {
                              beginAtZero: true,
                              grid: { color: '#f1f5f9' },
                              ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                              border: { display: false }
                          },
                          x: {
                              grid: { display: false },
                              ticks: { color: '#94a3b8', font: { family: 'Inter' } },
                              border: { display: false }
                          },
                      },
                  },
              });
          }
      }
      return () => {
          if (chartInstance.current) {
              chartInstance.current.destroy();
          }
      };
  }, [productionChartData]);

  const { subscription } = useFarm();
  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';
  
  // Calcula dias restantes para assinatura ativa
  const daysRemaining = isActive && subscription?.paymentDueDate
    ? Math.max(0, Math.ceil((new Date(subscription.paymentDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center space-x-4">
            {/* Informações discretas de assinatura ativa - responsivo */}
            {isActive && subscription?.paymentDueDate && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-1">
                  <span className="text-emerald-600 text-xs">●</span>
                  <span className="text-xs font-medium text-emerald-700 hidden md:inline">Assinatura ativa</span>
                </div>
                <span className="text-slate-300 hidden lg:inline">|</span>
                <div className="text-xs text-slate-600 hidden lg:block">
                  Venc: <span className="font-semibold">{new Date(subscription.paymentDueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                </div>
                <span className="text-slate-300 hidden sm:inline lg:hidden">|</span>
                <div className="text-xs text-emerald-600 font-medium">
                  {daysRemaining}d
                </div>
              </div>
            )}
            {/* Versão mobile */}
            {isActive && subscription?.paymentDueDate && (
              <div className="sm:hidden flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-1">
                  <span className="text-emerald-600 text-xs">●</span>
                  <span className="text-xs font-medium text-emerald-700">Ativa</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="text-xs text-slate-600">
                  Venc: <span className="font-semibold">{new Date(subscription.paymentDueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="text-xs text-emerald-600 font-medium">
                  {daysRemaining}d
                </div>
              </div>
            )}
            <NotificationBell />
        </div>
      </div>

      {/* Tabbed Submenu */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex space-x-1">
          <button
            onClick={() => navigate('transactions')}
            className="px-6 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-orange-600"
          >
            Últimas Transações
          </button>
          <button
            onClick={() => navigate('produtividade')}
            className="px-6 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-orange-600"
          >
            Produtividade
          </button>
          <button
            onClick={() => navigate('feed-consumption')}
            className="px-6 py-3 text-sm font-medium transition-colors text-slate-600 hover:text-orange-600"
          >
            Consumo de Ração
          </button>
        </div>
      </div>

      {/* Card de assinatura - apenas durante trial */}
      {isTrial && (
        <div className="mb-6">
          <SubscriptionCard />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* NEW FEATURE: Egg Stock Highlight */}
        <div 
            onClick={() => navigate('inventory')}
            className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-xl shadow-md flex items-center space-x-4 text-white transform hover:scale-105 transition-transform duration-200 cursor-pointer hover:shadow-lg"
        >
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <InventoryIcon className="h-8 w-8 text-white" />
            </div>
            <div>
                <p className="text-amber-100 font-medium text-sm">Estoque de Ovos</p>
                <p className="text-3xl font-bold">{eggStock.toLocaleString()}</p>
                <p className="text-xs text-amber-100/80 mt-1">Disponível para venda</p>
            </div>
        </div>

        <StatCard 
            title="Ovos Hoje" 
            value={todayProduction} 
            icon={<EggIcon className="h-6 w-6" />}
            description="Total acumulado hoje"
            iconColorClass="bg-amber-100 text-amber-600"
        />
        <StatCard 
            title="População Total" 
            value={totalHens} 
            icon={<FlockIcon className="h-6 w-6" />}
            description="Aves ativas"
            iconColorClass="bg-blue-100 text-blue-600"
        />
         <StatCard 
            title="Receita Mensal" 
            value={monthlyRevenue}
            icon={<SalesIcon className="h-6 w-6" />}
            description="Vendas acumuladas"
            iconColorClass="bg-green-100 text-green-600"
        />
        <StatCard 
            title="Despesas Mensal" 
            value={monthlyExpenses}
            icon={<ExpenseIcon className="h-6 w-6" />}
            description="Custos operacionais"
            iconColorClass="bg-red-100 text-red-600"
        />
      </div>

      {/* Monthly Profit Card */}
      <div className="mt-6">
        <div className={`rounded-xl shadow-sm p-6 border ${
          monthlyProfit.value >= 0 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-lg ${
                  monthlyProfit.value >= 0 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {monthlyProfit.value >= 0 ? (
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-medium uppercase tracking-wide ${
                    monthlyProfit.value >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {monthlyProfit.value >= 0 ? 'Lucro Mensal' : 'Prejuízo Mensal'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Receitas - Despesas</p>
                </div>
              </div>
              <p className={`text-3xl font-bold ${
                monthlyProfit.value >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyProfit.value >= 0 ? '+' : ''}{monthlyProfit.formatted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-slate-800 text-base font-bold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Nova Venda - Green */}
            <button
                onClick={() => setActiveModal('sale')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md group"
            >
                <div className="bg-white/20 p-1.5 rounded-md group-hover:scale-110 transition-transform">
                    <SalesIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Nova Venda</span>
            </button>

            {/* Registrar Produção - Green */}
            <button
                onClick={() => setActiveModal('collection')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md group"
            >
                <div className="bg-white/20 p-1.5 rounded-md group-hover:scale-110 transition-transform">
                    <EggIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Registrar Produção</span>
            </button>

            {/* Nova Despesa - Orange */}
            <button
                onClick={() => setActiveModal('expense')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md group"
            >
                <div className="bg-white/20 p-1.5 rounded-md group-hover:scale-110 transition-transform">
                    <ExpenseIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Nova Despesa</span>
            </button>

            {/* Registrar Consumo de Ração - Orange */}
            <button
                onClick={() => navigate('feed-consumption')}
                className="flex flex-col sm:flex-row items-center justify-center gap-2 text-white py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md group"
                style={{ backgroundColor: '#FFA500' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E59400'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFA500'}
            >
                <div className="bg-white/20 p-1.5 rounded-md group-hover:scale-110 transition-transform">
                    <ChickenIcon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">Registrar Consumo de Ração</span>
            </button>

        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
             <h2 className="text-lg font-semibold text-slate-800 mb-4">Produção (7 Dias)</h2>
             <div className="relative flex-1 min-h-[250px]">
                {productionChartData.datasets.length > 0 ? (
                  <canvas ref={chartContainer}></canvas>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg">
                      <p>Sem dados.</p>
                  </div>
                )}
             </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Qualidade (7 Dias)</h2>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Ovos Bons</span>
                          <span className="font-semibold text-green-600">{qualityMetrics.goodEggs.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${100 - parseFloat(qualityMetrics.lossPercentage)}%` }}></div>
                      </div>
                      
                      <div className="pt-2">
                          <div className="bg-red-50 p-3 rounded-lg flex justify-between items-center">
                              <p className="text-xs text-red-600 font-medium uppercase">Quebrados/Trincados</p>
                              <p className="text-xl font-bold text-red-700">{qualityMetrics.totalBroken}</p>
                          </div>
                      </div>
                      <p className="text-xs text-slate-400 text-right">Taxa de Perda: {qualityMetrics.lossPercentage}%</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Performance por Lote - Novo Componente */}
      <PerformanceDashboardV2 
        initialPeriod={performanceFilter} 
        initialFlockId={flockFilter} 
      />

      {/* Upcoming Tasks Section - Full Width at Bottom */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Tarefas Agendadas</h2>
            <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                <ul className="space-y-3">
                    {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                        <li key={task.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start space-x-3">
                                <div className="mt-0.5">
                                    <input 
                                        type="checkbox" 
                                        checked={task.isCompleted} 
                                        onChange={() => toggleTaskCompletion(task.id)} 
                                        className="h-5 w-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer" 
                                    />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{task.taskType}</p>
                                    <div className="flex items-center text-xs text-slate-500 mt-1">
                                        <ChickenIcon className="h-3 w-3 mr-1" />
                                        {getFlockById(task.flockId)?.name || 'Lote Removido'}
                                    </div>
                                    {task.notes && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">{task.notes}</p>}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${task.statusColor}`}>
                                {task.statusLabel}
                            </span>
                        </li>
                    )) : (
                        <li className="flex flex-col items-center justify-center h-40 text-slate-400">
                             <div className="p-3 bg-slate-50 rounded-full mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                             </div>
                            <p className="text-sm">Nenhuma tarefa pendente.</p>
                        </li>
                    )}
                </ul>
            </div>
      </div>
      
      {/* Modais de Ação Rápida */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-stone-800">
                        {activeModal === 'collection' && 'Nova Coleta de Ovos'}
                        {activeModal === 'sale' && 'Nova Venda'}
                        {activeModal === 'expense' && 'Nova Despesa'}
                        {activeModal === 'mortality' && 'Registro de Mortalidade'}
                    </h2>
                    <button onClick={handleCloseModal} className="text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
                        ✕
                    </button>
                </div>
                
                {activeModal === 'collection' && <AddRecordForm onClose={handleCloseModal} />}
                {activeModal === 'sale' && <AddSaleForm onClose={handleCloseModal} />}
                {activeModal === 'expense' && <AddExpenseForm onClose={handleCloseModal} />}
                {activeModal === 'mortality' && <AddMortalityForm onClose={handleCloseModal} />}
            </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
