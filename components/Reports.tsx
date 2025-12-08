import { useState, FC, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { generateProductionReport, generateFinancialReport } from '../services/reportGenerator.ts';
import { ReportIcon } from './icons';
import { DailyRecord, Expense, Sale } from '../types';

type ReportType = 'production' | 'financial';

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

type ReportData = ProductionReportData | FinancialReportData | null;

const Reports: FC = () => {
	const { flocks, records, expenses, sales } = useFarm();
	const [reportType, setReportType] = useState<ReportType>('production');
    
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };
    
    // Define data inicial e final como a data atual (local)
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState(getLocalDateString());
    
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

	const handleGenerateReport = () => {
		setIsLoading(true);
		setMessage('');
		setReportData(null);

		try {
			if (reportType === 'production') {
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
					type: 'production',
					records: filteredRecords,
					flockName: selectedFlockName,
					startDate,
					endDate,
				});
				setMessage('Relatório de Produção gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
			} else {
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

				setReportData({
					type: 'financial',
					expenses: filteredExpenses,
					sales: filteredSales,
					flockName: selectedFlockName,
					startDate,
					endDate,
				});
				setMessage('Relatório Financeiro gerado. Você pode visualizar na tela, imprimir ou baixar o PDF.');
			}
		} catch (error: any) {
			console.error(' Erro ao gerar relatório:', error);
			setMessage('Ocorreu um erro técnico ao gerar o relatório.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownloadPdf = () => {
		if (!reportData) return;

		if (reportData.type === 'production') {
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
				reportData.expenses,
				reportData.sales,
				flocks,
				reportData.flockName,
				reportData.startDate,
				reportData.endDate,
			);
		}
	};

	const handlePrint = () => {
		if (!reportData) return;
		window.print();
	};

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-stone-800">Gerador de Relatórios</h1>

            <div className="bg-white p-8 rounded-xl shadow-md space-y-8">
                <div>
                    <label className="block text-lg font-semibold text-stone-700 mb-3">1. Escolha o Tipo de Relatório</label>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <button 
                            onClick={() => setReportType('production')}
                            className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 border-2 flex items-center justify-center sm:justify-start ${reportType === 'production' ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm ring-2 ring-amber-200 ring-offset-1' : 'border-stone-100 bg-stone-50 text-stone-600 hover:border-amber-200 hover:bg-stone-100'}`}
                        >
                            <span className="bg-amber-100 p-2 rounded-lg mr-3">🐔</span>
                            Produção e Zootécnico
                        </button>
                        <button 
                            onClick={() => setReportType('financial')}
                            className={`px-6 py-4 rounded-xl font-medium transition-all duration-200 border-2 flex items-center justify-center sm:justify-start ${reportType === 'financial' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm ring-2 ring-green-200 ring-offset-1' : 'border-stone-100 bg-stone-50 text-stone-600 hover:border-green-200 hover:bg-stone-100'}`}
                        >
                             <span className="bg-green-100 p-2 rounded-lg mr-3">💰</span>
                            Financeiro (DRE)
                        </button>
                    </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                     <label className="block text-lg font-semibold text-stone-700 mb-4">2. Configure os Filtros</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-stone-600 mb-1">Data Inicial</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-stone-600 mb-1">Data Final</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"/>
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
                </div>

                <div className="pt-2">
                    <div className="pt-2 space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <button 
                                onClick={handleGenerateReport} 
                                disabled={isLoading}
                                className={`flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow text-base font-bold text-white transition-all transform hover:-translate-y-0.5 ${reportType === 'production' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-amber-500' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
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

                            <button
                                onClick={handlePrint}
                                disabled={!reportData}
                                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Imprimir
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

            {/* Área de visualização do relatório na tela */}
            {reportData && reportData.type === 'production' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório de Produção</h2>
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

            {reportData && reportData.type === 'financial' && (
                <div className="bg-white p-6 rounded-xl shadow-md space-y-4 print:bg-white print:shadow-none">
                    <h2 className="text-xl font-semibold text-stone-800">Relatório Financeiro</h2>
                    <p className="text-sm text-stone-500">
                        Período: <strong>{reportData.startDate}</strong> a <strong>{reportData.endDate}</strong> | Lote: <strong>{reportData.flockName}</strong>
                    </p>

                    {(() => {
                        const totalRevenue = reportData.sales.reduce((sum, s) => sum + s.totalAmount, 0);
                        const totalExpenses = reportData.expenses.reduce((sum, e) => sum + e.amount, 0);
                        const netResult = totalRevenue - totalExpenses;

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 uppercase">Receitas</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-red-700 uppercase">Despesas</p>
                                    <p className="mt-1 text-lg font-bold text-stone-800">
                                        {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-stone-700 uppercase">Resultado</p>
                                    <p className={`mt-1 text-lg font-bold ${netResult >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {netResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Vendas */}
                        <div>
                            <h3 className="text-sm font-semibold text-stone-700 mb-2">Vendas</h3>
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

                        {/* Despesas */}
                        <div>
                            <h3 className="text-sm font-semibold text-stone-700 mb-2">Despesas</h3>
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
                </div>
            )}
		</div>
	);
};

export default Reports;
