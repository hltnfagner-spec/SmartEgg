import { FC, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { ArrowUpIcon, ArrowDownIcon } from './icons';

const Transactions: FC = () => {
  const { expenses, sales, navigate } = useFarm();

  const allTransactions = useMemo(() => {
    const combined = [
      ...sales.map(s => ({
        id: s.id,
        date: s.date,
        description: `Venda (${s.quantity} ${s.productType || 'Ovos'})`,
        amount: s.totalAmount,
        type: 'sale' as const,
      })),
      ...expenses.map(e => ({
        id: e.id,
        date: e.date,
        description: e.description ? `${e.category} - ${e.description}` : e.category,
        amount: -e.amount,
        type: 'expense' as const,
      })),
    ];
    
    return combined.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        
        const timestampA = parseInt(a.id.split('-')[1] || '0');
        const timestampB = parseInt(b.id.split('-')[1] || '0');
        return timestampB - timestampA;
    });
  }, [sales, expenses]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Últimas Transações</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <ul className="divide-y divide-slate-100">
            {allTransactions.length > 0 ? allTransactions.map(tx => (
              <li key={tx.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${tx.type === 'sale' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.type === 'sale' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate" title={tx.description}>{tx.description}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })}</p>
                  </div>
                </div>
                <p className={`font-semibold text-sm whitespace-nowrap pl-2 ${tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'sale' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </li>
            )) : (
              <li className="text-center py-10 text-slate-500">Nenhuma transação recente.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
