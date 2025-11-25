
import { useState, FC, FormEvent, useEffect } from 'react';
import { UserIcon, EditIcon, TrashIcon, UsersIcon } from './icons';
import StatCard from './StatCard';
import { useFarm } from '../context/FarmContext';
import { Client, DeliveryStatus } from '../types';
import NotificationBell from './NotificationBell';

const Clients: FC = () => {
    const { clients, sales, updateSale, addClient, updateClient, deleteClient, getClientById, viewParams } = useFarm();
    const [activeTab, setActiveTab] = useState<'clients' | 'deliveries'>('clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | 'Todas'>('Todas');

    // Effect to handle navigation parameters (deep linking to tabs)
    useEffect(() => {
        if (viewParams && viewParams.tab === 'deliveries') {
            setActiveTab('deliveries');
            // Opcional: Limpar params para evitar reset ao desmontar/remontar, mas neste contexto simples não é crítico
        }
    }, [viewParams]);

    const [formData, setFormData] = useState<Omit<Client, 'id'>>({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'Varejo',
        notes: ''
    });

    const handleOpenAddModal = () => {
        setClientToEdit(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            type: 'Varejo',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setClientToEdit(client);
        setFormData({
            name: client.name,
            phone: client.phone,
            email: client.email,
            address: client.address,
            type: client.type,
            notes: client.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (clientToEdit) {
            updateClient(clientToEdit.id, formData);
        } else {
            addClient(formData);
        }
        setIsModalOpen(false);
    };
    
    const handleDelete = (clientId: string) => {
        if(window.confirm("Tem certeza que deseja excluir este cliente?")) {
            deleteClient(clientId);
        }
    };

    const handleUpdateDeliveryStatus = (saleId: string, newStatus: DeliveryStatus) => {
        // Precisamos manter os outros dados da venda e apenas atualizar o status
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            // O tipo de Sale exige todos os campos, mas updateSale no context geralmente faz merge
            // Porem para ser seguro com o Typescript, passamos o objeto.
            // Nota: updateSale espera Omit<Sale, 'id' | 'totalAmount'>
            const { id, totalAmount, ...saleData } = sale;
            updateSale(saleId, { ...saleData, deliveryStatus: newStatus });
        }
    };

    // Lógica de Entregas
    const deliveries = sales
        .filter(sale => {
            // Se houver filtro, aplica
            if (deliveryFilter !== 'Todas' && sale.deliveryStatus !== deliveryFilter) return false;
            // Se não tiver status definido, consideramos 'Entregue' para legado, 
            // mas para gestão logística focamos em Pendente/Em Rota geralmente.
            // Vamos mostrar tudo se 'Todas', ordenado por data de entrega.
            return true;
        })
        .map(sale => {
            const client = sale.clientId ? getClientById(sale.clientId) : null;
            return {
                ...sale,
                clientName: client?.name || 'Venda Avulsa',
                clientAddress: sale.deliveryAddress || client?.address || 'Endereço não informado',
                clientPhone: client?.phone || '-'
            };
        })
        .sort((a, b) => {
            // Ordenar por data de entrega (se houver) ou data da venda
            const dateA = new Date(a.deliveryDate || a.date).getTime();
            const dateB = new Date(b.deliveryDate || b.date).getTime();
            return dateB - dateA; // Mais recentes primeiro
        });

    // Stats Calculation
    const pendingDeliveries = sales.filter(s => s.deliveryStatus === 'Pendente').length;
    const inRouteDeliveries = sales.filter(s => s.deliveryStatus === 'Em Rota').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Clientes e Logística</h1>
                <div className="flex items-center space-x-4">
                    <NotificationBell />
                </div>
            </div>
            
            <p className="text-slate-500 -mt-4 mb-6">Gerencie base de clientes e controle o fluxo de entregas.</p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Clientes Ativos" value={clients.length} icon={<UsersIcon />} iconColorClass="bg-blue-100 text-blue-600" />
                <StatCard title="Entregas Pendentes" value={pendingDeliveries} icon={<span className="text-xl">⏳</span>} iconColorClass="bg-yellow-100 text-yellow-600" />
                <StatCard title="Em Rota" value={inRouteDeliveries} icon={<span className="text-xl">🚚</span>} iconColorClass="bg-orange-100 text-orange-600" />
                <StatCard title="Entregues (Total)" value={sales.filter(s => s.deliveryStatus === 'Entregue').length} icon={<span className="text-xl">✅</span>} iconColorClass="bg-green-100 text-green-600" />
            </div>

            {/* Actions & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('clients')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'clients' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/50'}`}
                    >
                        Base de Clientes
                    </button>
                    <button 
                        onClick={() => setActiveTab('deliveries')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'deliveries' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300/50'}`}
                    >
                        Gestão de Entregas
                    </button>
                 </div>
                 
                 {activeTab === 'clients' ? (
                     <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition-colors flex items-center">
                        + Novo Cliente
                     </button>
                 ) : (
                    <select 
                        value={deliveryFilter} 
                        onChange={(e) => setDeliveryFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="Todas">Todas as Entregas</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Em Rota">Em Rota</option>
                        <option value="Entregue">Entregues</option>
                    </select>
                 )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    {activeTab === 'clients' ? (
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Contato</th>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Endereço</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length > 0 ? clients.map(client => (
                                    <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{client.name}</div>
                                            <div className="text-xs text-slate-400">{client.email}</div>
                                        </td>
                                        <td className="px-6 py-4">{client.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.type === 'Atacado' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {client.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 truncate max-w-xs">{client.address}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleOpenEditModal(client)} className="text-slate-400 hover:text-orange-500 transition-colors"><EditIcon /></button>
                                            <button onClick={() => handleDelete(client.id)} className="text-slate-400 hover:text-red-500 transition-colors"><TrashIcon /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-500">Nenhum cliente cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">Data Prevista</th>
                                    <th className="px-6 py-3">Destinatário</th>
                                    <th className="px-6 py-3">Endereço / Notas</th>
                                    <th className="px-6 py-3">Carga</th>
                                    <th className="px-6 py-3">Status Atual</th>
                                    <th className="px-6 py-3 text-right">Ações de Rota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.length > 0 ? deliveries.map(item => {
                                    const deliveryDate = item.deliveryDate ? new Date(item.deliveryDate) : new Date(item.date);
                                    return (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{deliveryDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                                            <div className="text-xs text-slate-400">Venda: {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{item.clientName}</div>
                                            <div className="text-xs text-slate-400">{item.clientPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="truncate text-slate-700" title={item.clientAddress}>{item.clientAddress}</div>
                                            {item.deliveryNotes && <div className="text-xs text-amber-600 mt-1 italic">Obs: {item.deliveryNotes}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.quantity} {item.productType || 'Ovos'}
                                            <div className={`text-xs mt-0.5 ${item.paymentStatus === 'Pago' ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.paymentStatus}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                ${item.deliveryStatus === 'Entregue' ? 'bg-green-100 text-green-800' : 
                                                  item.deliveryStatus === 'Em Rota' ? 'bg-blue-100 text-blue-800' :
                                                  item.deliveryStatus === 'Cancelada' ? 'bg-red-100 text-red-800' :
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {item.deliveryStatus || 'Entregue'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.deliveryStatus === 'Pendente' && (
                                                <button 
                                                    onClick={() => handleUpdateDeliveryStatus(item.id, 'Em Rota')}
                                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 mr-2"
                                                >
                                                    Iniciar Rota
                                                </button>
                                            )}
                                            {item.deliveryStatus === 'Em Rota' && (
                                                <button 
                                                    onClick={() => handleUpdateDeliveryStatus(item.id, 'Entregue')}
                                                    className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-100"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                             {item.deliveryStatus === 'Entregue' && (
                                                <span className="text-xs text-green-600">Concluído</span>
                                            )}
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-500">
                                            <div className="flex flex-col items-center">
                                                <span className="text-2xl mb-2">🚚</span>
                                                <p>Nenhuma entrega encontrada para este filtro.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">{clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome do cliente" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Endereço completo" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cliente</label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <option value="Varejo">Varejo</option>
                                    <option value="Atacado">Atacado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Observações (opcional)</label>
                                <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Observações sobre o cliente..." className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">{clientToEdit ? 'Salvar' : 'Cadastrar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
