
import { useState, useEffect, FC, ChangeEvent, FormEvent, FocusEvent, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { DailyRecord } from '../types';
import { EditIcon, TrashIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

// Helper para formatar data para o input date (YYYY-MM-DD)
const toLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - offset)).toISOString().split('T')[0];
};

// Helper para calcular estatísticas
const calculateStats = (records: DailyRecord[]) => {
    if (records.length === 0) {
        return {
            totalProduced: 0,
            totalLost: 0,
            qualityRate: 0,
            averageProduction: 0
        };
    }

    const totalProduced = records.reduce((sum, r) => sum + r.eggsCollected, 0);
    const totalLost = records.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);
    const qualityRate = totalProduced > 0 ? ((totalProduced - totalLost) / totalProduced * 100) : 0;
    const averageProduction = Math.round(totalProduced / records.length);

    return {
        totalProduced,
        totalLost,
        qualityRate,
        averageProduction
    };
};

const AddRecordForm: FC<{onClose: () => void; recordToEdit?: DailyRecord | null}> = ({ onClose, recordToEdit }) => {
    const { flocks, addRecord, updateRecord } = useFarm();
    const activeFlocks = flocks.filter(f => f.status === 'Ativo');
    
    const [formData, setFormData] = useState<any>({
        date: toLocalDateString(new Date()),
        flockId: activeFlocks.length > 0 ? activeFlocks[0].id : '',
        eggsCollected: '',
        brokenEggs: 0,
        feedConsumedKg: 0,
    });
    const [message, setMessage] = useState<{type: 'error', text: string} | null>(null);

    useEffect(() => {
        if (recordToEdit) {
            setFormData({
                ...recordToEdit,
                date: toLocalDateString(new Date(recordToEdit.date)),
                brokenEggs: recordToEdit.brokenEggs ?? 0,
            });
        }
    }, [recordToEdit]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let val: string | number = value;
        // Campos numéricos que podem ser vazios durante a digitação ou zero
        if (['eggsCollected', 'brokenEggs', 'feedConsumedKg'].includes(name)) {
            val = value === '' ? '' : parseFloat(value);
        }

        setFormData((prev: any) => ({ ...prev, [name]: val }));
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setFormData((prev: any) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (!formData.flockId) {
            setMessage({type: 'error', text: 'Por favor, selecione um lote.'});
            return;
        }
        
        // Validação: não aceitar 0 ovos coletados
        if (!formData.eggsCollected || Number(formData.eggsCollected) <= 0) {
            setMessage({type: 'error', text: 'O total de ovos coletados deve ser maior que zero.'});
            return;
        }
        
        // Salva a data como string ISO (YYYY-MM-DD) + hora zerada UTC
        // new Date('2025-11-26') cria 2025-11-26T00:00:00.000Z
        const recordDate = new Date(formData.date);
        
        const basePayload = {
            ...formData,
            eggsCollected: Number(formData.eggsCollected),
            brokenEggs: Number(formData.brokenEggs) || 0,
            feedConsumedKg: Number(formData.feedConsumedKg) || 0,
            date: recordDate.toISOString(),
        };

        if(recordToEdit) {
            // Preserva a mortalidade existente (lançada pelo menu Mortalidade)
            const payload = {
                ...basePayload,
                mortality: recordToEdit.mortality,
            };
            updateRecord(recordToEdit.id, payload);
        } else {
            // Novos registros de coleta começam com mortalidade 0
            const payload = {
                ...basePayload,
                mortality: 0,
            };
            addRecord(payload);
        }

        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
                <div className={`p-4 rounded-md text-sm text-white ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {message.text}
                </div>
            )}
            
            {/* Cabeçalho do Registro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-stone-700">Data da Coleta</label>
                    <input 
                        type="date" 
                        id="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" 
                    />
                </div>
                <div>
                    <label htmlFor="flockId" className="block text-sm font-medium text-stone-700">Lote</label>
                    <select id="flockId" name="flockId" value={formData.flockId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                        <option value="">Selecione um lote</option>
                        {activeFlocks.map(flock => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 pb-1">Produção & Qualidade</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="eggsCollected" className="block text-sm font-medium text-stone-600">Total Ovos Coletados</label>
                        <input type="number" id="eggsCollected" name="eggsCollected" min="1" value={formData.eggsCollected} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label htmlFor="brokenEggs" className="block text-sm font-medium text-red-600">Ovos Quebrados/Trincados</label>
                        <input type="number" id="brokenEggs" name="brokenEggs" min="0" value={formData.brokenEggs} onChange={handleChange} onFocus={handleFocus} className="mt-1 block w-full px-3 py-2 bg-white border border-red-200 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 pb-1">Consumo</h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="feedConsumedKg" className="block text-sm font-medium text-stone-600">Ração Consumida (kg)</label>
                        <input type="number" step="0.01" id="feedConsumedKg" name="feedConsumedKg" min="0" value={formData.feedConsumedKg} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-stone-200 mt-4">
                 <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                 <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm">{recordToEdit ? 'Salvar Alterações' : 'Salvar Registro'}</button>
            </div>
        </form>
    );
};

const DataEntry: FC = () => {
    const { records, flocks, getFlockById, deleteRecord } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<DailyRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState({ 
        start: toLocalDateString(new Date()), 
        end: toLocalDateString(new Date()) 
    });
    const [selectedFlock, setSelectedFlock] = useState('');
    const [periodType, setPeriodType] = useState<'diario' | 'semanal' | 'mensal' | 'personalizado'>('diario');
    
    // Filtrar registros baseado nos filtros
    const filteredRecords = useMemo(() => {
        let filtered = [...records];
        
        // Filtro por data
        if (dateFilter.start) {
            filtered = filtered.filter(r => new Date(r.date) >= new Date(dateFilter.start));
        }
        if (dateFilter.end) {
            filtered = filtered.filter(r => new Date(r.date) <= new Date(dateFilter.end));
        }
        
        // Filtro por lote
        if (selectedFlock) {
            filtered = filtered.filter(r => r.flockId === selectedFlock);
        }
        
        return filtered;
    }, [records, dateFilter, selectedFlock]);
    
    // Calcular estatísticas dos registros filtrados
    const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);

    // Função para atualizar datas baseada no período
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
                // Manter datas atuais, apenas mudar o tipo
                break;
        }

        setPeriodType(period);
    };

    // Ordena registros com mais recentes no topo
    const sortedRecords = useMemo(() => {
        return [...filteredRecords].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            
            if (dateB !== dateA) {
                return dateB - dateA;
            }
            
            if (a.createdAt && b.createdAt) {
                const createdA = new Date(a.createdAt).getTime();
                const createdB = new Date(b.createdAt).getTime();
                return createdB - createdA;
            }
            
            return 0;
        });
    }, [filteredRecords]);

    const handleOpenEditModal = (record: DailyRecord) => {
        setRecordToEdit(record);
        setIsModalOpen(true);
    };
    
    const handleOpenAddModal = () => {
        setRecordToEdit(null);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRecordToEdit(null);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteRecord(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header com botão */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🥚</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-stone-800">Coleta de Ovos</h1>
                        <p className="text-sm text-stone-500">Controle de produção e qualidade</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenAddModal} 
                    className="px-6 py-3 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                    <span className="text-lg">+</span>
                    Nova Coleta
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">📅</span>
                    <h3 className="text-lg font-semibold text-stone-800">Filtros e Período</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Período</label>
                        <select 
                            value={periodType}
                            onChange={(e) => updateDatesByPeriod(e.target.value as any)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                                <label className="block text-sm font-medium text-stone-600 mb-1">Data Inicial</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Data Final</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-stone-600 mb-1">Período Selecionado</label>
                            <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700">
                                {dateFilter.start === dateFilter.end 
                                    ? `Hoje: ${new Date(dateFilter.start + 'T00:00:00').toLocaleDateString('pt-BR')}`
                                    : `${new Date(dateFilter.start + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dateFilter.end + 'T00:00:00').toLocaleDateString('pt-BR')}`
                                }
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Lote</label>
                        <select 
                            value={selectedFlock}
                            onChange={(e) => setSelectedFlock(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Todos os lotes</option>
                            {flocks.filter(f => f.status === 'Ativo').map(flock => (
                                <option key={flock.id} value={flock.id}>{flock.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🐔</span>
                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Produção</h3>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalProduced.toLocaleString('pt-BR')}</p>
                            <p className="text-sm text-blue-700 mt-1">ovos coletados</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-blue-600 font-medium">Média: {stats.averageProduction}/dia</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🍳</span>
                                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">Perdas</h3>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{stats.totalLost.toLocaleString('pt-BR')}</p>
                            <p className="text-sm text-red-700 mt-1">ovos quebrados</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-red-600 font-medium">
                                    Taxa: {stats.totalProduced > 0 ? (stats.totalLost / stats.totalProduced * 100).toFixed(1) : '0.0'}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🏆</span>
                                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Qualidade</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{stats.qualityRate.toFixed(1)}%</p>
                            <p className="text-sm text-green-700 mt-1">taxa de ovos bons</p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs text-green-600 font-medium">
                                    {stats.qualityRate >= 95 ? 'Excelente ✅' : stats.qualityRate >= 90 ? 'Bom 👍' : 'Atenção ⚠️'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela de Registros */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 bg-stone-50 border-b border-stone-200">
                    <span className="text-lg">📝</span>
                    <h3 className="text-lg font-semibold text-stone-800">Histórico de Coletas</h3>
                    <span className="text-sm text-stone-500 ml-auto">{sortedRecords.length} registros encontrados</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[800px] border-collapse">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Lote</th>
                                <th scope="col" className="px-6 py-3 text-right">Coletados</th>
                                <th scope="col" className="px-6 py-3 text-right text-red-600">Perdas</th>
                                <th scope="col" className="px-6 py-3 text-right">Ração (kg)</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRecords.length > 0 ? sortedRecords.map(record => (
                                <tr key={record.id} className="bg-white border-b hover:bg-stone-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{getFlockById(record.flockId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{record.eggsCollected}</td>
                                    <td className="px-6 py-4 text-right text-red-500 font-medium">{record.brokenEggs || 0}</td>
                                    <td className="px-6 py-4 text-right">{record.feedConsumedKg.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(record); }} 
                                            className="p-2 text-stone-500 hover:text-amber-600 transition-colors" 
                                            aria-label="Editar Lançamento"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleDeleteClick(record.id);
                                            }} 
                                            className="p-2 text-stone-500 hover:text-red-600 transition-colors" 
                                            aria-label="Excluir Lançamento"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-stone-500">
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl mb-2">🥚</span>
                                            <p>Nenhuma coleta registrada no período.</p>
                                            <p className="text-sm text-stone-400 mt-1">Clique em "Nova Coleta" para adicionar seu primeiro registro.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Registro de Coleta"
                message="Tem certeza que deseja excluir este registro de coleta? Essa ação não pode ser desfeita e pode afetar os cálculos de estoque."
                confirmText="Excluir Registro"
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-6">{recordToEdit ? 'Editar Registro' : 'Novo Registro Diário'}</h2>
                            <AddRecordForm onClose={handleCloseModal} recordToEdit={recordToEdit} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataEntry;
