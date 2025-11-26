
import { useState, useMemo, FC, ChangeEvent, FormEvent, FocusEvent } from 'react';
import { useFarm } from '../context/FarmContext';
import { Shed } from '../types';
import { EditIcon, ShedIcon, TrashIcon } from './icons';

interface ShedFormProps {
    onClose: () => void;
    shedToEdit?: Shed | null;
}

const ShedForm: FC<ShedFormProps> = ({ onClose, shedToEdit }) => {
    const { addShed, updateShed } = useFarm();
    
    // Usando 'any' para permitir string vazia
    const [formData, setFormData] = useState<any>({
        name: shedToEdit?.name || '',
        capacity: shedToEdit?.capacity || 0,
        notes: shedToEdit?.notes || '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let val: string | number = value;

        if (name === 'capacity') {
            val = value === '' ? '' : parseInt(value, 10);
        }

        setFormData(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setFormData(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const cap = Number(formData.capacity);

        if (cap <= 0 || !formData.name) {
            alert("Nome e capacidade são obrigatórios.");
            return;
        }

        const payload = {
            ...formData,
            capacity: cap
        };

        if (shedToEdit) {
            updateShed(shedToEdit.id, payload);
        } else {
            addShed(payload);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-stone-600">Nome do Galpão</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-stone-600">Capacidade de Aves</label>
                    <input type="number" id="capacity" name="capacity" min="0" value={formData.capacity} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-stone-600">Observações</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">{shedToEdit ? 'Salvar Alterações' : 'Adicionar Galpão'}</button>
            </div>
        </form>
    );
};

const ShedManagement: FC = () => {
    const { sheds, flocks, deleteShed } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shedToEdit, setShedToEdit] = useState<Shed | null>(null);

    const handleOpenAddModal = () => {
        setShedToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (shed: Shed) => {
        setShedToEdit(shed);
        setIsModalOpen(true);
    };

    const handleDeleteShed = (shed: Shed) => {
        if (shed.isOccupied) {
            alert('Não é possível excluir um galpão ocupado. Primeiro remova ou descarte o lote associado.');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o galpão "${shed.name}"? Esta ação não pode ser desfeita.`)) {
            deleteShed(shed.id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setShedToEdit(null);
    };

    const shedStatus = useMemo(() => {
        const activeFlocks = flocks.filter(f => f.status === 'Ativo');
        return sheds.map(shed => {
            const occupyingFlock = activeFlocks.find(flock => flock.shedId === shed.id);
            return {
                ...shed,
                isOccupied: !!occupyingFlock,
                occupyingFlockName: occupyingFlock?.name,
            };
        });
    }, [sheds, flocks]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Gerenciamento de Galpões</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                    Adicionar Galpão
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shedStatus.map(shed => (
                    <div key={shed.id} className="bg-white p-5 rounded-xl shadow-md flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-amber-100 rounded-full"><ShedIcon className="h-6 w-6 text-amber-600" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-stone-800">{shed.name}</h2>
                                    <p className="text-sm text-stone-500">Capacidade: {shed.capacity} aves</p>
                                </div>
                            </div>
                            <div className="flex space-x-1">
                                <button 
                                    onClick={() => handleOpenEditModal(shed)} 
                                    className="p-1 text-stone-500 hover:text-amber-600 transition-colors" 
                                    aria-label="Editar Galpão"
                                >
                                    <EditIcon />
                                </button>
                                <button 
                                    onClick={() => handleDeleteShed(shed)} 
                                    className={`p-1 transition-colors ${
                                        shed.isOccupied 
                                            ? 'text-stone-300 cursor-not-allowed' 
                                            : 'text-stone-500 hover:text-red-600'
                                    }`} 
                                    aria-label="Excluir Galpão"
                                    disabled={shed.isOccupied}
                                    title={shed.isOccupied ? 'Galpão ocupado - não pode ser excluído' : 'Excluir Galpão'}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-grow space-y-2 text-sm">
                            <div className={`p-2 rounded-md text-center font-semibold ${shed.isOccupied ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {shed.isOccupied ? `Ocupado (Lote ${shed.occupyingFlockName})` : 'Disponível'}
                            </div>
                            {shed.notes && (
                                <p className="text-stone-600 pt-2 text-xs border-t mt-2">
                                    <span className="font-semibold">Notas:</span> {shed.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-4">{shedToEdit ? 'Editar Galpão' : 'Novo Galpão'}</h2>
                            <ShedForm onClose={handleCloseModal} shedToEdit={shedToEdit} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShedManagement;
