import { useState, FC, FormEvent, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { InventoryItem, InventoryCategory, UnitType, EggMovement, EggMovementReason } from '../types';
import { EditIcon, TrashIcon, InventoryIcon, EggIcon } from './icons';
import NotificationBell from './NotificationBell';
import { ConfirmationModal } from './ConfirmationModal';

const CATEGORIES: InventoryCategory[] = ['Ração', 'Medicamento', 'Embalagem', 'Outro'];
const UNITS: UnitType[] = ['kg', 'g', 'L', 'ml', 'unidade', 'saco'];

// Helper para formatar data para input date (YYYY-MM-DD)
const toLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

// Labels para os motivos de saída
const REASON_LABELS: Record<EggMovementReason, string> = {
    coleta: 'Coleta',
    venda: 'Venda',
    consumo: 'Consumo',
    doacao: 'Doação',
    marketing: 'Marketing',
    perda: 'Perda/Quebra',
    ajuste: 'Ajuste'
};

const Inventory: FC = () => {
    const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, eggMovements, addEggMovement, records, sales, flocks, getFlockById } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEggOutputModalOpen, setIsEggOutputModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ovos' | 'insumos'>('ovos');
    const [periodFilter, setPeriodFilter] = useState<'diario' | 'semanal' | 'mensal' | 'personalizado'>('mensal');
    const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
    const [customDateStart, setCustomDateStart] = useState(toLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    const [customDateEnd, setCustomDateEnd] = useState(toLocalDateString(new Date()));
    
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        category: 'Ração',
        quantity: 0,
        unit: 'kg',
        minThreshold: 0,
        costPerUnit: 0
    });

    const [eggOutputForm, setEggOutputForm] = useState({
        date: toLocalDateString(new Date()),
        reason: 'consumo' as EggMovementReason,
        quantity: '',
        notes: ''
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

    // Separar itens de ovos e insumos
    const eggStockItem = useMemo(() => {
        return inventory.find(i => i.category === 'Produto Final' && (i.name.toLowerCase().includes('ovos') || i.name.toLowerCase().includes('ovo')));
    }, [inventory]);

    const insumosItems = useMemo(() => {
        return inventory.filter(i => i.category !== 'Produto Final');
    }, [inventory]);

    // Calcula o valor total em estoque de insumos
    const totalInsumosValue = insumosItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
    const lowStockItems = insumosItems.filter(item => item.quantity <= item.minThreshold);

    // Combinar todas as movimentações: coletas (records), vendas e movimentações manuais
    const allMovements = useMemo(() => {
        const movements: EggMovement[] = [];
        
        // 1. Adicionar coletas de ovos (entradas) dos registros diários
        records.forEach(record => {
            if (record.eggsCollected > 0) {
                const flock = getFlockById(record.flockId);
                movements.push({
                    id: `coleta_${record.id}`,
                    date: record.date,
                    type: 'entrada',
                    reason: 'coleta',
                    quantity: record.eggsCollected,
                    balance: 0, // Será recalculado
                    notes: flock ? `Lote: ${flock.name}` : undefined,
                    referenceId: record.id
                });
            }
        });
        
        // 2. Adicionar vendas (saídas)
        sales.forEach(sale => {
            if (sale.quantity > 0) {
                movements.push({
                    id: `venda_${sale.id}`,
                    date: sale.date,
                    type: 'saida',
                    reason: 'venda',
                    quantity: sale.quantity,
                    balance: 0,
                    notes: sale.clientId ? `Venda` : 'Venda avulsa',
                    referenceId: sale.id
                });
            }
        });
        
        // 3. Adicionar movimentações manuais
        if (eggMovements) {
            movements.push(...eggMovements);
        }
        
        // Ordenar por data (mais recente primeiro)
        movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Recalcular saldos (do mais antigo para o mais recente)
        const sortedForBalance = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runningBalance = 0;
        sortedForBalance.forEach(m => {
            if (m.type === 'entrada') {
                runningBalance += m.quantity;
            } else {
                runningBalance -= m.quantity;
            }
            m.balance = Math.max(0, runningBalance);
        });
        
        return movements;
    }, [records, sales, eggMovements, getFlockById]);

    // Filtrar movimentações por período
    const filteredMovements = useMemo(() => {
        const now = new Date();
        const today = toLocalDateString(now);
        
        let filtered = [...allMovements];
        
        if (periodFilter === 'diario') {
            filtered = allMovements.filter(m => toLocalDateString(new Date(m.date)) === today);
        } else if (periodFilter === 'semanal') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = allMovements.filter(m => new Date(m.date) >= weekAgo);
        } else if (periodFilter === 'mensal') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = allMovements.filter(m => new Date(m.date) >= monthAgo);
        } else if (periodFilter === 'personalizado') {
            const startDate = new Date(customDateStart + 'T00:00:00');
            const endDate = new Date(customDateEnd + 'T23:59:59');
            filtered = allMovements.filter(m => {
                const movDate = new Date(m.date);
                return movDate >= startDate && movDate <= endDate;
            });
        }
        
        // Filtrar por tipo (entrada/saída)
        if (typeFilter === 'entrada') {
            filtered = filtered.filter(m => m.type === 'entrada');
        } else if (typeFilter === 'saida') {
            filtered = filtered.filter(m => m.type === 'saida');
        }
        
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allMovements, periodFilter, customDateStart, customDateEnd, typeFilter]);

    // Handler para registrar saída de ovos
    const handleEggOutputSubmit = (e: FormEvent) => {
        e.preventDefault();
        const qty = Number(eggOutputForm.quantity);
        if (qty <= 0) return;
        
        addEggMovement({
            date: eggOutputForm.date, // Mantém formato YYYY-MM-DD
            type: 'saida',
            reason: eggOutputForm.reason,
            quantity: qty,
            notes: eggOutputForm.notes || undefined
        });
        
        setEggOutputForm({
            date: toLocalDateString(new Date()),
            reason: 'consumo',
            quantity: '',
            notes: ''
        });
        setIsEggOutputModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
                <div className="flex items-center space-x-4">
                    <NotificationBell />
                </div>
            </div>

            {/* ABAS */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('ovos')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'ovos' 
                            ? 'bg-white text-amber-600 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    🥚 Estoque de Ovos
                </button>
                <button
                    onClick={() => setActiveTab('insumos')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'insumos' 
                            ? 'bg-white text-amber-600 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-800'
                    }`}
                >
                    📦 Estoque de Insumos
                </button>
            </div>

            {/* ========== SEÇÃO DE OVOS ========== */}
            {activeTab === 'ovos' && (
                <>
                    {/* Card de Saldo */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                                    <EggIcon className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-amber-100 font-medium text-sm uppercase tracking-wide">Saldo Atual de Ovos</h2>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl md:text-5xl font-bold">{eggStockItem ? eggStockItem.quantity.toLocaleString() : '0'}</span>
                                        <span className="text-lg text-amber-100/80">ovos</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    {/* Card de Custo de Produção */}
                    {eggStockItem && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <div>
                                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Custo de Produção (baseado no consumo de ração)</h3>
                                <p className="text-3xl font-bold text-slate-800 mt-1">
                                    {eggStockItem.costPerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    <span className="text-sm font-normal text-slate-500"> / ovo</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Botão Registrar Saída */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsEggOutputModalOpen(true)}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition"
                        >
                            + Registrar Saída Manual
                        </button>
                    </div>

                    {/* Filtros de Período */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Filtros de Movimentação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Período</label>
                                <select 
                                    value={periodFilter}
                                    onChange={e => setPeriodFilter(e.target.value as typeof periodFilter)}
                                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="mensal">Mensal</option>
                                    <option value="semanal">Semanal</option>
                                    <option value="diario">Diário</option>
                                    <option value="personalizado">Personalizado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setTypeFilter('todos')}
                                        className={`flex-1 px-3 py-2.5 rounded-l-xl text-sm font-medium transition ${
                                            typeFilter === 'todos' 
                                                ? 'bg-slate-800 text-white' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('entrada')}
                                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition ${
                                            typeFilter === 'entrada' 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Entradas
                                    </button>
                                    <button
                                        onClick={() => setTypeFilter('saida')}
                                        className={`flex-1 px-3 py-2.5 rounded-r-xl text-sm font-medium transition ${
                                            typeFilter === 'saida' 
                                                ? 'bg-red-600 text-white' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Saídas
                                    </button>
                                </div>
                            </div>
                            {periodFilter === 'personalizado' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                                        <input 
                                            type="date" 
                                            value={customDateStart}
                                            onChange={e => setCustomDateStart(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                                        <input 
                                            type="date" 
                                            value={customDateEnd}
                                            onChange={e => setCustomDateEnd(e.target.value)}
                                            className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tabela de Movimentações */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">Histórico de Movimentações</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-center">Data</th>
                                        <th className="px-6 py-3 text-center">Tipo</th>
                                        <th className="px-6 py-3 text-center">Motivo</th>
                                        <th className="px-6 py-3 text-center">Quantidade</th>
                                        <th className="px-6 py-3 text-center">Saldo</th>
                                        <th className="px-6 py-3 text-center">Observação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMovements.length > 0 ? filteredMovements.map(mov => (
                                        <tr key={mov.id} className="border-b border-slate-50 hover:bg-slate-50">
                                            <td className="px-6 py-3 text-center">
                                                {(() => {
                                                    const dateStr = mov.date.includes('T') ? mov.date.split('T')[0] : mov.date;
                                                    const [year, month, day] = dateStr.split('-');
                                                    return `${day}/${month}/${year}`;
                                                })()}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    mov.type === 'entrada' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {mov.type === 'entrada' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center capitalize">{REASON_LABELS[mov.reason]}</td>
                                            <td className={`px-6 py-3 text-center font-bold ${
                                                mov.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {mov.type === 'entrada' ? '+' : ''}{mov.quantity.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-center font-medium text-slate-700">
                                                {mov.balance.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-center text-slate-500">{mov.notes || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                                Nenhuma movimentação encontrada no período selecionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ========== SEÇÃO DE INSUMOS ========== */}
            {activeTab === 'insumos' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                            <div className="p-4 rounded-lg bg-blue-100 text-blue-600 mr-4">
                                <InventoryIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Itens Cadastrados</p>
                                <p className="text-2xl font-bold text-slate-800">{insumosItems.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                            <div className="p-4 rounded-lg bg-green-100 text-green-600 mr-4">
                                <span className="text-xl font-bold">R$</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Valor Total Estoque</p>
                                <p className="text-2xl font-bold text-slate-800">{totalInsumosValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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

                    <div className="flex justify-between items-center mt-4">
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
                                    {insumosItems.length > 0 ? insumosItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
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
                </>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmationModal 
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Item do Estoque"
                message="Tem certeza que deseja excluir este item permanentemente? Essa ação não pode ser desfeita."
                confirmText="Excluir Item"
            />

            {/* Modal de Novo/Editar Item de Insumo */}
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

            {/* Modal de Saída de Ovos */}
            {isEggOutputModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">📤 Registrar Saída de Ovos</h2>
                        <form onSubmit={handleEggOutputSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={eggOutputForm.date} 
                                    onChange={e => setEggOutputForm({...eggOutputForm, date: e.target.value})} 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo da Saída</label>
                                <select 
                                    value={eggOutputForm.reason} 
                                    onChange={e => setEggOutputForm({...eggOutputForm, reason: e.target.value as EggMovementReason})} 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="consumo">Consumo Próprio</option>
                                    <option value="doacao">Doação</option>
                                    <option value="marketing">Marketing / Amostra</option>
                                    <option value="perda">Perda / Quebra</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    required 
                                    value={eggOutputForm.quantity} 
                                    onChange={e => setEggOutputForm({...eggOutputForm, quantity: e.target.value})} 
                                    placeholder="Ex: 30"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Observação (opcional)</label>
                                <input 
                                    type="text" 
                                    value={eggOutputForm.notes} 
                                    onChange={e => setEggOutputForm({...eggOutputForm, notes: e.target.value})} 
                                    placeholder="Ex: Doação para igreja"
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" 
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsEggOutputModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Registrar Saída</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;