import { useState, FC, FormEvent, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { InventoryItem, InventoryCategory, UnitType } from '../types';
import { EditIcon, TrashIcon, InventoryIcon, EggIcon } from './icons';
import NotificationBell from './NotificationBell';
import { ConfirmationModal } from './ConfirmationModal';

const CATEGORIES: InventoryCategory[] = ['Ração', 'Medicamento', 'Embalagem', 'Produto Final', 'Outro'];
const UNITS: UnitType[] = ['kg', 'g', 'L', 'ml', 'unidade', 'saco'];

const Inventory: FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        category: 'Ração',
        quantity: 0,
        unit: 'kg',
        minThreshold: 0,
        costPerUnit: 0
    });

    const handleOpenAddModal = () => {
        setItemToEdit(null);
        setFormData({
            name: '',
            category: 'Ração',
            quantity: 0,
            unit: 'kg',
            minThreshold: 0,
            costPerUnit: 0
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: InventoryItem) => {
        setItemToEdit(item);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name!,
            category: formData.category as InventoryCategory,
            quantity: Number(formData.quantity),
            unit: formData.unit as UnitType,
            minThreshold: Number(formData.minThreshold),
            costPerUnit: Number(formData.costPerUnit)
        };

        if (itemToEdit) {
            updateInventoryItem(itemToEdit.id, payload);
        } else {
            addInventoryItem(payload);
        }
        setIsModalOpen(false);
    };
    
    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteInventoryItem(deleteId);
            setDeleteId(null);
        }
    };

    // Calcula o valor total em estoque
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.minThreshold);

    // Encontrar estoque de ovos para destaque
    const eggStockItem = useMemo(() => {
        return inventory.find(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
    }, [inventory]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
                <div className="flex items-center space-x-4">
                    <NotificationBell />
                </div>
            </div>

            {/* DESTAQUE DE ESTOQUE DE OVOS */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white mb-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <EggIcon className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-amber-100 font-medium text-sm uppercase tracking-wide">Estoque de Ovos Disponível</h2>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-bold">{eggStockItem ? eggStockItem.quantity.toLocaleString() : '0'}</span>
                                <span className="text-lg text-amber-100/80">ovos</span>
                            </div>
                        </div>
                    </div>
                    
                    {eggStockItem && (
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/20 min-w-[200px]">
                            <p className="text-xs text-amber-100 uppercase font-semibold mb-1">Custo Estimado com Ração</p>
                            <p className="text-2xl font-bold">{(eggStockItem.quantity * eggStockItem.costPerUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <p className="text-xs text-amber-100/70 mt-1">Custo de produção do ovo, baseado no consumo de ração: {eggStockItem.costPerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/un</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 rounded-lg bg-blue-100 text-blue-600 mr-4">
                        <InventoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Itens Cadastrados</p>
                        <p className="text-2xl font-bold text-slate-800">{inventory.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 rounded-lg bg-green-100 text-green-600 mr-4">
                        <span className="text-xl font-bold">R$</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Valor Total Estoque</p>
                        <p className="text-2xl font-bold text-slate-800">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className={`p-4 rounded-lg mr-4 ${lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        <span className="text-xl font-bold">!</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Alertas de Estoque</p>
                        <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockItems.length}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <h2 className="text-lg font-semibold text-slate-800">Itens em Estoque</h2>
                <button 
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition-colors flex items-center"
                >
                    + Novo Item
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[800px]">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">Nome</th>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3 text-right">Qtd. Atual</th>
                                <th className="px-6 py-3 text-right">Mínimo</th>
                                <th className="px-6 py-3 text-right">Custo Unit.</th>
                                <th className="px-6 py-3 text-right">Valor Total</th>
                                <th className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.length > 0 ? inventory.map(item => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.category === 'Produto Final' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${item.quantity <= item.minThreshold ? 'text-red-600' : 'text-slate-700'}`}>
                                        {item.quantity.toLocaleString('pt-BR')} {item.unit}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-400">{item.minThreshold} {item.unit}</td>
                                    <td className="px-6 py-4 text-right">{item.costPerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-medium">{(item.quantity * item.costPerUnit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-6 py-4 text-center space-x-2">
                                        <button 
                                            type="button"
                                            onClick={(e) => {e.preventDefault(); e.stopPropagation(); handleOpenEditModal(item); }}
                                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors relative z-30"
                                            title="Editar"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteClick(item.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors relative z-30"
                                            title="Excluir"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-slate-500">Nenhum item cadastrado no estoque.</td>
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
                title="Excluir Item do Estoque"
                message="Tem certeza que deseja excluir este item permanentemente? Essa ação não pode ser desfeita."
                confirmText="Excluir Item"
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">{itemToEdit ? 'Editar Item' : 'Novo Item de Estoque'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as InventoryCategory})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as UnitType})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Atual</label>
                                    <input type="number" step="0.01" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.valueAsNumber})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo (Alerta)</label>
                                    <input type="number" step="0.01" required value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: e.target.valueAsNumber})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Custo por Unidade (R$)</label>
                                <input type="number" step="0.01" required value={formData.costPerUnit} onChange={e => setFormData({...formData, costPerUnit: e.target.valueAsNumber})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;