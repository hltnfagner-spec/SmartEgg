
import { useState, useMemo, FC, ChangeEvent, FormEvent, FocusEvent } from 'react';
import { useFarm } from '../context/FarmContext';
import { Flock, FlockTask, TaskType, Shed } from '../types';
import { ChickenIcon, EditIcon, TrashIcon, ShedIcon } from './icons';

const TASK_TYPES: TaskType[] = ['Vacinação', 'Debicagem', 'Higienização', 'Outro'];

interface TaskFormProps {
    flockId: string;
    onClose: () => void;
}

const TaskForm: FC<TaskFormProps> = ({ flockId, onClose }) => {
    const { addTask } = useFarm();
    const [formData, setFormData] = useState<Omit<FlockTask, 'id' | 'flockId' | 'isCompleted'>>({
        taskType: 'Vacinação',
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        addTask({
            ...formData,
            flockId,
            dueDate: new Date(formData.dueDate).toISOString(),
            isCompleted: false,
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="taskType" className="block text-sm font-medium text-stone-600">Tipo de Tarefa</label>
                    <select id="taskType" name="taskType" value={formData.taskType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                        {TASK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-stone-600">Data de Vencimento</label>
                    <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-stone-600">Observações</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">Agendar Tarefa</button>
            </div>
        </form>
    );
};


interface FlockFormProps {
    onClose: () => void;
    flockToEdit?: Flock | null;
}

const FlockForm: FC<FlockFormProps> = ({ onClose, flockToEdit }) => {
    const { addFlock, updateFlock, getAvailableSheds } = useFarm();
    
    const availableSheds = useMemo(() => {
        const sheds = getAvailableSheds();
        return sheds;
    }, [getAvailableSheds]);

    const formatDateForInput = (isoDate: string) => isoDate.split('T')[0];

    // Usando 'any' para permitir string vazia
    const [formData, setFormData] = useState<any>({
        name: flockToEdit?.name || '',
        breed: flockToEdit?.breed || '',
        shedId: flockToEdit?.shedId || (availableSheds.length > 0 ? availableSheds[0].id : ''),
        birthDate: flockToEdit ? formatDateForInput(flockToEdit.birthDate) : new Date().toISOString().split('T')[0],
        arrivalDate: flockToEdit ? formatDateForInput(flockToEdit.arrivalDate) : new Date().toISOString().split('T')[0],
        plannedDisposalDate: flockToEdit ? formatDateForInput(flockToEdit.plannedDisposalDate) : new Date().toISOString().split('T')[0],
        initialHenCount: flockToEdit?.initialHenCount || 0,
    });
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let val: string | number = value;

        if (name === 'initialHenCount') {
            val = value === '' ? '' : parseInt(value, 10);
        }

        setFormData((prev: any) => ({
            ...prev,
            [name]: val
        }));
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setFormData((prev: any) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        if (!formData.shedId) {
            setErrorMessage('É necessário selecionar um galpão para o lote.');
            return;
        }

        const dataPayload = {
            ...formData,
            initialHenCount: Number(formData.initialHenCount) || 0,
            birthDate: new Date(formData.birthDate).toISOString(),
            arrivalDate: new Date(formData.arrivalDate).toISOString(),
            plannedDisposalDate: new Date(formData.plannedDisposalDate).toISOString()
        };
        
        if (flockToEdit) {
            updateFlock(flockToEdit.id, dataPayload);
        } else {
            addFlock(dataPayload);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-stone-600">Nome do Lote</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                 <div>
                    <label htmlFor="shedId" className="block text-sm font-medium text-stone-600">Galpão</label>
                    <select id="shedId" name="shedId" value={formData.shedId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100">
                        {availableSheds.length === 0 && !flockToEdit ? (
                            <option value="" disabled>Nenhum galpão disponível</option>
                        ) : (
                            <>
                                <option value="" disabled>Selecione um galpão</option>
                                {availableSheds.map(shed => (
                                    <option key={shed.id} value={shed.id}>{shed.name} (Cap: {shed.capacity})</option>
                                ))}
                            </>
                        )}
                    </select>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="breed" className="block text-sm font-medium text-stone-600">Raça</label>
                    <input type="text" id="breed" name="breed" value={formData.breed} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                 <div>
                    <label htmlFor="initialHenCount" className="block text-sm font-medium text-stone-600">Qtd. Inicial de Aves</label>
                    <input type="number" id="initialHenCount" name="initialHenCount" min="0" value={formData.initialHenCount} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-stone-600">Data de Nascimento</label>
                    <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                 <div>
                    <label htmlFor="arrivalDate" className="block text-sm font-medium text-stone-600">Data de Chegada</label>
                    <input type="date" id="arrivalDate" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                    <label htmlFor="plannedDisposalDate" className="block text-sm font-medium text-stone-600">Previsão de Descarte</label>
                    <input type="date" id="plannedDisposalDate" name="plannedDisposalDate" value={formData.plannedDisposalDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">{flockToEdit ? 'Salvar Alterações' : 'Adicionar Lote'}</button>
            </div>
        </form>
    );
};

const FlockManagement: FC = () => {
    const { flocks, sheds, addFlock, updateFlock, disposeFlock, deleteFlock, addTask, deleteTask, getHensCountOnDate, getRecordsByFlockId } = useFarm();
    const [isFlockModalOpen, setIsFlockModalOpen] = useState(false);
    const [flockToEdit, setFlockToEdit] = useState<Flock | null>(null);
    const [taskModalState, setTaskModalState] = useState<{isOpen: boolean, flockId: string | null}>({isOpen: false, flockId: null});
    const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, flockId: string | null, flockName: string}>({isOpen: false, flockId: null, flockName: ''});

    const handleOpenAddModal = () => {
        setFlockToEdit(null);
        setIsFlockModalOpen(true);
    };

    const handleOpenEditModal = (flock: Flock) => {
        setFlockToEdit(flock);
        setIsFlockModalOpen(true);
    };
    
    const handleOpenTaskModal = (flockId: string) => {
        setTaskModalState({isOpen: true, flockId});
    }

    const handleCloseModals = () => {
        setIsFlockModalOpen(false);
        setFlockToEdit(null);
        setTaskModalState({isOpen: false, flockId: null});
    };

    const handleDispose = (flockId: string, flockName: string) => {
        setDeleteDialog({
            isOpen: true,
            flockId,
            flockName
        });
    };

    const confirmDispose = () => {
        if (deleteDialog.flockId) {
            disposeFlock(deleteDialog.flockId);
            setDeleteDialog({isOpen: false, flockId: null, flockName: ''});
        }
    };

    const cancelDelete = () => {
        setDeleteDialog({isOpen: false, flockId: null, flockName: ''});
    };

    const calculateAge = (birthDate: string) => {
        const diff = new Date().getTime() - new Date(birthDate).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(days / 7);
        return { days, weeks };
    };

    const flockData = useMemo(() => {
        return flocks.map(flock => {
            // Calcula mortalidade total a partir dos registros do lote
            const records = getRecordsByFlockId(flock.id);
            const totalMortality = records.reduce((sum, r) => sum + (r.mortality || 0), 0);
            // Calcula aves atuais usando helper do contexto (considera data atual)
            const currentHenCount = getHensCountOnDate(flock.id, new Date());

            return {
                ...flock,
                totalExpenses: 0,
                totalRevenue: 0,
                totalMortality,
                currentHenCount,
                costPerEgg: 0,
                profitPerEgg: 0,
            };
        }).sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'Ativo' ? -1 : 1;
        });
    }, [flocks, getHensCountOnDate, getRecordsByFlockId]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Gerenciamento de Lotes</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                    Adicionar Lote
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flockData.map(flock => {
                    const tasks: any[] = [];
                    const shed: any = null;
                    return (
                    <div key={flock.id} className={`bg-white p-5 rounded-xl shadow-md flex flex-col transition-opacity ${flock.status === 'Descartado' ? 'opacity-60' : ''}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-red-100 rounded-full"><ChickenIcon /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-stone-800">{flock.name}</h2>
                                    <p className="text-sm text-stone-500">{flock.breed}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                {flock.status === 'Ativo' ? (
                                    <>
                                        <button onClick={() => handleOpenEditModal(flock)} className="p-1 text-stone-500 hover:text-amber-600 transition-colors" aria-label="Editar Lote"><EditIcon /></button>
                                        <button onClick={() => handleDispose(flock.id, flock.name)} className="p-1 text-stone-500 hover:text-red-600 transition-colors" aria-label="Descartar Lote"><TrashIcon /></button>
                                    </>
                                ) : (
                                    <span className="text-xs font-semibold bg-stone-200 text-stone-600 px-2 py-1 rounded-full">Descartado</span>
                                )}
                            </div>
                        </div>

                        <div className="text-sm space-y-3">
                             <div className="flex items-center text-xs text-stone-600 bg-stone-50 p-2 rounded-md">
                                <ShedIcon className="h-4 w-4 mr-2" />
                                <span className="font-semibold">Galpão:</span>
                                <span className="ml-1">{shed?.name || 'Não especificado'}</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-stone-600 text-xs uppercase tracking-wider mb-1 mt-2">Cronograma</h3>
                                <div className="text-xs grid grid-cols-3 gap-2">
                                    <p><span className="font-semibold block">Nascimento:</span> {formatDate(flock.birthDate)}</p>
                                    <p><span className="font-semibold block">Chegada:</span> {formatDate(flock.arrivalDate)}</p>
                                    <p><span className="font-semibold block">Descarte:</span> {formatDate(flock.plannedDisposalDate)}</p>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold text-stone-600 text-xs uppercase tracking-wider mb-1">Status</h3>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <p><span className="font-semibold">Idade:</span> {calculateAge(flock.birthDate).weeks} sem ({calculateAge(flock.birthDate).days} d)</p>
                                    <p><span className="font-semibold">Aves Atuais:</span> {flock.currentHenCount}</p>
                                    <p><span className="font-semibold">Aves Iniciais:</span> {flock.initialHenCount}</p>
                                    <p><span className="font-semibold">Mortalidade:</span> {flock.totalMortality}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t text-sm space-y-2">
                             <h3 className="font-semibold text-stone-600 text-xs uppercase tracking-wider mb-2">Financeiro Detalhado</h3>
                             <div className="flex justify-between">
                                <p className="font-semibold">Custo / Ovo:</p> <span className="font-medium text-red-600">{flock.costPerEgg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <p className="font-semibold">Lucro / Ovo:</p> <span className="font-medium text-green-600">{flock.profitPerEgg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t text-sm space-y-2 flex-grow flex flex-col">
                            <h3 className="font-semibold text-stone-600 text-xs uppercase tracking-wider mb-2">Tarefas Agendadas</h3>
                            <div className="space-y-2 overflow-y-auto max-h-32 pr-2 flex-grow">
                                {tasks.length > 0 ? tasks.map(task => (
                                    <div key={task.id} className={`flex flex-col text-xs p-1.5 rounded border border-transparent ${task.isCompleted ? 'bg-stone-100' : 'hover:bg-stone-50 hover:border-stone-100'}`}>
                                        <div className="flex items-start justify-between w-full">
                                            <div className="flex items-start">
                                                <input type="checkbox" checked={task.isCompleted} onChange={() => {}} className="mt-0.5 h-4 w-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500 mr-2 flex-shrink-0" />
                                                <div className={task.isCompleted ? 'line-through text-stone-500' : ''}>
                                                    <p className="font-medium">{task.taskType}</p>
                                                    <p className="text-stone-500">{formatDate(task.dueDate)}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteTask(task.id)} className="p-1 text-stone-400 hover:text-red-600 transition-colors ml-1" aria-label="Deletar Tarefa"><TrashIcon /></button>
                                        </div>
                                        {task.notes && (
                                            <div className={`mt-1 pl-6 italic ${task.isCompleted ? 'text-stone-400' : 'text-stone-500'}`}>
                                                {task.notes}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-xs text-stone-400 text-center py-2">Nenhuma tarefa agendada.</p>
                                )}
                            </div>
                            {flock.status === 'Ativo' && (
                                <button onClick={() => handleOpenTaskModal(flock.id)} className="mt-auto w-full text-center mt-2 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                                    Adicionar Tarefa
                                </button>
                            )}
                        </div>

                    </div>
                )})}
            </div>

            {isFlockModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-4">{flockToEdit ? 'Editar Lote' : 'Novo Lote'}</h2>
                            <FlockForm onClose={handleCloseModals} flockToEdit={flockToEdit} />
                        </div>
                    </div>
                </div>
            )}

            {taskModalState.isOpen && taskModalState.flockId && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-4">Agendar Nova Tarefa</h2>
                            <TaskForm flockId={taskModalState.flockId} onClose={handleCloseModals} />
                        </div>
                    </div>
                </div>
            )}

            {/* Diálogo de Confirmação de Exclusão */}
            {deleteDialog.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                                <TrashIcon className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-stone-800 text-center mb-2">
                                Confirmar Exclusão do Lote
                            </h3>
                            <p className="text-stone-600 text-center mb-6">
                                Tem certeza que deseja descartar o lote <strong>"{deleteDialog.flockName}"</strong>?
                            </p>
                            <p className="text-sm text-stone-500 text-center mb-6">
                                Esta ação irá marcar o lote como descartado e tornará o galpão disponível para novos lotes.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDispose}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlockManagement;
