
import { useState, FC, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import FlockManagement from './components/FlockManagement';
import ShedManagement from './components/ShedManagement';
import AIAssistant from './components/AIAssistant';
import Expenses from './components/Expenses';
import Sales from './components/Sales';
import Reports from './components/Reports';
import FeedCalculator from './components/FeedCalculator';
import Clients from './components/Clients';
import Contacts from './components/Contacts';
import Inventory from './components/Inventory';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import EmailConfirm from './components/EmailConfirm';
import { useFarm } from './context/FarmContext';
import { supabase } from './services/supabaseClient';

type AuthState = 'landing' | 'login' | 'register' | 'app';

const App: FC = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  console.log('[App] authState =', authState);
  
  // Verificar se é rota de confirmação de email
  const urlParams = new URLSearchParams(window.location.search);
  const isConfirmRoute = urlParams.has('token_hash') && urlParams.has('type');
  
  if (isConfirmRoute) {
    return <EmailConfirm />;
  }
  
  // Navigation state is now managed in FarmContext
  const { currentView, navigate, clearData } = useFarm();

  // Verifica se existe uma sessão ativa ao carregar a página e escuta mudanças de auth
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setAuthState('app');
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthState('app');
      } else {
        setAuthState('landing');
        navigate('dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
      setAuthState('app');
  };

  const handleRegisterSuccess = () => {
      // Limpa os dados do banco (localStorage e memória) para o novo usuário
      clearData();
      setAuthState('app');
  };

  const handleLogout = () => {
      supabase.auth.signOut();
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'data-entry': return <DataEntry />;
      case 'flocks': return <FlockManagement />;
      case 'sheds': return <ShedManagement />;
      case 'expenses': return <Expenses />;
      case 'sales': return <Sales />;
      case 'reports': return <Reports />;
      case 'ai-assistant': return <AIAssistant />;
      case 'calculator': return <FeedCalculator />;
      case 'clients': return <Clients />;
      case 'contacts': return <Contacts />;
      case 'inventory': return <Inventory />;
      default: return <Dashboard />;
    }
  };

  if (authState === 'landing') {
    return (
        <LandingPage 
            onLogin={() => setAuthState('login')} 
            onRegister={() => setAuthState('register')} 
        />
    );
  }

  if (authState === 'register') {
      return (
          <Register 
            onRegister={handleRegisterSuccess} 
            onSwitchToLogin={() => setAuthState('login')}
            onBack={() => setAuthState('landing')}
          />
      );
  }

  if (authState === 'login') {
      return (
          <Login 
            onLogin={handleLoginSuccess} 
            onSwitchToRegister={() => setAuthState('register')}
            onBack={() => setAuthState('landing')}
          />
      );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      <Sidebar 
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-[88px] md:pt-8">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;