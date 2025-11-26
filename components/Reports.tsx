
import { useState, FC } from 'react';
import { useFarm } from '../context/FarmContext';
import { generateProductionReport, generateFinancialReport } from '../services/reportGenerator.ts';
import { ReportIcon } from './icons';

type ReportType = 'production' | 'financial';

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

    const handleGenerateReport = () => {
        setIsLoading(true);
        setMessage('');

        try {
            if (reportType === 'production') {
                // Filtra registros por data e lote
                const filteredRecords = records.filter(r => {
                    // Comparar diretamente as strings de data YYYY-MM-DD
                    const recordDate = r.date;
                    const isAfterStart = recordDate >= startDate;
                    const isBeforeEnd = recordDate <= endDate;
                    const isCorrectFlock = selectedFlockId === 'all' || r.flockId === selectedFlockId;
                    return isAfterStart && isBeforeEnd && isCorrectFlock;
                }).sort((a, b) => a.date.localeCompare(b.date));

                if (filteredRecords.length === 0) {
                    setMessage('Nenhum dado de produção encontrado para o período selecionado.');
                    setIsLoading(false);
                    return;
                }

                generateProductionReport(filteredRecords, flocks, expenses, selectedFlockId === 'all' ? 'Todos os Lotes' : flocks.find(f => f.id === selectedFlockId)?.name || 'Desconhecido', startDate, endDate);
                setMessage('Relatório de Produção gerado com sucesso!');
            } else { // Financial Report
                const filteredExpenses = expenses.filter(e => {
                    // Comparar diretamente as strings de data YYYY-MM-DD
                    const expenseDate = e.date;
                    const isAfterStart = expenseDate >= startDate;
                    const isBeforeEnd = expenseDate <= endDate;
                    const isCorrectFlock = selectedFlockId === 'all' || e.flockId === selectedFlockId;
                    return isAfterStart && isBeforeEnd && isCorrectFlock;
                }).sort((a, b) => a.date.localeCompare(b.date));

                const filteredSales = sales.filter(s => {
                    // Comparar diretamente as strings de data YYYY-MM-DD
                    const saleDate = s.date;
                    const isAfterStart = saleDate >= startDate;
                    const isBeforeEnd = saleDate <= endDate;
                    const isCorrectFlock = selectedFlockId === 'all' || s.flockId === selectedFlockId;
                    return isAfterStart && isBeforeEnd && isCorrectFlock;
                }).sort((a, b) => a.date.localeCompare(b.date));

                if (filteredExpenses.length === 0 && filteredSales.length === 0) {
                    setMessage('Nenhum dado financeiro encontrado para o período selecionado.');
                    setIsLoading(false);
                    return;
                }

                generateFinancialReport(filteredExpenses, filteredSales, flocks, selectedFlockId === 'all' ? 'Todos os Lotes' : flocks.find(f => f.id === selectedFlockId)?.name || 'Desconhecido', startDate, endDate);
                setMessage('Relatório Financeiro gerado com sucesso!');
            }
        } catch (error) {
            console.error(' Erro ao gerar relatório:', error);
            console.error(' Stack trace:', error.stack);
            setMessage(`Ocorreu um erro técnico ao gerar o PDF: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
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
                    <button 
                        onClick={handleGenerateReport} 
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white transition-all transform hover:-translate-y-0.5 ${reportType === 'production' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:ring-amber-500' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                        <ReportIcon className="w-6 h-6 mr-2" />
                        <span className="ml-2">{isLoading ? 'Gerando PDF...' : `Baixar Relatório ${reportType === 'production' ? 'de Produção' : 'Financeiro'}`}</span>
                    </button>
                    {message && (
                        <div className={`mt-4 p-4 rounded-lg text-center text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.includes('sucesso') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
