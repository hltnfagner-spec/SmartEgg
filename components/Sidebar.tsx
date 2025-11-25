
import { useState, FC } from 'react';
import { DashboardIcon, DataEntryIcon, FlockIcon, AIIcon, ExpenseIcon, SalesIcon, ReportIcon, ShedIcon, CalculatorIcon, UsersIcon, ContactIcon, InventoryIcon, LogOutIcon } from './icons';
import { useFarm } from '../context/FarmContext';
import { View } from '../types';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ onLogout }) => {
  const { currentView, navigate } = useFarm();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'sheds', label: 'Galpões', icon: <ShedIcon /> },
    { id: 'flocks', label: 'Lotes', icon: <FlockIcon /> },
    { id: 'data-entry', label: 'Coleta de Ovos', icon: <DataEntryIcon /> },
    { id: 'inventory', label: 'Estoque', icon: <InventoryIcon /> },
    // Menu Financeiro dividido para facilitar acesso a entradas e saídas
    { id: 'sales', label: 'Vendas', icon: <SalesIcon /> },
    { id: 'expenses', label: 'Despesas', icon: <ExpenseIcon /> },
    { id: 'clients', label: 'Clientes', icon: <UsersIcon /> },
    { id: 'contacts', label: 'Contatos', icon: <ContactIcon /> },
    { id: 'calculator', label: 'Formulação', icon: <CalculatorIcon /> },
    { id: 'reports', label: 'Relatórios', icon: <ReportIcon /> },
    { id: 'ai-assistant', label: 'Assistente AI', icon: <AIIcon /> },
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
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 mb-1 ${
            isActive
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
            {item.icon}
          </span>
          <span className="ml-3">{item.label}</span>
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
      <aside className="hidden md:flex flex-col w-64 h-full bg-slate-900 shadow-xl shrink-0 transition-all duration-300 ease-in-out z-30">
        {/* Logo Area */}
        <div className="flex items-center h-20 px-6 border-b border-slate-800">
          <img 
            src="/logo.png" 
            alt="SmartEgg" 
            className="h-10 w-auto mr-3 object-contain"
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                const span = document.createElement('span');
                span.innerText = '🥚';
                span.className = 'text-3xl mr-3';
                e.currentTarget.parentNode?.insertBefore(span, e.currentTarget);
            }}
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">SmartEgg</h1>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <NavLinks />
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-800">
            <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors group"
            >
                <LogOutIcon className="h-5 w-5 mr-3 group-hover:text-red-400 transition-colors" />
                <span className="group-hover:text-red-100">Sair</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
