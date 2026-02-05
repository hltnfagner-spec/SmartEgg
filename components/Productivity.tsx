import { FC, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';

const toLocalDateString = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const Productivity: FC = () => {
  const { flocks, records, getHensCountOnDate, navigate } = useFarm();
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    start: toLocalDateString(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
    end: toLocalDateString(new Date())
  });
  const [periodType, setPeriodType] = useState<'diario' | 'semanal' | 'mensal' | 'personalizado'>('mensal');
  const [selectedFlock, setSelectedFlock] = useState('');
  
  // Function to update dates based on period
  const updateDatesByPeriod = (period: 'diario' | 'semanal' | 'mensal' | 'personalizado') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'diario':
        start = today;
        end = today;
        setDateFilter({
          start: toLocalDateString(start),
          end: toLocalDateString(end)
        });
        break;
      case 'semanal':
        start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        end = today;
        setDateFilter({
          start: toLocalDateString(start),
          end: toLocalDateString(end)
        });
        break;
      case 'mensal':
        start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        end = today;
        setDateFilter({
          start: toLocalDateString(start),
          end: toLocalDateString(end)
        });
        break;
      case 'personalizado':
        // Keep current dates
        break;
    }

    setPeriodType(period);
  };

  // Calculate summary metrics for the period
  const periodSummary = useMemo(() => {
    const start = new Date(dateFilter.start);
    const end = new Date(dateFilter.end);
    
    const periodRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      const dateInRange = recordDate >= start && recordDate <= end;
      const flockMatch = !selectedFlock || r.flockId === selectedFlock;
      return dateInRange && flockMatch;
    });

    const totalEggs = periodRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
    const totalBroken = periodRecords.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);

    const brokenPercentage = totalEggs > 0 ? ((totalBroken / totalEggs) * 100).toFixed(2) : '0.00';
    const goodEggsPercentage = totalEggs > 0 ? (((totalEggs - totalBroken) / totalEggs) * 100).toFixed(2) : '0.00';

    return {
      totalEggs,
      goodEggsPercentage,
      totalBroken,
      brokenPercentage,
    };
  }, [records, dateFilter, selectedFlock]);

  // Calculate metrics per flock
  const flockMetrics = useMemo(() => {
    const start = new Date(dateFilter.start);
    const end = new Date(dateFilter.end);
    
    // Calculate actual days in the period once
    const actualDaysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return flocks
      .filter(f => f.status === 'Ativo')
      .filter(f => !selectedFlock || f.id === selectedFlock)
      .map(flock => {
        const flockRecords = records.filter(r => {
          const recordDate = new Date(r.date);
          return r.flockId === flock.id && recordDate >= start && recordDate <= end;
        });

        const currentHens = getHensCountOnDate(flock.id, end);
        const totalDeaths = flockRecords.reduce((sum, r) => sum + (r.mortality || 0), 0);
        const totalEggs = flockRecords.reduce((sum, r) => sum + r.eggsCollected, 0);
        const totalBroken = flockRecords.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);

        const daysWithRecords = flockRecords.length;
        
        const avgPerBird = currentHens > 0 ? totalEggs / currentHens : 0;
        const avgPerDay = actualDaysInPeriod > 0 ? totalEggs / actualDaysInPeriod : 0;
        
        // Productivity = (actual eggs / expected eggs) * 100
        // Expected eggs = number of hens * actual days in period
        const expectedEggs = currentHens * actualDaysInPeriod;
        const productivity = expectedEggs > 0 ? ((totalEggs / expectedEggs) * 100).toFixed(2) : '0.00';

        const brokenPercentage = totalEggs > 0 ? ((totalBroken / totalEggs) * 100).toFixed(2) : '0.00';

        return {
          id: flock.id,
          name: flock.name,
          currentHens,
          totalDeaths,
          totalEggs,
          totalBroken,
          brokenPercentage,
          avgPerBird: avgPerBird.toFixed(2),
          avgPerDay: avgPerDay.toFixed(2),
          productivity,
        };
      });
  }, [flocks, records, dateFilter, selectedFlock, getHensCountOnDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Produtividade por Lote</h1>
        <button 
          onClick={() => navigate('dashboard')}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition-colors flex items-center"
        >
          Voltar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📅</span>
          <h3 className="text-lg font-semibold text-slate-800">Filtros e Período</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Período</label>
            <select
              value={periodType}
              onChange={(e) => updateDatesByPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          {periodType === 'personalizado' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Data Final</label>
                <input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Período Selecionado</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                {dateFilter.start === dateFilter.end
                  ? `Hoje: ${new Date(dateFilter.start + 'T00:00:00').toLocaleDateString('pt-BR')}`
                  : `${new Date(dateFilter.start + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dateFilter.end + 'T00:00:00').toLocaleDateString('pt-BR')}`
                }
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Lote</label>
            <select
              value={selectedFlock}
              onChange={(e) => setSelectedFlock(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Todos os lotes</option>
              {flocks.filter(f => f.status === 'Ativo').map(flock => (
                <option key={flock.id} value={flock.id}>{flock.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-green-700 mb-2">Total de Ovos Inteiros</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-green-800">{periodSummary.totalEggs.toLocaleString()}</p>
            <span className="text-lg text-green-600 font-semibold">{periodSummary.goodEggsPercentage}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-red-700 mb-2">Total de Ovos Quebrados</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-red-800">{periodSummary.totalBroken.toLocaleString()}</p>
            <span className="text-lg text-red-600 font-semibold">{periodSummary.brokenPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Flock Performance Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Desempenho por Lote</h2>
        
        {flockMetrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {flockMetrics.map(flock => (
              <div key={flock.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4 pb-4 border-b-2 border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">{flock.name}</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {dateFilter.start.split('-').reverse().join('/')} → {dateFilter.end.split('-').reverse().join('/')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Quantidade Atual de Aves:</span>
                    <span className="font-bold text-slate-800">{flock.currentHens}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Qtd Óbitos (Período):</span>
                    <span className="font-bold text-slate-800">{flock.totalDeaths}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Ovos Inteiros:</span>
                    <span className="font-bold text-slate-800">{flock.totalEggs}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Ovos Quebrados:</span>
                    <span className="font-bold text-red-600">{flock.totalBroken} ({flock.brokenPercentage}%)</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Ovos por Ave:</span>
                    <span className="font-bold text-orange-600">{flock.avgPerBird}</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-slate-600 font-medium">Produção Diária:</span>
                    <span className="font-bold text-orange-600">{flock.avgPerDay}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-slate-50 -mx-6 px-6 rounded-b-xl mt-3">
                    <span className="text-sm text-slate-700 font-semibold">Produtividade (Período):</span>
                    <span className={`font-bold text-xl ${
                      parseFloat(flock.productivity) >= 85 ? 'text-green-600' :
                      parseFloat(flock.productivity) >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {flock.productivity}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500">Nenhum lote ativo encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Productivity;
