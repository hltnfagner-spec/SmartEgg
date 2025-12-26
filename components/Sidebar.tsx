
import { useState, FC, useEffect } from 'react';
import { DashboardIcon, DataEntryIcon, FlockIcon, AIIcon, ExpenseIcon, SalesIcon, ReportIcon, ShedIcon, CalculatorIcon, UsersIcon, ContactIcon, InventoryIcon, LogOutIcon, SettingsIcon, BellIcon, AdminIcon } from './icons';
import { useFarm } from '../context/FarmContext';
import { View } from '../types';
import { supabase } from '../services/supabaseClient';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ onLogout }) => {
  const { currentView, navigate } = useFarm();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'sheds', label: 'Galpões', icon: <ShedIcon /> },
    { id: 'flocks', label: 'Lotes', icon: <FlockIcon /> },
    { id: 'data-entry', label: 'Coleta de Ovos', icon: <DataEntryIcon /> },
    { id: 'mortality', label: 'Mortalidade', icon: <ExpenseIcon /> },
    { id: 'inventory', label: 'Estoque', icon: <InventoryIcon /> },
    // Menu Financeiro dividido para facilitar acesso a entradas e saídas
    { id: 'sales', label: 'Vendas', icon: <SalesIcon /> },
    { id: 'expenses', label: 'Despesas', icon: <ExpenseIcon /> },
    { id: 'clients', label: 'Clientes', icon: <UsersIcon /> },
    { id: 'contacts', label: 'Contatos', icon: <ContactIcon /> },
    { id: 'calculator', label: 'Formulação', icon: <CalculatorIcon /> },
    { id: 'reports', label: 'Relatórios', icon: <ReportIcon /> },
    { id: 'ai-assistant', label: 'Assistente AI', icon: <AIIcon /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Administração', icon: <AdminIcon /> }] : []),
  ];

  const handleNavigation = (id: string) => {
      navigate(id as View);
      setMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
      if(window.confirm('Deseja realmente sair do sistema?')) {
          onLogout();
      }
  }

  const NavLinks = () => (
    <nav className="px-2 py-4 space-y-1">
      {navItems.map(item => {
        const isActive = currentView === item.id;
        
        return (
        <button
          key={item.id}
          onClick={() => handleNavigation(item.id)}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 mb-1 ${
            isActive
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} flex-shrink-0`}>
            {item.icon}
          </span>
          <span className="ml-3 truncate">{item.label}</span>
        </button>
      )})}
    </nav>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden w-full p-4 bg-slate-900 shadow-md flex justify-between items-center fixed top-0 left-0 z-30 h-[72px]">
        <div className="flex items-center">
             <img 
                src="/logo.png" 
                alt="SmartEgg" 
                className="h-8 w-auto mr-3 object-contain"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    // Fallback visual simples caso a imagem não exista
                    const span = document.createElement('span');
                    span.innerText = '🥚';
                    span.className = 'text-2xl mr-2';
                    e.currentTarget.parentNode?.insertBefore(span, e.currentTarget);
                }}
             />
            <h1 className="text-xl font-bold text-white">SmartEgg</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
          </svg>
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 w-full h-[calc(100%-72px)] bg-slate-900 z-20 flex flex-col justify-between">
           <div className="flex-1 overflow-y-auto">
              <NavLinks />
           </div>
           <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors"
                >
                    <LogOutIcon className="h-5 w-5 mr-3" />
                    Sair do Sistema
                </button>
           </div>
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-slate-900 shadow-xl shrink-0 transition-all duration-300 ease-in-out z-30">
        {/* Logo Area */}
        <div className="flex items-center h-16 lg:h-20 px-4 lg:px-6 border-b border-slate-800">
          <img 
            src="/logo.png" 
            alt="SmartEgg" 
            className="h-8 lg:h-10 w-auto mr-2 lg:mr-3 object-contain"
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                const span = document.createElement('span');
                span.innerText = '🥚';
                span.className = 'text-2xl lg:text-3xl mr-2 lg:mr-3';
                e.currentTarget.parentNode?.insertBefore(span, e.currentTarget);
            }}
          />
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight hidden lg:block">SmartEgg</h1>
          <h1 className="text-xl font-bold text-white tracking-tight lg:hidden">🥚</h1>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 lg:py-4 custom-scrollbar">
            <NavLinks />
        </div>

        {/* Footer / Logout */}
        <div className="p-3 lg:p-4 border-t border-slate-800">
            <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors group"
            >
                <LogOutIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 group-hover:text-red-400 transition-colors flex-shrink-0" />
                <span className="group-hover:text-red-100 hidden lg:inline">Sair do Sistema</span>
                <span className="group-hover:text-red-100 lg:hidden">Sair</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
