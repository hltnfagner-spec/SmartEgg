
import { useState, useEffect, FC, ChangeEvent, FormEvent, FocusEvent, MouseEvent, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { DailyRecord } from '../types';
import { EditIcon, TrashIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

// Helper para formatar data para o input date (YYYY-MM-DD)
const toLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - offset)).toISOString().split('T')[0];
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
        waterConsumedLiters: 0,
        notes: '',
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
        if (['eggsCollected', 'brokenEggs', 'feedConsumedKg', 'waterConsumedLiters'].includes(name)) {
            val = value === '' ? '' : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setFormData(prev => ({ ...prev, [name]: '' }));
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
            waterConsumedLiters: Number(formData.waterConsumedLiters) || 0,
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="feedConsumedKg" className="block text-sm font-medium text-stone-600">Ração Consumida (kg)</label>
                        <input type="number" step="0.01" id="feedConsumedKg" name="feedConsumedKg" min="0" value={formData.feedConsumedKg} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label htmlFor="waterConsumedLiters" className="block text-sm font-medium text-stone-600">Água Consumida (L)</label>
                        <input type="number" step="0.01" id="waterConsumedLiters" name="waterConsumedLiters" min="0" value={formData.waterConsumedLiters} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 pb-1">Saúde & Observações</h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-stone-600">Observações</label>
                        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
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
    const { records, getFlockById, deleteRecord } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToEdit, setRecordToEdit] = useState<DailyRecord | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Ordena registros com mais recentes no topo (usa useMemo para recalcular quando records mudar)
    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            
            // Primeiro ordena por data (mais recente primeiro)
            if (dateB !== dateA) {
                return dateB - dateA;
            }
            
            // Se as datas são iguais, ordena por timestamp de criação (mais recente primeiro)
            if (a.createdAt && b.createdAt) {
                const createdA = new Date(a.createdAt).getTime();
                const createdB = new Date(b.createdAt).getTime();
                return createdB - createdA;
            }
            
            // Fallback: mantém ordem original
            return 0;
        });
    }, [records]);

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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Coleta de Ovos</h1>
                <button 
                    onClick={handleOpenAddModal} 
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors"
                >
                    Adicionar Registro
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[800px] border-collapse">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Lote</th>
                                <th scope="col" className="px-6 py-3 text-right">Ovos Totais</th>
                                <th scope="col" className="px-6 py-3 text-right text-red-600">Quebrados</th>
                                <th scope="col" className="px-6 py-3 text-right">Ração (kg)</th>
                                <th scope="col" className="px-6 py-3 text-center sticky right-0 bg-stone-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10 border-l border-stone-200">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRecords.length > 0 ? sortedRecords.map(record => (
                                <tr key={record.id} className="bg-white border-b hover:bg-stone-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{getFlockById(record.flockId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">{record.eggsCollected}</td>
                                    <td className="px-6 py-4 text-right text-red-500 font-medium">{record.brokenEggs || 0}</td>
                                    <td className="px-6 py-4 text-right">{record.feedConsumedKg.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center space-x-2 sticky right-0 bg-white group-hover:bg-stone-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10 border-l border-stone-100">
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(record); }} 
                                            className="p-2 text-stone-500 hover:text-amber-600 transition-colors relative z-30" 
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
                                            className="p-2 text-stone-500 hover:text-red-600 transition-colors relative z-30" 
                                            aria-label="Excluir Lançamento"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-stone-500">Nenhum lançamento registrado ainda.</td>
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
