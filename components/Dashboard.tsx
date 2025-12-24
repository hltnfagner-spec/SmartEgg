
import { useMemo, useRef, useEffect, FC, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useAlerts } from '../context/AlertContext';
import StatCard from './StatCard';
import SubscriptionCard from './SubscriptionCard';
import AlertsDashboard from './AlertsDashboard';
import { EggIcon, FlockIcon, ExpenseIcon, SalesIcon, ArrowUpIcon, ArrowDownIcon, InventoryIcon, TrendUpIcon, TrendDownIcon, ChickenIcon } from './icons';
import NotificationBell from './NotificationBell';

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
  const { flocks, records, expenses, sales, tasks, toggleTaskCompletion, getHensCountOnDate, getFlockById, inventory } = useFarm();
  const { addAlert } = useAlerts();
  const chartContainer = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

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
      .filter(s => new Date(s.date) >= firstDayOfMonth)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [sales]);

  // Egg Stock Logic for Dashboard
  const eggStock = useMemo(() => {
      const item = inventory.find(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
      return item ? item.quantity : 0;
  }, [inventory]);

  // ALERT LOGIC: Production Trends - agora integrado com o contexto
  useEffect(() => {
    const activeFlocks = flocks.filter(f => f.status === 'Ativo');

    activeFlocks.forEach(flock => {
      // Group records by day to handle multiple entries
      const dayMap = new Map<string, number>();
      records
          .filter(r => r.flockId === flock.id)
          .forEach(r => {
              const day = getLocalYMD(new Date(r.date));
              dayMap.set(day, (dayMap.get(day) || 0) + r.eggsCollected);
          });

      const dailyTotals = Array.from(dayMap.entries())
          .map(([date, total]) => ({ date, total }))
          .sort((a, b) => b.date.localeCompare(a.date));

      if (dailyTotals.length >= 6) {
          const last3Days = dailyTotals.slice(0, 3);
          const prev3Days = dailyTotals.slice(3, 6);

          const avgLast3 = last3Days.reduce((acc, d) => acc + d.total, 0) / 3;
          const avgPrev3 = prev3Days.reduce((acc, d) => acc + d.total, 0) / 3;

          if (avgPrev3 > 0) {
              const variation = ((avgLast3 - avgPrev3) / avgPrev3) * 100;
              
              if (variation < -5) { // Queda maior que 5%
                  addAlert({
                      type: 'production_down',
                      title: `Alerta de Queda de Produção - ${flock.name}`,
                      message: `Variação de ${Math.abs(variation).toFixed(1)}% comparado aos 3 dias anteriores.`,
                      percentage: Math.abs(variation),
                      flockName: flock.name
                  });
              } else if (variation > 5) { // Aumento maior que 5%
                  addAlert({
                      type: 'production_up',
                      title: `Aumento de Produção - ${flock.name}`,
                      message: `Variação de ${variation.toFixed(1)}% comparado aos 3 dias anteriores.`,
                      percentage: variation,
                      flockName: flock.name
                  });
              }
          }
      }
    });
  }, [flocks, records, addAlert]);

  // ALERT LOGIC: Feed Inventory - agora integrado com o contexto
  useEffect(() => {
    const feedItem = inventory.find(i => i.category === 'Ração');
    
    if (feedItem) {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);

        const recentRecords = records.filter(r => new Date(r.date) >= weekAgo);
        const totalConsumed = recentRecords.reduce((acc, r) => acc + r.feedConsumedKg, 0);
        
        const uniqueDays = new Set(recentRecords.map(r => getLocalYMD(new Date(r.date)))).size;
        
        const dailyConsumption = uniqueDays > 0 ? totalConsumed / uniqueDays : 0;

        if (dailyConsumption > 0) {
            const daysRemaining = feedItem.quantity / dailyConsumption;
            if (daysRemaining < 5) {
                addAlert({
                    type: 'inventory_low',
                    title: `Estoque Baixo: ${feedItem.name}`,
                    message: `Restam aproximadamente ${daysRemaining.toFixed(1)} dias com base no consumo atual.`,
                    itemName: feedItem.name,
                    daysRemaining
                });
            }
        }
    }
  }, [inventory, records, addAlert]);


  // Quality metrics for the last 7 days
  const qualityMetrics = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const recentRecords = records.filter(r => new Date(r.date) >= weekAgo);
    
    const totalCollected = recentRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
    const totalBroken = recentRecords.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);
    
    const goodEggs = totalCollected - totalBroken;
    const lossPercentage = totalCollected > 0 ? (totalBroken / totalCollected) * 100 : 0;
    
    return {
        totalCollected,
        goodEggs,
        totalBroken,
        lossPercentage: lossPercentage.toFixed(1)
    };
  }, [records]);

  const flockSummaryData = useMemo(() => {
    return flocks
      .filter(flock => flock.status === 'Ativo')
      .map(flock => {
        const flockExpenses = expenses.filter(e => e.flockId === flock.id);
        
        const flockSales = sales.filter(s => 
            s.flockId === flock.id && 
            s.productType !== 'Aves' && 
            s.productType !== 'Cama'
        );
        
        const flockRecords = records.filter(r => r.flockId === flock.id);

        const totalCost = flockExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalRevenue = flockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalProduction = flockRecords.reduce((sum, record) => sum + record.eggsCollected, 0);
        const profitability = totalRevenue - totalCost;
        const costPerEgg = totalProduction > 0 ? totalCost / totalProduction : 0;

        // Calcular porcentagem de postura (últimos 7 dias)
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const currentHensCount = getHensCountOnDate(flock.id, today);
        
        // Filtrar registros dos últimos 7 dias
        const recentRecords = flockRecords.filter(r => {
          const recordDate = new Date(r.date);
          return recordDate >= sevenDaysAgo && recordDate <= today;
        });
        
        // Calcular total de ovos nos últimos 7 dias
        const totalRecentEggs = recentRecords.reduce((sum, record) => sum + record.eggsCollected, 0);
        const daysWithRecords = recentRecords.length;
        
        // Porcentagem de postura = (Produção real / Produção esperada nos dias com coleta) * 100
        let layingRatePercentage = 0;
        if (daysWithRecords > 0 && currentHensCount > 0) {
          // Produção esperada = número de aves × dias com coleta
          const expectedProduction = currentHensCount * daysWithRecords;
          
          // Porcentagem = (produção real / produção esperada) × 100
          layingRatePercentage = (totalRecentEggs / expectedProduction) * 100;
          
          // Limitar a 100% no máximo
          layingRatePercentage = Math.min(layingRatePercentage, 100);
          
          // Debug: mostrar cálculo no console
          console.log(`[Dashboard] Lote ${flock.name}:`, {
            totalRecentEggs: totalRecentEggs,
            currentHensCount: currentHensCount,
            daysWithRecords: daysWithRecords,
            expectedProduction: expectedProduction,
            rawPercentage: (totalRecentEggs / expectedProduction) * 100,
            finalPercentage: layingRatePercentage
          });
        }

        return {
          id: flock.id,
          name: flock.name,
          totalCost,
          totalRevenue,
          totalProduction,
          profitability,
          costPerEgg,
          layingRatePercentage: layingRatePercentage.toFixed(1),
          currentHensCount,
        };
      });
  }, [flocks, expenses, sales, records, getHensCountOnDate]);
  
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
            {/* Informações discretas de assinatura ativa */}
            {isActive && subscription?.paymentDueDate && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center space-x-1">
                  <span className="text-emerald-600 text-sm">●</span>
                  <span className="text-xs font-medium text-emerald-700">Assinatura ativa</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="text-xs text-slate-600">
                  Vencimento: <span className="font-semibold">{new Date(subscription.paymentDueDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="text-xs text-emerald-600 font-medium">
                  {daysRemaining} dias restantes
                </div>
              </div>
            )}
            <NotificationBell />
        </div>
      </div>

      {/* ALERT SECTION - usando novo sistema de alertas */}
      <AlertsDashboard />
      
      {/* Card de assinatura - apenas durante trial */}
      {isTrial && (
        <div className="mb-6">
          <SubscriptionCard />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* NEW FEATURE: Egg Stock Highlight */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-xl shadow-md flex items-center space-x-4 text-white transform hover:scale-105 transition-transform duration-200 cursor-default">
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

      {/* Latest Transactions Section - MOVED HERE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Últimas Transações</h2>
          <div className="max-h-64 overflow-y-auto">
              <ul className="divide-y divide-slate-100">
            {latestTransactions.length > 0 ? latestTransactions.map(tx => (
               <li key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${tx.type === 'sale' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {tx.type === 'sale' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </div>
                      <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate" title={tx.description}>{tx.description}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })}</p>
                      </div>
                  </div>
                  <p className={`font-semibold text-sm whitespace-nowrap pl-2 ${tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
              </li>
            )) : (
              <li className="text-center py-10 text-slate-500">Nenhuma transação recente.</li>
            )}
              </ul>
          </div>
      </div>

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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-semibold text-slate-800">Performance por Lote (Ovos)</h2>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">Lote</th>
                        <th scope="col" className="px-6 py-3 text-right">Produção</th>
                        <th scope="col" className="px-6 py-3 text-right">% Postura</th>
                        <th scope="col" className="px-6 py-3 text-right">Custo Total</th>
                        <th scope="col" className="px-6 py-3 text-right">Custo/Ovo</th>
                        <th scope="col" className="px-6 py-3 text-right">Receita (Ovos)</th>
                        <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Lucro/Prejuízo</th>
                    </tr>
                </thead>
                <tbody className="space-y-2">
                    {flockSummaryData.length > 0 ? flockSummaryData.map((flock, idx) => (
                        <tr key={flock.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{flock.name}</td>
                            <td className="px-6 py-4 text-right">{flock.totalProduction.toLocaleString('pt-BR')}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    parseFloat(flock.layingRatePercentage) >= 85 
                                        ? 'bg-green-100 text-green-800'
                                        : parseFloat(flock.layingRatePercentage) >= 70
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {flock.layingRatePercentage}%
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-red-600">{flock.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-6 py-4 text-right text-slate-600">{flock.costPerEgg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                            <td className="px-6 py-4 text-right text-green-600">{flock.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className={`px-6 py-4 text-right font-bold ${flock.profitability >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {flock.profitability.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-500">Nenhum lote ativo para exibir.</td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

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
      
    </div>
  );
};

export default Dashboard;
