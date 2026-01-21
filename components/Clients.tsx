
import { useState, FC, FormEvent, useEffect, useMemo } from 'react';
import { UserIcon, EditIcon, TrashIcon, UsersIcon } from './icons';
import { useFarm } from '../context/FarmContext';
import { Client, DeliveryStatus } from '../types';
import NotificationBell from './NotificationBell';

const Clients: FC = () => {
    const { clients, sales, updateSale, addClient, updateClient, deleteClient, getClientById } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'clientes' | 'entregas'>('clientes');
    const [expandedClient, setExpandedClient] = useState<string | null>(null);


    const [formData, setFormData] = useState<Omit<Client, 'id'>>({
        name: '',
        phone: '',
        email: '',
        document: '',
        address: '',
        city: '',
        neighborhood: '',
        state: '',
        type: 'Varejo',
        notes: ''
    });

    const handleOpenAddModal = () => {
        setClientToEdit(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            document: '',
            address: '',
            city: '',
            neighborhood: '',
            state: '',
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
            document: client.document || '',
            address: client.address,
            city: client.city || '',
            neighborhood: client.neighborhood || '',
            state: client.state || '',
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

    // Dados filtrados com busca
    const filteredData = useMemo(() => {
        const searchLower = searchTerm.toLowerCase();
        
        if (activeFilter === 'clientes') {
            return clients
                .filter(client => 
                    client.name.toLowerCase().includes(searchLower) ||
                    client.phone.includes(searchLower) ||
                    client.email.toLowerCase().includes(searchLower)
                )
                .map(client => ({
                    type: 'client' as const,
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    address: client.address,
                    clientType: client.type,
                    client
                }));
        }
        
        // activeFilter === 'entregas'
        return sales
            .filter(sale => {
                const client = sale.clientId ? getClientById(sale.clientId) : null;
                const clientName = client?.name || 'Venda Avulsa';
                return clientName.toLowerCase().includes(searchLower) ||
                       sale.deliveryAddress?.toLowerCase().includes(searchLower) ||
                       sale.productType?.toLowerCase().includes(searchLower);
            })
            .map(sale => {
                const client = sale.clientId ? getClientById(sale.clientId) : null;
                return {
                    type: 'delivery' as const,
                    id: sale.id,
                    clientName: client?.name || 'Venda Avulsa',
                    clientPhone: client?.phone || '-',
                    address: sale.deliveryAddress || client?.address || 'Endereço não informado',
                    quantity: sale.quantity,
                    productType: sale.productType || 'Ovos',
                    deliveryStatus: sale.deliveryStatus || 'Entregue',
                    deliveryDate: sale.deliveryDate || sale.date,
                    paymentStatus: sale.paymentStatus,
                    deliveryNotes: sale.deliveryNotes,
                    sale
                };
            });
    }, [searchTerm, activeFilter, clients, sales, getClientById]);

    // Stats simplificados
    const pendingDeliveries = sales.filter(s => s.deliveryStatus === 'Pendente').length;

    const getNextStatus = (currentStatus: DeliveryStatus): DeliveryStatus => {
        switch (currentStatus) {
            case 'Pendente': return 'Em Rota';
            case 'Em Rota': return 'Entregue';
            default: return currentStatus;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-stone-800">Clientes e Logística</h1>
                        <p className="text-stone-600 mt-1 text-sm sm:text-base">Gerencie clientes e controle entregas</p>
                    </div>
                    <NotificationBell />
                </div>
                <div className="flex justify-center sm:justify-end">
                    <button
                        onClick={handleOpenAddModal}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span className="text-base">+</span>
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Stats Simplificados */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Clientes Ativos</p>
                            <p className="text-2xl font-bold text-stone-800">{clients.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-amber-100 text-amber-600 mr-4">
                            <span className="text-xl">🚚</span>
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Entregas Pendentes</p>
                            <p className="text-2xl font-bold text-stone-800">{pendingDeliveries}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveFilter('clientes')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                            activeFilter === 'clientes'
                                ? 'bg-amber-500 text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                    >
                        Clientes
                    </button>
                    <button
                        onClick={() => setActiveFilter('entregas')}
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                            activeFilter === 'entregas'
                                ? 'bg-amber-500 text-white'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                    >
                        Entregas
                    </button>
                </div>
            </div>

            {/* Card de Busca */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cliente ou entrega..."
                            className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* Cards de Clientes */}
            {activeFilter === 'clientes' && (
                <div className="space-y-6">
                    {filteredData.length > 0 ? (
                        filteredData.filter(item => item.type === 'client').map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Header Simplificado - Apenas Nome */}
                                <div 
                                    onClick={() => setExpandedClient(expandedClient === item.id ? null : item.id)}
                                    className="p-2 sm:p-4 md:p-6 cursor-pointer hover:bg-stone-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 min-w-0">
                                            <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                                                <UserIcon className="h-5 w-5" />
                                            </div>
                                            <h3 className="font-semibold text-stone-900 text-xs sm:text-sm md:text-base truncate flex-1 min-w-0">{item.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                                                item.clientType === 'Atacado' 
                                                    ? 'bg-purple-100 text-purple-700' 
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {item.clientType}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEditModal(item.client);
                                                }}
                                                className="p-3 text-stone-400 hover:text-amber-500 transition-colors flex-shrink-0"
                                                title="Editar"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.id);
                                                }}
                                                className="p-3 text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                                                title="Excluir"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Conteúdo Expansivo */}
                                {expandedClient === item.id && (
                                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-stone-100">
                                        <div className="pt-6 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-sm font-medium text-stone-500 mb-2">Telefone</p>
                                                    <p className="text-base text-stone-900 flex items-center gap-3">
                                                        <span className="text-lg">📱</span> {item.phone}
                                                    </p>
                                                </div>
                                                {item.email && (
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-500 mb-2">Email</p>
                                                        <p className="text-base text-stone-900 flex items-center gap-3">
                                                            <span className="text-lg">✉️</span> {item.email}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.address && (
                                                    <div className="sm:col-span-2">
                                                        <p className="text-sm font-medium text-stone-500 mb-2">Endereço</p>
                                                        <p className="text-base text-stone-900 flex items-center gap-3">
                                                            <span className="text-lg">🏠</span> {item.address}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.client.document && (
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-500 mb-2">CPF/CNPJ</p>
                                                        <p className="text-base text-stone-900">{item.client.document}</p>
                                                    </div>
                                                )}
                                                {item.client.city && (
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-500 mb-2">Cidade/UF</p>
                                                        <p className="text-base text-stone-900">
                                                            {item.client.city}{item.client.state ? `/${item.client.state}` : ''}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.client.neighborhood && (
                                                    <div>
                                                        <p className="text-sm font-medium text-stone-500 mb-2">Bairro</p>
                                                        <p className="text-base text-stone-900">{item.client.neighborhood}</p>
                                                    </div>
                                                )}
                                                {item.client.notes && (
                                                    <div className="sm:col-span-2">
                                                        <p className="text-sm font-medium text-stone-500 mb-2">Observações</p>
                                                        <p className="text-base text-stone-900 italic">{item.client.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 sm:p-16 text-center">
                            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">👥</span>
                            </div>
                            <h3 className="text-xl font-medium text-stone-700 mb-3">Nenhum cliente encontrado</h3>
                            <p className="text-stone-500 text-lg">
                                {searchTerm ? 'Tente buscar com outros termos' : 'Nenhum cliente cadastrado ainda'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Cards de Entregas */}
            {activeFilter === 'entregas' && (
                <div className="space-y-6">
                    {filteredData.length > 0 ? (
                        filteredData.filter(item => item.type === 'delivery').map((item) => {
                            const nextStatus = getNextStatus(item.deliveryStatus);
                            const canUpdate = item.deliveryStatus !== 'Entregue' && item.deliveryStatus !== 'Cancelada';
                            
                            return (
                                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sm:p-8 hover:shadow-lg transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="p-4 rounded-lg bg-amber-50 text-amber-600">
                                                    <span className="text-2xl">📦</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-stone-900 text-lg sm:text-xl mb-4 truncate">{item.clientName}</h3>
                                                    <div className="space-y-3">
                                                        <p className="text-base text-stone-600 flex items-center gap-3">
                                                            <span className="text-lg">📦</span> <span className="font-medium">{item.quantity} {item.productType}</span>
                                                        </p>
                                                        <p className="text-base text-stone-600 flex items-center gap-3">
                                                            <span className="text-lg">📱</span> {item.clientPhone}
                                                        </p>
                                                        <p className="text-base text-stone-600 flex items-center gap-3">
                                                            <span className="text-lg">🏠</span> {item.address}
                                                        </p>
                                                        <p className="text-base text-stone-600 flex items-center gap-3">
                                                            <span className="text-lg">📅</span> {new Date(item.deliveryDate).toLocaleDateString('pt-BR')}
                                                        </p>
                                                        {item.deliveryNotes && (
                                                            <p className="text-base text-amber-600 italic flex items-start gap-3">
                                                                <span className="text-lg">💬</span> <span>{item.deliveryNotes}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap gap-3">
                                                        <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                                                            item.deliveryStatus === 'Entregue' ? 'bg-green-100 text-green-800' : 
                                                            item.deliveryStatus === 'Em Rota' ? 'bg-blue-100 text-blue-800' :
                                                            item.deliveryStatus === 'Cancelada' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {item.deliveryStatus}
                                                        </span>
                                                        <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                                                            item.paymentStatus === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {item.paymentStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {canUpdate && (
                                                <button
                                                    onClick={() => handleUpdateDeliveryStatus(item.id, nextStatus)}
                                                    className="px-4 py-3 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                                >
                                                    {item.deliveryStatus === 'Pendente' ? 'Iniciar Rota' : 'Confirmar Entrega'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 sm:p-16 text-center">
                            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🚚</span>
                            </div>
                            <h3 className="text-xl font-medium text-stone-700 mb-3">Nenhuma entrega encontrada</h3>
                            <p className="text-stone-500 text-lg">
                                {searchTerm ? 'Tente buscar com outros termos' : 'Nenhuma entrega cadastrada ainda'}
                            </p>
                        </div>
                    )}
                </div>
            )}

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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF/CNPJ</label>
                                    <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="000.000.000-00" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua, número" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Cidade" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                                    <input type="text" maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="SP" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                                <input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="Bairro" className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
