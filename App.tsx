
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
import Mortality from './components/Mortality';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailConfirm from './components/EmailConfirm';
import { useFarm } from './context/FarmContext';
import { supabase } from './services/supabaseClient';

type AuthState = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'app';

function App() {
  const [authState, setAuthState] = useState<AuthState>('landing');
  
  // Verificar se é rota de confirmação de email ou recuperação de senha
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type');
  const isConfirmRoute = urlParams.has('token_hash') && type === 'signup';
  const isRecoveryRoute = urlParams.has('token_hash') && type === 'recovery';
  
  if (isConfirmRoute) {
    return <EmailConfirm />;
  }
  
  if (isRecoveryRoute) {
    return <ResetPassword 
      onSuccess={() => {
        window.history.replaceState(null, '', '/');
        window.location.href = '/?reset=success';
      }}
    />;
  }
  
  // Navigation state is now managed in FarmContext
  const { currentView, navigate, clearData } = useFarm();

  // Verifica se existe uma sessão ativa ao carregar a página e escuta mudanças de auth
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[App] Erro ao verificar sessão:', error);
        setAuthState('landing');
        return;
      }
      
      if (data.session) {
        setAuthState('app');
      } else {
        setAuthState('landing');
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthState('app');
      } else if (event === 'SIGNED_OUT') {
        setAuthState('landing');
      } else if (!session) {
        setAuthState('landing');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLoginSuccess = () => {
      setAuthState('app');
  };

  const handleRegisterSuccess = () => {
      // Limpa os dados da memória para o novo usuário
      clearData();
      setAuthState('app');
  };

  const handleLogout = async () => {
      clearData(); // Limpa todos os dados da memória
      
      try {
        // Forçar logout do Supabase
        await supabase.auth.signOut();
        
        // Forçar mudança de estado imediatamente
        setAuthState('landing');
        
        // Limpar URL
        window.history.replaceState(null, '', '/');
        
        // Forçar reload para garantir limpeza completa
        setTimeout(() => {
          window.location.reload();
        }, 100);
        
      } catch (error) {
        console.error('Erro no logout:', error);
        // Mesmo com erro, forçar logout e reload
        setAuthState('landing');
        window.history.replaceState(null, '', '/');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
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
      case 'mortality': return <Mortality />;
      case 'settings': return <Settings />;
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
            onSwitchToForgotPassword={() => setAuthState('forgot-password')}
            onBack={() => setAuthState('landing')}
          />
      );
  }

  if (authState === 'forgot-password') {
      return (
          <ForgotPassword 
            onBack={() => setAuthState('login')}
          />
      );
  }

  if (authState === 'reset-password') {
      return (
          <ResetPassword 
            onSuccess={() => {
              setAuthState('login');
              alert('Senha redefinida com sucesso! Faça login com sua nova senha.');
            }}
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