
import { useState, FC, ReactNode } from 'react';
import { UserIcon, EditIcon, TrashIcon, ContactIcon } from './icons';
import StatCard from './StatCard';
import NotificationBell from './NotificationBell';

interface Contact {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  icon?: ReactNode;
}

const Contacts: FC = () => {
    const contacts: Contact[] = [
        { id: 1, name: 'Dr. Carlos Veterinário', role: 'Veterinário', phone: '(11) 3456-7890', email: 'dr.carlos@vetaves.com.br', address: 'Rua das Aves, 123 - Centro' },
        { id: 2, name: 'Fornecedor Ração Premium', role: 'Fornecedor', phone: '(11) 2345-6789', email: 'vendas@racaopremium.com.br', address: '' },
        { id: 3, name: 'João Silva - Funcionário', role: 'Funcionário', phone: '(11) 9876-5432', email: 'joao.silva@email.com', address: '' },
        { id: 4, name: 'Maria Souza - Limpeza', role: 'Funcionário', phone: '(11) 9999-8888', email: '', address: '' },
    ];

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
                 <button className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm transition-colors">
                    + Novo Contato
                 </button>
             </div>

             {/* Stats */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total de Contatos" value={contacts.length} icon={<ContactIcon />} iconColorClass="bg-blue-100 text-blue-600" />
                <StatCard title="Veterinário" value="1" icon={<UserIcon />} iconColorClass="bg-green-100 text-green-600" />
                <StatCard title="Fornecedor" value="1" icon={<UserIcon />} iconColorClass="bg-purple-100 text-purple-600" />
                <StatCard title="Funcionário" value="2" icon={<UserIcon />} iconColorClass="bg-yellow-100 text-yellow-600" />
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

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contacts.map(contact => (
                    <div key={contact.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                            <button className="text-slate-400 hover:text-orange-500"><EditIcon /></button>
                            <button className="text-slate-400 hover:text-red-500"><TrashIcon /></button>
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
        </div>
    );
};

export default Contacts;
