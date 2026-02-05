import { useState, useMemo, FC } from 'react';
import { useFarm } from '../context/FarmContext';
import { DailyRecord } from '../types';
import { EditIcon, TrashIcon } from './icons';

const toLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - offset)).toISOString().split('T')[0];
};

const getLocalYMD = (date: Date | string) => {
    if (typeof date === 'string') {
        return date.slice(0, 10);
    }
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const FeedConsumption: FC = () => {
    const { flocks, records, addRecord, updateRecord, deleteRecord, getHensCountOnDate, getFlockById, navigate } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<DailyRecord | null>(null);
    const [periodFilter, setPeriodFilter] = useState<'7days' | '30days' | 'all'>('30days');
    const [flockFilter, setFlockFilter] = useState<string>('all');

    const FEED_TYPES = [
        'Pré-inicial',
        'Inicial',
        'Crescimento I',
        'Crescimento II',
        'Pré-postura',
        'Postura I',
        'Postura II'
    ];

    const [formData, setFormData] = useState({
        date: toLocalDateString(new Date()),
        flockId: '',
        feedProvidedKg: '',
        feedType: 'Postura I',
        notes: ''
    });

    const handleOpenModal = (record?: DailyRecord) => {
        if (record) {
            setRecordToEdit(record);
            setFormData({
                date: toLocalDateString(new Date(record.date)),
                flockId: record.flockId,
                feedProvidedKg: String(record.feedProvidedKg || 0),
                feedType: record.feedType || 'Postura I',
                notes: record.notes || ''
            });
        } else {
            setRecordToEdit(null);
            setFormData({
                date: toLocalDateString(new Date()),
                flockId: '',
                feedProvidedKg: '',
                feedType: 'Postura I',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRecordToEdit(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.flockId) {
            alert('Selecione um lote');
            return;
        }

        if (!formData.feedProvidedKg || Number(formData.feedProvidedKg) <= 0) {
            alert('Informe a quantidade de ração fornecida');
            return;
        }

        // Criar data ajustando timezone para evitar mudança de dia
        // Adiciona 12h para garantir que mesmo com conversão UTC fique no mesmo dia
        const [year, month, day] = formData.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day, 12, 0, 0);
        const dateStr = dateObj.toISOString();
        
        if (recordToEdit) {
            // Atualizar registro existente
            updateRecord(recordToEdit.id, {
                ...recordToEdit,
                date: dateStr, // Incluir a data atualizada
                feedProvidedKg: Number(formData.feedProvidedKg),
                feedType: formData.feedType,
                notes: formData.notes
            });
        } else {
            // Criar novo registro
            // Verificar se já existe registro para essa data e lote
            const existingRecord = records.find(
                r => r.flockId === formData.flockId && 
                getLocalYMD(r.date) === formData.date
            );

            if (existingRecord) {
                // Atualizar registro existente
                updateRecord(existingRecord.id, {
                    ...existingRecord,
                    feedProvidedKg: Number(formData.feedProvidedKg),
                    feedType: formData.feedType,
                    notes: formData.notes
                });
            } else {
                // Criar novo registro apenas com consumo de ração
                addRecord({
                    date: dateStr,
                    flockId: formData.flockId,
                    eggsCollected: 0, // Não é coleta de ovos
                    brokenEggs: 0,
                    feedConsumedKg: 0, // Será preenchido depois
                    feedProvidedKg: Number(formData.feedProvidedKg),
                    feedType: formData.feedType,
                    mortality: 0,
                    notes: formData.notes
                });
            }
        }

        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        deleteRecord(id);
    };

    // Filtrar registros por período
    const filteredRecords = useMemo(() => {
        const now = new Date();
        let cutoffDate = new Date();

        switch (periodFilter) {
            case '7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case 'all':
                cutoffDate = new Date(0);
                break;
        }

        return records
            .filter(r => r.feedProvidedKg && r.feedProvidedKg > 0)
            .filter(r => new Date(r.date) >= cutoffDate)
            .filter(r => flockFilter === 'all' || r.flockId === flockFilter)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, periodFilter, flockFilter]);

    // Calcular estatísticas simples - apenas totais fornecidos
    const stats = useMemo(() => {
        let totalProvided = 0;
        let totalRecords = 0;

        filteredRecords.forEach((record) => {
            const provided = record.feedProvidedKg || 0;
            totalProvided += provided;
            totalRecords++;
        });

        return {
            totalProvided,
            totalRecords,
            averagePerRecord: totalRecords > 0 ? totalProvided / totalRecords : 0,
            consumptionPerBirdPerDay: calculateConsumptionPerBirdPerDay()
        };
        
        function calculateConsumptionPerBirdPerDay(): number {
            let totalConsumption = 0;
            let totalBirdDays = 0;
            
            // Agrupar registros por lote para calcular consumo por período
            const recordsByFlock = filteredRecords.reduce((acc, record) => {
                if (!acc[record.flockId]) {
                    acc[record.flockId] = [];
                }
                acc[record.flockId].push(record);
                return acc;
            }, {} as Record<string, typeof filteredRecords>);
            
            Object.entries(recordsByFlock).forEach(([flockId, flockRecords]) => {
                const flock = getFlockById(flockId);
                if (!flock || flockRecords.length === 0) return;
                
                // Ordenar registros por data (mais antigo primeiro)
                const sortedRecords = flockRecords.sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                
                // Calcular consumo para cada registro no período
                sortedRecords.forEach((record, index) => {
                    const provided = record.feedProvidedKg || 0;
                    if (provided > 0) {
                        const recordDate = new Date(getLocalYMD(record.date));
                        const hensCount = getHensCountOnDate(flockId, recordDate);
                        
                        if (hensCount > 0) {
                            // Para o primeiro registro, usar 1 dia
                            // Para os demais, calcular dias desde o registro anterior
                            let days = 1;
                            if (index > 0) {
                                const previousRecord = sortedRecords[index - 1];
                                days = Math.max(1, Math.ceil(
                                    (new Date(record.date).getTime() - new Date(previousRecord.date).getTime()) 
                                    / (1000 * 60 * 60 * 24)
                                ));
                            }
                            
                            totalConsumption += provided;
                            totalBirdDays += hensCount * days;
                        }
                    }
                });
            });
            
            return totalBirdDays > 0 ? (totalConsumption * 1000) / totalBirdDays : 0; // gramas/ave/dia
        }
    }, [filteredRecords, getHensCountOnDate, getFlockById]);

    return (
        <div className="space-y-4">
            {/* Header com Filtro de Lote - Sticky no Mobile */}
            <div className="sticky top-0 z-10 bg-slate-50 pb-4 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="flex justify-between items-center gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Consumo de Ração</h1>
                                <p className="text-xs text-slate-500 mt-1">Controle o fornecimento de ração</p>
                            </div>
                            <button
                                onClick={() => navigate('dashboard')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Voltar
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
                    >
                        + Registrar
                    </button>
                </div>
                
                {/* Filtros Combinados: Lote + Período */}
                <div className="mt-3 bg-white p-3 rounded-lg shadow-sm border-2 border-orange-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-slate-700">📊 Filtros</label>
                    </div>
                    
                    {/* Lote */}
                    <div className="mb-3">
                        <label className="block text-xs text-slate-600 mb-1">Lote</label>
                        <select
                            value={flockFilter}
                            onChange={(e) => setFlockFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                        >
                            <option value="all">Todos os lotes</option>
                            {flocks.filter(f => f.status === 'Ativo').map(flock => (
                                <option key={flock.id} value={flock.id}>
                                    {flock.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Período */}
                    <div>
                        <label className="block text-xs text-slate-600 mb-1">Período</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPeriodFilter('7days')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    periodFilter === '7days'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                7d
                            </button>
                            <button
                                onClick={() => setPeriodFilter('30days')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    periodFilter === '30days'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                30d
                            </button>
                            <button
                                onClick={() => setPeriodFilter('all')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    periodFilter === 'all'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Todos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Resumo Compacto */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg shadow-md border border-orange-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    📈 Controle de Ração
                    {flockFilter !== 'all' && (
                        <span className="text-xs font-normal text-orange-600">
                            - {getFlockById(flockFilter)?.name || 'Lote'}
                        </span>
                    )}
                    <span className="text-xs font-normal text-slate-500">
                        ({periodFilter === '7days' ? '7 dias' : periodFilter === '30days' ? '30 dias' : 'Todos'})
                    </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Ração Fornecida</p>
                        <p className="text-lg font-bold text-slate-800">{stats.totalProvided.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Total de Registros</p>
                        <p className="text-lg font-bold text-blue-600">{stats.totalRecords}</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Média por Registro</p>
                        <p className="text-lg font-bold text-purple-600">{stats.averagePerRecord.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Consumo/Ave/Dia</p>
                        <p className="text-lg font-bold text-green-600">{stats.consumptionPerBirdPerDay.toFixed(0)} g</p>
                    </div>
                </div>
            </div>

                                {/* Records Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Data</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Lote</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Fornecida</th>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-2 py-4 text-center text-slate-500 text-sm">
                                        Nenhum registro de consumo encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => {
                                    const flock = getFlockById(record.flockId);
                                    const provided = record.feedProvidedKg || 0;
                                    
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="px-2 py-2 text-sm text-slate-800">
                                                {(() => {
                                                    const dateStr = getLocalYMD(record.date);
                                                    const [year, month, day] = dateStr.split('-');
                                                    return `${day}/${month}`;
                                                })()}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-slate-800">
                                                {flock?.name || 'Lote não encontrado'}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-slate-600">
                                                <span className="inline-block px-1 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded whitespace-nowrap text-[9px]">
                                                    {record.feedType || 'Não informado'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 text-sm text-right text-slate-800 font-medium">
                                                <div>{provided.toFixed(1)} kg</div>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenModal(record)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <EditIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Formulário */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">
                                {recordToEdit ? 'Editar Consumo' : 'Registrar Consumo de Ração'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Data
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        max={toLocalDateString(new Date())}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Lote
                                    </label>
                                    <select
                                        value={formData.flockId}
                                        onChange={(e) => setFormData({ ...formData, flockId: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Selecione um lote</option>
                                        {flocks.filter(f => f.status === 'Ativo').map(flock => (
                                            <option key={flock.id} value={flock.id}>
                                                {flock.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tipo de Ração
                                    </label>
                                    <select
                                        value={formData.feedType}
                                        onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        {FEED_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Ração Fornecida (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={formData.feedProvidedKg}
                                        onChange={(e) => setFormData({ ...formData, feedProvidedKg: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Ex: 50.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Observações opcionais..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                                    >
                                        {recordToEdit ? 'Atualizar' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedConsumption;
