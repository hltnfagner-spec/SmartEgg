
import { useState, useEffect, FC, ChangeEvent, FormEvent, FocusEvent } from 'react';
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
    const { expenses, getFlockById } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Despesas</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                    Adicionar Despesa
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[800px]">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Lote</th>
                                <th scope="col" className="px-6 py-3">Categoria</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                                <th scope="col" className="px-6 py-3 text-center sticky right-0 bg-stone-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map(expense => (
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
                                    <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-stone-50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] z-10">
                                        <button onClick={() => handleOpenEditModal(expense)} className="p-2 text-stone-500 hover:text-amber-600 transition-colors" aria-label="Editar Despesa">
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-stone-500">Nenhuma despesa registrada ainda.</td>
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
