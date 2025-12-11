
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


// Componente de Tarefas com Filtro
interface TasksCardProps {
    flockId: string;
    getTasksByFlockId: (flockId: string) => FlockTask[];
    deleteTask: (taskId: string) => void;
}

const TasksCard: FC<TasksCardProps> = ({ flockId, getTasksByFlockId, deleteTask }) => {
    const [taskFilter, setTaskFilter] = useState<'pendentes' | 'concluidas'>('pendentes');
    
    const flockTasks = getTasksByFlockId(flockId);
    const pendingTasks = flockTasks.filter(t => !t.isCompleted);
    const completedTasks = flockTasks.filter(t => t.isCompleted);
    const displayTasks = taskFilter === 'pendentes' ? pendingTasks : completedTasks;
    
    const formatTaskDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    return (
        <div className="bg-stone-50 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">📋 Tarefas</h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => setTaskFilter('pendentes')}
                        className={`text-xs px-2 py-1 rounded-md transition-all ${
                            taskFilter === 'pendentes'
                                ? 'bg-amber-500 text-white'
                                : 'bg-white text-stone-500 hover:bg-amber-50'
                        }`}
                    >
                        Pendentes ({pendingTasks.length})
                    </button>
                    <button
                        onClick={() => setTaskFilter('concluidas')}
                        className={`text-xs px-2 py-1 rounded-md transition-all ${
                            taskFilter === 'concluidas'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-stone-500 hover:bg-green-50'
                        }`}
                    >
                        Concluídas ({completedTasks.length})
                    </button>
                </div>
            </div>
            {displayTasks.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {displayTasks.map(task => (
                        <div key={task.id} className={`p-2 rounded-lg ${task.isCompleted ? 'bg-stone-100' : 'bg-white border border-stone-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.isCompleted ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                    <div>
                                        <p className={`text-sm font-medium ${task.isCompleted ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{task.taskType}</p>
                                        <p className="text-xs text-stone-500">{formatTaskDate(task.dueDate)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteTask(task.id)} 
                                    className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                                    aria-label="Remover tarefa"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                            {task.notes && (
                                <p className={`text-xs mt-1 ml-4 pl-2 border-l-2 ${task.isCompleted ? 'text-stone-400 border-stone-300' : 'text-stone-600 border-amber-300'}`}>
                                    {task.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-stone-400 text-center py-2">
                    {taskFilter === 'pendentes' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa concluída'}
                </p>
            )}
        </div>
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
    const { flocks, sheds, tasks, addFlock, updateFlock, disposeFlock, deleteFlock, addTask, deleteTask, getHensCountOnDate, getRecordsByFlockId, getTasksByFlockId } = useFarm();
    const [isFlockModalOpen, setIsFlockModalOpen] = useState(false);
    const [flockToEdit, setFlockToEdit] = useState<Flock | null>(null);
    const [taskModalState, setTaskModalState] = useState<{isOpen: boolean, flockId: string | null}>({isOpen: false, flockId: null});
    const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, flockId: string | null, flockName: string}>({isOpen: false, flockId: null, flockName: ''});
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'descartados'>('ativos');

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
            // Calcula total de ovos produzidos
            const totalEggsProduced = records.reduce((sum, r) => sum + (r.eggsCollected || 0), 0);
            // Calcula taxa de mortalidade
            const mortalityRate = flock.initialHenCount > 0 
                ? ((totalMortality / flock.initialHenCount) * 100).toFixed(1) 
                : '0.0';
            // Calcula produção média diária (últimos 7 dias)
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const recentRecords = records.filter(r => {
                const recordDate = new Date(r.date);
                return recordDate >= sevenDaysAgo && recordDate <= today;
            });
            const recentEggs = recentRecords.reduce((sum, r) => sum + (r.eggsCollected || 0), 0);
            const daysWithRecords = recentRecords.length;
            const avgDailyProduction = daysWithRecords > 0 ? Math.round(recentEggs / daysWithRecords) : 0;
            // Calcula porcentagem de postura
            const expectedProduction = currentHenCount * daysWithRecords;
            const layingRate = expectedProduction > 0 
                ? Math.min(((recentEggs / expectedProduction) * 100), 100).toFixed(1)
                : '0.0';

            return {
                ...flock,
                totalExpenses: 0,
                totalRevenue: 0,
                totalMortality,
                currentHenCount,
                totalEggsProduced,
                mortalityRate,
                avgDailyProduction,
                layingRate,
                daysWithRecords,
                costPerEgg: 0,
                profitPerEgg: 0,
            };
        }).sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'Ativo' ? -1 : 1;
        });
    }, [flocks, getHensCountOnDate, getRecordsByFlockId]);

    // Filtrar lotes por status
    const filteredFlockData = useMemo(() => {
        if (statusFilter === 'todos') return flockData;
        if (statusFilter === 'ativos') return flockData.filter(f => f.status === 'Ativo');
        return flockData.filter(f => f.status === 'Descartado');
    }, [flockData, statusFilter]);

    // Contadores para os badges
    const activeFlocksCount = flockData.filter(f => f.status === 'Ativo').length;
    const discardedFlocksCount = flockData.filter(f => f.status === 'Descartado').length;

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-stone-800">Gerenciamento de Lotes</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                    + Adicionar Lote
                </button>
            </div>

            {/* Filtros de Status */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setStatusFilter('todos')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        statusFilter === 'todos'
                            ? 'bg-stone-800 text-white shadow-md'
                            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                >
                    Todos
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        statusFilter === 'todos' ? 'bg-white/20' : 'bg-stone-100'
                    }`}>
                        {flockData.length}
                    </span>
                </button>
                <button
                    onClick={() => setStatusFilter('ativos')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        statusFilter === 'ativos'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white text-stone-600 hover:bg-green-50 border border-stone-200'
                    }`}
                >
                    Ativos
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        statusFilter === 'ativos' ? 'bg-white/20' : 'bg-green-100 text-green-700'
                    }`}>
                        {activeFlocksCount}
                    </span>
                </button>
                <button
                    onClick={() => setStatusFilter('descartados')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        statusFilter === 'descartados'
                            ? 'bg-stone-500 text-white shadow-md'
                            : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                >
                    Descartados
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        statusFilter === 'descartados' ? 'bg-white/20' : 'bg-stone-200'
                    }`}>
                        {discardedFlocksCount}
                    </span>
                </button>
            </div>

            {/* Lista de Lotes */}
            {filteredFlockData.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <div className="text-4xl mb-4">🐔</div>
                    <h3 className="text-lg font-semibold text-stone-700 mb-2">
                        {statusFilter === 'todos' ? 'Nenhum lote cadastrado' : 
                         statusFilter === 'ativos' ? 'Nenhum lote ativo' : 
                         'Nenhum lote descartado'}
                    </h3>
                    <p className="text-stone-500 text-sm">
                        {statusFilter === 'todos' ? 'Clique em "Adicionar Lote" para começar.' : 
                         statusFilter === 'ativos' ? 'Todos os lotes foram descartados ou não há lotes cadastrados.' : 
                         'Nenhum lote foi descartado ainda.'}
                    </p>
                </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFlockData.map(flock => {
                    const age = calculateAge(flock.birthDate);
                    const isActive = flock.status === 'Ativo';
                    
                    return (
                    <div key={flock.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${!isActive ? 'opacity-70' : ''}`}>
                        {/* Header do Card */}
                        <div className={`px-6 py-4 ${isActive ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-stone-400 to-stone-500'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{flock.name}</h2>
                                    <p className="text-white/80 text-sm">{flock.breed}</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                    {isActive ? (
                                        <>
                                            <button onClick={() => handleOpenEditModal(flock)} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all" aria-label="Editar Lote">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDispose(flock.id, flock.name)} className="p-2 text-white/80 hover:text-white hover:bg-red-500/50 rounded-lg transition-all" aria-label="Descartar Lote">
                                                <TrashIcon />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-xs font-semibold bg-white/20 text-white px-3 py-1 rounded-full">Descartado</span>
                                    )}
                                </div>
                            </div>
                            {/* Badge de Status */}
                            <div className="mt-3 flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-400/30 text-white' : 'bg-white/20 text-white'}`}>
                                    {isActive ? '● Ativo' : '○ Inativo'}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
                                    {age.weeks} semanas
                                </span>
                            </div>
                        </div>

                        {/* Cards de Métricas Principais */}
                        <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50">
                            {/* Aves Atuais */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">🐔</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${flock.currentHenCount === flock.initialHenCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {flock.currentHenCount === flock.initialHenCount ? '100%' : `${((flock.currentHenCount / flock.initialHenCount) * 100).toFixed(0)}%`}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-stone-800 mt-1">{flock.currentHenCount.toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-stone-500">Aves Atuais</p>
                                <p className="text-xs text-stone-400 mt-1">de {flock.initialHenCount.toLocaleString('pt-BR')} iniciais</p>
                            </div>

                            {/* Taxa de Postura */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">🥚</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        parseFloat(flock.layingRate) >= 80 ? 'bg-green-100 text-green-700' : 
                                        parseFloat(flock.layingRate) >= 50 ? 'bg-amber-100 text-amber-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {flock.daysWithRecords > 0 ? `${flock.daysWithRecords}d` : 'Sem dados'}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-stone-800 mt-1">{flock.layingRate}%</p>
                                <p className="text-xs text-stone-500">Taxa de Postura</p>
                                <p className="text-xs text-stone-400 mt-1">média {flock.avgDailyProduction} ovos/dia</p>
                            </div>

                            {/* Mortalidade */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">📉</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        parseFloat(flock.mortalityRate) <= 2 ? 'bg-green-100 text-green-700' : 
                                        parseFloat(flock.mortalityRate) <= 5 ? 'bg-amber-100 text-amber-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {parseFloat(flock.mortalityRate) <= 2 ? 'Normal' : parseFloat(flock.mortalityRate) <= 5 ? 'Atenção' : 'Crítico'}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-stone-800 mt-1">{flock.totalMortality}</p>
                                <p className="text-xs text-stone-500">Mortalidade Total</p>
                                <p className="text-xs text-stone-400 mt-1">{flock.mortalityRate}% do lote</p>
                            </div>

                            {/* Produção Total */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">📦</span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        Total
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-stone-800 mt-1">{flock.totalEggsProduced.toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-stone-500">Ovos Produzidos</p>
                                <p className="text-xs text-stone-400 mt-1">desde o início</p>
                            </div>
                        </div>

                        {/* Informações Adicionais */}
                        <div className="px-4 pb-4">
                            {/* Cronograma */}
                            <div className="bg-stone-50 rounded-xl p-4 mb-3">
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">📅 Cronograma</h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white p-2 rounded-lg">
                                        <p className="text-xs text-stone-500">Nascimento</p>
                                        <p className="text-sm font-semibold text-stone-700">{formatDate(flock.birthDate)}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg">
                                        <p className="text-xs text-stone-500">Chegada</p>
                                        <p className="text-sm font-semibold text-stone-700">{formatDate(flock.arrivalDate)}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg">
                                        <p className="text-xs text-stone-500">Descarte</p>
                                        <p className="text-sm font-semibold text-stone-700">{formatDate(flock.plannedDisposalDate)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Idade Detalhada */}
                            <div className="flex items-center justify-between bg-amber-50 rounded-xl p-3 mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">⏱️</span>
                                    <span className="text-sm font-medium text-amber-800">Idade do Lote</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-amber-700">{age.weeks}</span>
                                    <span className="text-sm text-amber-600"> semanas</span>
                                    <span className="text-xs text-amber-500 block">({age.days} dias)</span>
                                </div>
                            </div>

                            {/* Tarefas Agendadas */}
                            <TasksCard flockId={flock.id} getTasksByFlockId={getTasksByFlockId} deleteTask={deleteTask} />

                            {/* Botões de Ação */}
                            {isActive && (
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => handleOpenTaskModal(flock.id)} 
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors"
                                    >
                                        + Adicionar Tarefa
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )})}
            </div>
            )}

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
