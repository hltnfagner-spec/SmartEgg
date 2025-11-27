
import { useState, FC, ReactNode, useEffect } from 'react';
import { UserIcon, EditIcon, TrashIcon, ContactIcon } from './icons';
import StatCard from './StatCard';
import NotificationBell from './NotificationBell';
import { supabase } from '../services/supabaseClient';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  icon?: ReactNode;
}

const Contacts: FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Carregar contatos do Supabase
    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            const { data, error } = await supabase
                .from('user_contacts')
                .select('*')
                .eq('contact_type', 'contact')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao carregar contatos:', error);
            } else {
                setContacts(data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setShowAddForm(true);
    };

    const handleDelete = async (contactId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este contato?')) {
            try {
                const { error } = await supabase
                    .from('user_contacts')
                    .delete()
                    .eq('id', contactId);

                if (error) {
                    console.error('Erro ao excluir contato:', error);
                    alert('Erro ao excluir contato');
                } else {
                    await loadContacts(); // Recarregar lista
                    alert('Contato excluído com sucesso');
                }
            } catch (error) {
                console.error('Erro ao excluir contato:', error);
                alert('Erro ao excluir contato');
            }
        }
    };

    const handleSaveContact = async (contactData: Omit<Contact, 'id'>) => {
        try {
            if (editingContact) {
                // Editar contato existente
                const { error } = await supabase
                    .from('user_contacts')
                    .update({
                        name: contactData.name,
                        phone: contactData.phone,
                        email: contactData.email,
                        address: contactData.address,
                        // Aqui você pode adicionar mais campos se necessário
                    })
                    .eq('id', editingContact.id);

                if (error) {
                    console.error('Erro ao editar contato:', error);
                    alert('Erro ao editar contato');
                } else {
                    await loadContacts();
                    alert('Contato editado com sucesso');
                    setShowAddForm(false);
                    setEditingContact(null);
                }
            } else {
                // Adicionar novo contato
                const { error } = await supabase
                    .from('user_contacts')
                    .insert({
                        ...contactData,
                        contact_type: 'contact',
                        user_id: (await supabase.auth.getUser()).data.user?.id
                    });

                if (error) {
                    console.error('Erro ao adicionar contato:', error);
                    alert('Erro ao adicionar contato');
                } else {
                    await loadContacts();
                    alert('Contato adicionado com sucesso');
                    setShowAddForm(false);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
            alert('Erro ao salvar contato');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Agenda de Contatos</h1>
                <div className="flex items-center space-x-4">
                     <NotificationBell />
                </div>
            </div>

             <div className="flex justify-between items-center -mt-4 mb-6">
                 <p className="text-slate-500">Organize seus contatos importantes</p>
                 <button 
                    onClick={() => {
                        setEditingContact(null);
                        setShowAddForm(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition-colors"
                 >
                    + Novo Contato
                 </button>
             </div>

             {/* Formulário de Adicionar/Editar Contato */}
             {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {editingContact ? 'Editar Contato' : 'Novo Contato'}
                    </h3>
                    <ContactForm 
                        contact={editingContact}
                        onSave={handleSaveContact}
                        onCancel={() => {
                            setShowAddForm(false);
                            setEditingContact(null);
                        }}
                    />
                </div>
             )}

             {/* Stats */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total de Contatos" value={contacts.length} icon={<ContactIcon />} iconColorClass="bg-blue-100 text-blue-600" />
                <StatCard title="Veterinário" value={contacts.filter(c => c.role === 'Veterinário').length} icon={<UserIcon />} iconColorClass="bg-green-100 text-green-600" />
                <StatCard title="Fornecedor" value={contacts.filter(c => c.role === 'Fornecedor').length} icon={<UserIcon />} iconColorClass="bg-purple-100 text-purple-600" />
                <StatCard title="Funcionário" value={contacts.filter(c => c.role === 'Funcionário').length} icon={<UserIcon />} iconColorClass="bg-yellow-100 text-yellow-600" />
            </div>

             {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                 <div className="flex-1">
                     <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Buscar contatos</label>
                     <input type="text" placeholder="Nome, telefone ou email..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
                 </div>
                  <div className="md:w-64">
                     <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Filtrar por categoria</label>
                     <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                         <option>Todas as categorias</option>
                         <option>Veterinários</option>
                         <option>Fornecedores</option>
                         <option>Funcionários</option>
                     </select>
                 </div>
            </div>

            {/* Mensagem quando não há contatos */}
            {contacts.length === 0 && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                    <div className="bg-orange-100 h-16 w-16 rounded-full flex items-center justify-center text-orange-600 text-2xl mx-auto mb-4">
                        <ContactIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Nenhum contato cadastrado</h3>
                    <p className="text-slate-500 mb-4">Comece adicionando seus primeiros contatos importantes</p>
                    <button 
                        onClick={() => {
                            setEditingContact(null);
                            setShowAddForm(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition-colors"
                    >
                        + Adicionar Primeiro Contato
                    </button>
                </div>
            )}

            {/* Grid of Cards */}
            {contacts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map(contact => (
                        <div key={contact.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                <button 
                                    onClick={() => handleEdit(contact)}
                                    className="text-slate-400 hover:text-orange-500"
                                    title="Editar"
                                >
                                    <EditIcon />
                                </button>
                                <button 
                                    onClick={() => handleDelete(contact.id)}
                                    className="text-slate-400 hover:text-red-500"
                                    title="Excluir"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="bg-orange-100 h-12 w-12 rounded-full flex items-center justify-center text-orange-600 text-lg font-bold">
                                    {contact.icon || <UserIcon />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{contact.name}</h3>
                                    <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium mt-1">{contact.role}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p className="flex items-center"><span className="w-5 opacity-50 mr-2">📞</span> {contact.phone}</p>
                                {contact.email && <p className="flex items-center"><span className="w-5 opacity-50 mr-2">✉️</span> {contact.email}</p>}
                                {contact.address && <p className="flex items-center"><span className="w-5 opacity-50 mr-2">📍</span> {contact.address}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente de formulário de contato
const ContactForm: FC<{
    contact?: Contact | null;
    onSave: (contact: Omit<Contact, 'id'>) => Promise<void>;
    onCancel: () => void;
}> = ({ contact, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: contact?.name || '',
        role: contact?.role || 'Funcionário',
        phone: contact?.phone || '',
        email: contact?.email || '',
        address: contact?.address || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Nome do contato"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                    <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                        <option value="Funcionário">Funcionário</option>
                        <option value="Veterinário">Veterinário</option>
                        <option value="Fornecedor">Fornecedor</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone *</label>
                <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(00) 00000-0000"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="email@exemplo.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Rua, número, bairro..."
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    {contact ? 'Salvar Alterações' : 'Adicionar Contato'}
                </button>
            </div>
        </form>
    );
};

export default Contacts;
