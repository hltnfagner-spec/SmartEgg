
import { useState, useEffect, FC, ChangeEvent, FormEvent, FocusEvent, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { Expense, ExpenseCategory } from '../types';
import { EditIcon } from './icons';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Ração', 'Medicamentos', 'Mão de Obra', 'Manutenção', 'Outros'];

const AddExpenseForm: FC<{onClose: () => void; expenseToEdit?: Expense | null}> = ({ onClose, expenseToEdit }) => {
    const { addExpense, updateExpense, flocks } = useFarm();
    // Usando 'any' para permitir string vazia no estado
    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        flockId: flocks.length > 0 ? flocks[0].id : '',
        category: 'Ração',
        description: '',
        amount: 0,
    });

    useEffect(() => {
        if (expenseToEdit) {
            setFormData({
                ...expenseToEdit,
                date: new Date(expenseToEdit.date).toISOString().split('T')[0],
            });
        }
    }, [expenseToEdit]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let val: string | number = value;
        if (name === 'amount') {
             val = value === '' ? '' : parseFloat(value);
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
        if (!formData.flockId) {
            alert("Por favor, selecione um lote.");
            return;
        }
        const payload = {
            ...formData,
            amount: Number(formData.amount) || 0,
            date: new Date(formData.date).toISOString()
        };

        if (expenseToEdit) {
            updateExpense(expenseToEdit.id, payload);
        } else {
            addExpense(payload);
        }
        
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-stone-600">Data</label>
                    <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                    <label htmlFor="flockId" className="block text-sm font-medium text-stone-600">Lote</label>
                    <select id="flockId" name="flockId" value={formData.flockId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                        <option value="">Selecione um lote</option>
                        {flocks.map(flock => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-stone-600">Categoria</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-stone-600">Valor (R$)</label>
                    <input type="number" step="0.01" id="amount" name="amount" min="0" value={formData.amount} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-stone-600">Descrição</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">{expenseToEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</button>
            </div>
        </form>
    );
};

const Expenses: FC = () => {
    const { expenses, getFlockById, flocks } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

    // Filtros Padronizados
    const [periodType, setPeriodType] = useState<'diario' | 'semanal' | 'mensal' | 'personalizado'>('mensal');
    const [dateFilter, setDateFilter] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
    });
    const [selectedFlock, setSelectedFlock] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Inicializar com filtro mensal ao carregar
    useEffect(() => {
        updateDatesByPeriod('mensal');
    }, []);

    // Função para atualizar datas baseada no período
    const updateDatesByPeriod = (period: 'diario' | 'semanal' | 'mensal' | 'personalizado') => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'diario':
                start = today;
                end = today;
                break;
            case 'semanal':
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay()); // Domingo
                end = new Date(start);
                end.setDate(start.getDate() + 6); // Sábado
                break;
            case 'mensal':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'personalizado':
                setPeriodType(period);
                return;
        }

        const formatDate = (d: Date) => {
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d.getTime() - offset)).toISOString().split('T')[0];
        };

        setDateFilter({
            start: formatDate(start),
            end: formatDate(end)
        });
        setPeriodType(period);
    };

    // Filtragem de despesas
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            // Filtro de Data
            if (dateFilter.start) {
                if (new Date(expense.date) < new Date(dateFilter.start)) return false;
            }
            if (dateFilter.end) {
                const endDate = new Date(dateFilter.end);
                endDate.setHours(23, 59, 59, 999);
                if (new Date(expense.date) > endDate) return false;
            }

            // Filtro de Lote
            if (selectedFlock && expense.flockId !== selectedFlock) {
                return false;
            }

            // Filtro de Categoria
            if (selectedCategory && expense.category !== selectedCategory) {
                return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, dateFilter, selectedFlock, selectedCategory]);

    // Estatísticas (KPIs)
    const stats = useMemo(() => {
        const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const count = filteredExpenses.length;
        
        // Calcular categoria com maior gasto
        const categoryTotals: Record<string, number> = {};
        filteredExpenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        let topCategory = '-';
        let topCategoryAmount = 0;
        
        Object.entries(categoryTotals).forEach(([cat, amount]) => {
            if (amount > topCategoryAmount) {
                topCategoryAmount = amount;
                topCategory = cat;
            }
        });

        return {
            totalAmount,
            count,
            topCategory,
            topCategoryAmount
        };
    }, [filteredExpenses]);

    const handleOpenAddModal = () => {
        setExpenseToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setExpenseToEdit(null);
    };

    return (
        <div className="space-y-6">
            {/* Header Padronizado */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💸</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-stone-800">Despesas</h1>
                        <p className="text-sm text-stone-500">Controle de custos e gastos</p>
                    </div>
                </div>
                <button 
                    onClick={handleOpenAddModal} 
                    className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                    <span className="text-lg">+</span>
                    Adicionar Despesa
                </button>
            </div>

            {/* Filtros Padronizados */}
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
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">Data Final</label>
                                <input 
                                    type="date" 
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="">Todos os Lotes</option>
                            {flocks.map(flock => (
                                <option key={flock.id} value={flock.id}>{flock.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-1">Categoria</label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="">Todas as Categorias</option>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Cards de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total de Despesas */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">📉</span>
                                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">Total Despesas</h3>
                            </div>
                            <p className="text-3xl font-bold text-red-700">
                                {stats.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-sm text-red-700 mt-1">no período selecionado</p>
                        </div>
                    </div>
                </div>

                {/* Quantidade de Lançamentos */}
                <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">📝</span>
                                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">Lançamentos</h3>
                            </div>
                            <p className="text-3xl font-bold text-stone-700">{stats.count}</p>
                            <p className="text-sm text-stone-600 mt-1">registros encontrados</p>
                        </div>
                    </div>
                </div>

                {/* Maior Gasto */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🔥</span>
                                <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide">Maior Gasto</h3>
                            </div>
                            <p className="text-xl font-bold text-orange-700 truncate max-w-[200px]" title={stats.topCategory}>
                                {stats.topCategory}
                            </p>
                            <p className="text-sm text-orange-800 font-medium mt-1">
                                {stats.topCategoryAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 bg-stone-50 border-b border-stone-200">
                    <span className="text-lg">🧾</span>
                    <h3 className="text-lg font-semibold text-stone-800">Histórico de Despesas</h3>
                    <span className="text-sm text-stone-500 ml-auto">{filteredExpenses.length} registros encontrados</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[800px]">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Lote</th>
                                <th scope="col" className="px-6 py-3">Categoria</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                                <tr key={expense.id} className="bg-white border-b hover:bg-stone-50 transition-colors group">
                                    <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td className="px-6 py-4 font-medium text-stone-900">{getFlockById(expense.flockId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">{expense.category}</span>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-xs">{expense.description}</td>
                                    <td className="px-6 py-4 text-right font-medium text-red-600">
                                        {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleOpenEditModal(expense)} className="p-2 text-stone-500 hover:text-amber-600 transition-colors" aria-label="Editar Despesa">
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-stone-500">Nenhuma despesa registrada no período.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-6">{expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}</h2>
                            <AddExpenseForm onClose={handleCloseModal} expenseToEdit={expenseToEdit} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
