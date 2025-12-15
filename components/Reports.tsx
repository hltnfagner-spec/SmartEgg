import { useState, FC, useMemo, useCallback, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { generateProductionReport, generateFinancialReport } from '../services/reportGenerator.ts';
import { ReportIcon } from './icons';
import { DailyRecord, Expense, Sale } from '../types';

type ReportType = 'production' | 'financial' | 'eggs' | 'sales' | 'expenses' | 'posture' | 'clients';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

type ProductionReportData = {
	type: 'production';
	records: DailyRecord[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type FinancialReportData = {
	type: 'financial';
	expenses: Expense[];
	sales: Sale[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type EggsReportData = {
	type: 'eggs';
	records: DailyRecord[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type SalesReportData = {
	type: 'sales';
	sales: Sale[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type ExpensesReportData = {
	type: 'expenses';
	expenses: Expense[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type PostureReportData = {
	type: 'posture';
	records: DailyRecord[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type ClientsReportData = {
	type: 'clients';
	sales: Sale[];
	flockName: string;
	startDate: string;
	endDate: string;
};

type ReportData = ProductionReportData | FinancialReportData | EggsReportData | SalesReportData | ExpensesReportData | PostureReportData | ClientsReportData | null;

const Reports: FC = () => {
	const { flocks, records, expenses, sales } = useFarm();
	const [reportType, setReportType] = useState<ReportType | null>(null);
	const [periodType, setPeriodType] = useState<PeriodType>('monthly');
	
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    
    // Calculate date range based on period type
    const getDateRange = useCallback(() => {
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const localToday = new Date(today.getTime() - offset);
        
        let startDate: Date;
        let endDate: Date = localToday;
        
        switch (periodType) {
            case 'daily':
                startDate = new Date(localToday);
                break;
            case 'weekly':
                startDate = new Date(localToday);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate = new Date(localToday);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'custom':
                // For custom, use the manually set dates
                return {
                    start: startDate,
                    end: endDate
                };
            default:
                startDate = new Date(localToday);
                break;
        }
        
        return { start: startDate, end: endDate };
    }, [periodType]);
    
    // Initialize date range based on period type
    const [customStartDate, setCustomStartDate] = useState(getLocalDateString());
    const [customEndDate, setCustomEndDate] = useState(getLocalDateString());
    
    // Get actual start and end dates for filtering
    const { start: actualStartDate, end: actualEndDate } = useMemo(() => {
        if (periodType === 'custom') {
            return {
                start: new Date(customStartDate),
                end: new Date(customEndDate)
            };
        }
        return getDateRange();
    }, [periodType, customStartDate, customEndDate, getDateRange]);
    
    // Format dates for display
    const startDate = actualStartDate.toISOString().split('T')[0];
    const endDate = actualEndDate.toISOString().split('T')[0];
    
    	const [selectedFlockId, setSelectedFlockId] = useState('all');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [reportData, setReportData] = useState<ReportData>(null);

	const selectedFlockName = useMemo(
		() => (selectedFlockId === 'all'
			? 'Todos os Lotes'
			: flocks.find(f => f.id === selectedFlockId)?.name || 'Desconhecido'),
		[selectedFlockId, flocks]
	);

	const handleGenerateReport = (type: ReportType) => {
		setIsLoading(true);
		setMessage('');
		setReportData(null);

		try {
			if (type === 'production' || type === 'eggs' || type === 'posture') {
				// Filtra registros por data e lote
				const filteredRecords = records
					.filter(r => {
						// Comparar diretamente as strings de data YYYY-MM-DD
						const recordDate = r.date;
						const isAfterStart = recordDate >= startDate;
						const isBeforeEnd = recordDate <= endDate;
						const isCorrectFlock = selectedFlockId === 'all' || r.flockId === selectedFlockId;
						return isAfterStart && isBeforeEnd && isCorrectFlock;
					})
					.sort((a, b) => a.date.localeCompare(b.date));

				if (filteredRecords.length === 0) {
					setMessage('Nenhum dado de produção encontrado para o período selecionado.');
					setIsLoading(false);
					return;
				}

				setReportData({
					type: type === 'production' ? 'production' : type === 'eggs' ? 'eggs' : 'posture',
					records: filteredRecords,
					flockName: selectedFlockName,
					startDate,
					endDate,
				});
			} else if (type === 'financial' || type === 'sales' || type === 'expenses' || type === 'clients') {
				// Financial Report
				const filteredExpenses = expenses
					.filter(e => {
						const expenseDate = e.date;
						const isAfterStart = expenseDate >= startDate;
						const isBeforeEnd = expenseDate <= endDate;
						const isCorrectFlock = selectedFlockId === 'all' || e.flockId === selectedFlockId;
						return isAfterStart && isBeforeEnd && isCorrectFlock;
					})
					.sort((a, b) => a.date.localeCompare(b.date));

				const filteredSales = sales
					.filter(s => {
						const saleDate = s.date;
						const isAfterStart = saleDate >= startDate;
						const isBeforeEnd = saleDate <= endDate;
						const isCorrectFlock = selectedFlockId === 'all' || s.flockId === selectedFlockId;
						return isAfterStart && isBeforeEnd && isCorrectFlock;
					})
					.sort((a, b) => a.date.localeCompare(b.date));

				if (filteredExpenses.length === 0 && filteredSales.length === 0) {
					setMessage('Nenhum dado financeiro encontrado para o período selecionado.');
					setIsLoading(false);
					return;
				}

				if (type === 'financial') {
					setReportData({
						type: 'financial',
						expenses: filteredExpenses,
						sales: filteredSales,
						flockName: selectedFlockName,
						startDate,
						endDate,
					});
					setMessage('Relatório Financeiro gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
				} else if (type === 'sales') {
					setReportData({
						type: 'sales',
						sales: filteredSales,
						flockName: selectedFlockName,
						startDate,
						endDate,
					});
					setMessage('Relatório de Vendas gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
				} else if (type === 'expenses') {
					setReportData({
						type: 'expenses',
						expenses: filteredExpenses,
						flockName: selectedFlockName,
						startDate,
						endDate,
					});
					setMessage('Relatório de Custos gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
				} else if (type === 'clients') {
					setReportData({
						type: 'clients',
						sales: filteredSales,
						flockName: selectedFlockName,
						startDate,
						endDate,
					});
					setMessage('Relatório de Clientes gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
				}
			}
		} catch (error: any) {
			console.error(' Erro ao gerar relatório:', error);
			setMessage('Ocorreu um erro técnico ao gerar o relatório.');
		} finally {
			setIsLoading(false);
		}
	};

	// Atualizar relatório automaticamente quando o filtro de lote mudar (se já houver um relatório gerado)
	useEffect(() => {
		if (reportData && reportType) {
			// Regenerar o relatório com o novo filtro de lote
			handleGenerateReport(reportType);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFlockId]);

	const handleDownloadPdf = () => {
		if (!reportData) return;

		if (reportData.type === 'production' || reportData.type === 'eggs' || reportData.type === 'posture') {
			generateProductionReport(
				reportData.records,
				flocks,
				expenses,
				reportData.flockName,
				reportData.startDate,
				reportData.endDate,
			);
		} else {
			generateFinancialReport(
				(reportData.type === 'financial' ? reportData.expenses : []),
				(reportData.type === 'financial' ? reportData.sales : reportData.type === 'sales' || reportData.type === 'clients' ? reportData.sales : []),
				flocks,
				reportData.flockName,
				reportData.startDate,
				reportData.endDate,
			);
		}
	};

	
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-stone-800">Gerador de Relatórios</h1>

            {!reportType ? (
                <div className="bg-white p-8 rounded-xl shadow-md space-y-8">
                    <div>
                        <label className="block text-lg font-semibold text-stone-700 mb-6">Escolha o Tipo de Relatório</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button 
                                onClick={() => setReportType('eggs')}
                                className="px-6 py-8 rounded-xl font-medium transition-all duration-200 border-2 flex flex-col items-center justify-center space-y-3 border-stone-100 bg-stone-50 text-stone-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            >
                                <span className="bg-amber-100 p-4 rounded-xl text-3xl">🥚</span>
                                <div className="text-center">
                                    <p className="font-semibold">Ovos Produzidos</p>
                                    <p className="text-xs opacity-75">Produção total e métricas</p>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => setReportType('sales')}
                                className="px-6 py-8 rounded-xl font-medium transition-all duration-200 border-2 flex flex-col items-center justify-center space-y-3 border-stone-100 bg-stone-50 text-stone-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                            >
                                <span className="bg-green-100 p-4 rounded-xl text-3xl">💰</span>
                                <div className="text-center">
                                    <p className="font-semibold">Vendas</p>
                                    <p className="text-xs opacity-75">Vendas e receitas</p>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => setReportType('expenses')}
                                className="px-6 py-8 rounded-xl font-medium transition-all duration-200 border-2 flex flex-col items-center justify-center space-y-3 border-stone-100 bg-stone-50 text-stone-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                                <span className="bg-red-100 p-4 rounded-xl text-3xl">📊</span>
                                <div className="text-center">
                                    <p className="font-semibold">Custos</p>
                                    <p className="text-xs opacity-75">Despesas e custos</p>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => setReportType('posture')}
                                className="px-6 py-8 rounded-xl font-medium transition-all duration-200 border-2 flex flex-col items-center justify-center space-y-3 border-stone-100 bg-stone-50 text-stone-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                                <span className="bg-blue-100 p-4 rounded-xl text-3xl">🐔</span>
                                <div className="text-center">
                                    <p className="font-semibold">Postura</p>
                                    <p className="text-xs opacity-75">Índices zootécnicos</p>
                                </div>
                            </button>
                            
                            <button 
                                onClick={() => setReportType('clients')}
                                className="px-6 py-8 rounded-xl font-medium transition-all duration-200 border-2 flex flex-col items-center justify-center space-y-3 border-stone-100 bg-stone-50 text-stone-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                            >
                                <span className="bg-purple-100 p-4 rounded-xl text-3xl">👥</span>
                                <div className="text-center">
                                    <p className="font-semibold">Clientes</p>
                                    <p className="text-xs opacity-75">Relatório de clientes</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-md space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-lg font-semibold text-stone-700 mb-3">Tipo de Relatório Selecionado</label>
                            <div className="flex items-center space-x-3">
                                {reportType === 'eggs' && <><span className="bg-amber-100 p-2 rounded-lg">🥚</span><span className="font-medium text-amber-700">Ovos Produzidos</span></>}
                                {reportType === 'sales' && <><span className="bg-green-100 p-2 rounded-lg">💰</span><span className="font-medium text-green-700">Vendas</span></>}
                                {reportType === 'expenses' && <><span className="bg-red-100 p-2 rounded-lg">📊</span><span className="font-medium text-red-700">Custos</span></>}
                                {reportType === 'posture' && <><span className="bg-blue-100 p-2 rounded-lg">🐔</span><span className="font-medium text-blue-700">Postura</span></>}
                                {reportType === 'clients' && <><span className="bg-purple-100 p-2 rounded-lg">👥</span><span className="font-medium text-purple-700">Clientes</span></>}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setReportType(null);
                                setReportData(null);
                                setMessage('');
                            }}
                            className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50"
                        >
                            ← Voltar
                        </button>
                    </div>

                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                         <label className="block text-lg font-semibold text-stone-700 mb-4">Configure os Filtros</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="periodType" className="block text-sm font-medium text-stone-600 mb-1">Período</label>
                                <select id="periodType" value={periodType} onChange={e => setPeriodType(e.target.value as PeriodType)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                                    <option value="daily">Diário</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="flockId" className="block text-sm font-medium text-stone-600 mb-1">Filtrar por Lote</label>
                                <select id="flockId" value={selectedFlockId} onChange={e => setSelectedFlockId(e.target.value)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                                    <option value="all">Todos os Lotes</option>
                                    {flocks.map(flock => (
                                        <option key={flock.id} value={flock.id}>{flock.name} {flock.status === 'Descartado' ? '(Descartado)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {periodType === 'custom' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label htmlFor="customStartDate" className="block text-sm font-medium text-stone-600 mb-1">Data Inicial</label>
                                    <input type="date" id="customStartDate" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                                </div>
                                <div>
                                    <label htmlFor="customEndDate" className="block text-sm font-medium text-stone-600 mb-1">Data Final</label>
                                    <input type="date" id="customEndDate" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>Período selecionado:</strong> {periodType === 'daily' ? 'Hoje' : periodType === 'weekly' ? 'Últimos 7 dias' : periodType === 'monthly' ? 'Últimos 30 dias' : `${startDate} a ${endDate}`}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="pt-2 space-y-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <button 
                                    onClick={() => handleGenerateReport(reportType)} 
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow text-base font-bold text-white transition-all transform hover:-translate-y-0.5 ${
                                        reportType === 'eggs' || reportType === 'posture' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-amber-500' :
                                        reportType === 'sales' ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500' :
                                        reportType === 'expenses' ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:ring-red-500' :
                                        'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                                >
                                    <ReportIcon className="w-5 h-5 mr-2" />
                                    <span className="ml-2">{isLoading ? 'Gerando...' : 'Gerar Relatório na Tela'}</span>
                                </button>

                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={!reportData}
                                    className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Baixar PDF
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-2 p-4 rounded-lg text-center text-sm font-medium ${message.includes('Nenhum dado') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Área de visualização do relatório na tela */}
            {reportData && (reportData.type === 'eggs' || reportData.type === 'production') && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Ovos Produzidos</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {/* Resumo */}
                    {(() => {
                        const totalEggs = reportData.records.reduce((sum, r) => sum + r.eggsCollected, 0);
                        const totalBroken = reportData.records.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);
                        const totalGood = totalEggs - totalBroken;
                        const totalMortality = reportData.records.reduce((sum, r) => sum + (r.mortality || 0), 0);
                        const totalFeed = reportData.records.reduce((sum, r) => sum + r.feedConsumedKg, 0);
                        const uniqueDays = new Set(reportData.records.map(r => r.date.split('T')[0])).size;
                        const avgEggsPerDay = uniqueDays > 0 ? totalEggs / uniqueDays : 0;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-700 uppercase">Produção</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">{totalEggs.toLocaleString('pt-BR')} ovos</p>
                                    <p className="text-xs text-stone-500">Média diária: {Math.round(avgEggsPerDay).toLocaleString('pt-BR')} ovos/dia</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-red-700 uppercase">Perdas / Mortalidade</p>
                                    <p className="mt-1 text-sm text-stone-700">Quebrados: <strong>{totalBroken}</strong></p>
                                    <p className="text-sm text-stone-700">Mortalidade: <strong>{totalMortality}</strong></p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Consumo</p>
                                    <p className="mt-1 text-sm text-stone-700">Ração: <strong>{totalFeed.toFixed(2)} kg</strong></p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tabela detalhada */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-stone-600 border-collapse">
                            <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b">
                                <tr>
                                    <th className="px-3 py-2">Data</th>
                                    <th className="px-3 py-2">Lote</th>
                                    <th className="px-3 py-2 text-right">Ovos</th>
                                    <th className="px-3 py-2 text-right">Quebrados</th>
                                    <th className="px-3 py-2 text-right">Ração (kg)</th>
                                    <th className="px-3 py-2 text-right">Mortalidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.records.map(r => {
                                    const flock = flocks.find(f => f.id === r.flockId);
                                    return (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-stone-50">
                                            <td className="px-3 py-2">
                                                {new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                            </td>
                                            <td className="px-3 py-2">{flock?.name || 'N/A'}</td>
                                            <td className="px-3 py-2 text-right">{r.eggsCollected}</td>
                                            <td className="px-3 py-2 text-right text-red-600">{r.brokenEggs || 0}</td>
                                            <td className="px-3 py-2 text-right">{r.feedConsumedKg.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right">{r.mortality || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reportData && reportData.type === 'sales' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Vendas</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {(() => {
                        const totalRevenue = reportData.sales.reduce((sum, s) => sum + s.totalAmount, 0);
                        const totalQuantity = reportData.sales.reduce((sum, s) => sum + s.quantity, 0);
                        const avgPricePerUnit = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 uppercase">Receita Total</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Quantidade Vendida</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalQuantity.toLocaleString('pt-BR')} unidades
                                    </p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-700 uppercase">Preço Médio</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {avgPricePerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div>
                        <h3 className="text-sm font-semibold text-stone-700 mb-2">Vendas Detalhadas</h3>
                        {reportData.sales.length === 0 ? (
                            <p className="text-xs text-stone-500">Nenhuma venda no período.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-stone-600 border-collapse">
                                    <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b">
                                        <tr>
                                            <th className="px-3 py-2">Data</th>
                                            <th className="px-3 py-2">Produto</th>
                                            <th className="px-3 py-2 text-right">Qtd</th>
                                            <th className="px-3 py-2 text-right">Preço Unit.</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.sales.map(s => (
                                            <tr key={s.id} className="border-b last:border-0 hover:bg-stone-50">
                                                <td className="px-3 py-2">
                                                    {new Date(s.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </td>
                                                <td className="px-3 py-2">{s.productType || 'Ovos'}</td>
                                                <td className="px-3 py-2 text-right">{s.quantity}</td>
                                                <td className="px-3 py-2 text-right">
                                                    {s.pricePerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    {s.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {reportData && reportData.type === 'expenses' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Custos</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {(() => {
                        const totalExpenses = reportData.expenses.reduce((sum, e) => sum + e.amount, 0);
                        const expensesByCategory = reportData.expenses.reduce((acc, e) => {
                            acc[e.category] = (acc[e.category] || 0) + e.amount;
                            return acc;
                        }, {} as Record<string, number>);

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-red-700 uppercase">Despesas Totais</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Categorias</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {Object.keys(expensesByCategory).length} categorias
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Transações</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {reportData.expenses.length} despesas
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div>
                        <h3 className="text-sm font-semibold text-stone-700 mb-2">Despesas Detalhadas</h3>
                        {reportData.expenses.length === 0 ? (
                            <p className="text-xs text-stone-500">Nenhuma despesa no período.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-stone-600 border-collapse">
                                    <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b">
                                        <tr>
                                            <th className="px-3 py-2">Data</th>
                                            <th className="px-3 py-2">Lote</th>
                                            <th className="px-3 py-2">Categoria</th>
                                            <th className="px-3 py-2">Descrição</th>
                                            <th className="px-3 py-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.expenses.map(e => {
                                            const flock = flocks.find(f => f.id === e.flockId);
                                            return (
                                                <tr key={e.id} className="border-b last:border-0 hover:bg-stone-50">
                                                    <td className="px-3 py-2">
                                                        {new Date(e.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </td>
                                                    <td className="px-3 py-2">{flock?.name || 'Geral'}</td>
                                                    <td className="px-3 py-2">{e.category}</td>
                                                    <td className="px-3 py-2">{e.description}</td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {reportData && reportData.type === 'posture' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Postura</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {(() => {
                        const totalEggs = reportData.records.reduce((sum, r) => sum + r.eggsCollected, 0);
                        const totalMortality = reportData.records.reduce((sum, r) => sum + (r.mortality || 0), 0);
                        const totalFeed = reportData.records.reduce((sum, r) => sum + r.feedConsumedKg, 0);
                        const uniqueDays = new Set(reportData.records.map(r => r.date.split('T')[0])).size;
                        const avgEggsPerDay = uniqueDays > 0 ? totalEggs / uniqueDays : 0;
                        const avgFeedPerDay = uniqueDays > 0 ? totalFeed / uniqueDays : 0;
                        const avgMortalityPerDay = uniqueDays > 0 ? totalMortality / uniqueDays : 0;

                        // Calcular taxa de postura (ovos/ave/dia) - assumindo 1000 aves como base se não tiver info específica
                        const avgHensPerDay = 1000; // Valor padrão, poderia ser dinâmico baseado nos lotes
                        const postureRate = avgHensPerDay > 0 ? (avgEggsPerDay / avgHensPerDay) * 100 : 0;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-700 uppercase">Taxa de Postura</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">{postureRate.toFixed(1)}%</p>
                                    <p className="text-xs text-stone-500">({avgEggsPerDay.toFixed(0)} ovos/dia)</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Consumo Ração</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">{avgFeedPerDay.toFixed(1)} kg/dia</p>
                                    <p className="text-xs text-stone-500">Média diária</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 uppercase">Conversão</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {avgEggsPerDay > 0 ? (avgFeedPerDay / avgEggsPerDay * 1000).toFixed(2) : '0'} g/ovo
                                    </p>
                                    <p className="text-xs text-stone-500">Ração por ovo</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-red-700 uppercase">Mortalidade</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">{avgMortalityPerDay.toFixed(1)}/dia</p>
                                    <p className="text-xs text-stone-500">Média diária</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Tabela detalhada com métricas */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-stone-600 border-collapse">
                            <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b">
                                <tr>
                                    <th className="px-3 py-2">Data</th>
                                    <th className="px-3 py-2">Lote</th>
                                    <th className="px-3 py-2 text-right">Ovos</th>
                                    <th className="px-3 py-2 text-right">Ração (kg)</th>
                                    <th className="px-3 py-2 text-right">Conversão</th>
                                    <th className="px-3 py-2 text-right">Mortalidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.records.map(r => {
                                    const flock = flocks.find(f => f.id === r.flockId);
                                    const conversionRate = r.eggsCollected > 0 ? (r.feedConsumedKg / r.eggsCollected * 1000) : 0;
                                    return (
                                        <tr key={r.id} className="border-b last:border-0 hover:bg-stone-50">
                                            <td className="px-3 py-2">
                                                {new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                            </td>
                                            <td className="px-3 py-2">{flock?.name || 'N/A'}</td>
                                            <td className="px-3 py-2 text-right">{r.eggsCollected}</td>
                                            <td className="px-3 py-2 text-right">{r.feedConsumedKg.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right">{conversionRate.toFixed(1)} g</td>
                                            <td className="px-3 py-2 text-right">{r.mortality || 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {reportData && reportData.type === 'clients' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Clientes</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {(() => {
                        const totalRevenue = reportData.sales.reduce((sum, s) => sum + s.totalAmount, 0);
                        const totalQuantity = reportData.sales.reduce((sum, s) => sum + s.quantity, 0);
                        const avgTicket = reportData.sales.length > 0 ? totalRevenue / reportData.sales.length : 0;

                        // Agrupar vendas por cliente (assumindo que existe um campo clientName)
                        const salesByClient = reportData.sales.reduce((acc, s) => {
                            const clientName = (s as any).clientName || 'Cliente Não Informado';
                            if (!acc[clientName]) {
                                acc[clientName] = { sales: 0, revenue: 0, quantity: 0 };
                            }
                            acc[clientName].sales += 1;
                            acc[clientName].revenue += s.totalAmount;
                            acc[clientName].quantity += s.quantity;
                            return acc;
                        }, {} as Record<string, { sales: number; revenue: number; quantity: number }>);

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 uppercase">Receita Total</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Clientes Ativos</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {Object.keys(salesByClient).length} clientes
                                    </p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-amber-700 uppercase">Ticket Médio</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div>
                        <h3 className="text-sm font-semibold text-stone-700 mb-2">Vendas por Cliente</h3>
                        {reportData.sales.length === 0 ? (
                            <p className="text-xs text-stone-500">Nenhuma venda no período.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-stone-600 border-collapse">
                                    <thead className="bg-stone-50 text-xs uppercase text-stone-500 border-b">
                                        <tr>
                                            <th className="px-3 py-2">Data</th>
                                            <th className="px-3 py-2">Cliente</th>
                                            <th className="px-3 py-2">Produto</th>
                                            <th className="px-3 py-2 text-right">Qtd</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.sales.map(s => (
                                            <tr key={s.id} className="border-b last:border-0 hover:bg-stone-50">
                                                <td className="px-3 py-2">
                                                    {new Date(s.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </td>
                                                <td className="px-3 py-2">{(s as any).clientName || 'Não informado'}</td>
                                                <td className="px-3 py-2">{s.productType || 'Ovos'}</td>
                                                <td className="px-3 py-2 text-right">{s.quantity}</td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    {s.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
		</div>
	);
};

export default Reports;
