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
import AlertsPage from './components/AlertsPage';
import Transactions from './components/Transactions';
import Productivity from './components/Productivity';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailConfirm from './components/EmailConfirm';
import RecoveryRedirect from './components/RecoveryRedirect';
import { SubscriptionStatus } from './components/SubscriptionStatus';
import { useFarm } from './context/FarmContext';
import { AlertProvider } from './context/AlertContext';
import { supabase } from './services/supabaseClient';

type AuthState = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'app';

function App() {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Verificar se é rota de confirmação de email ou recuperação de senha
  // Supabase pode enviar tokens via query string (?) ou hash (#)
  // IMPORTANTE: Capturar na primeira renderização, pois o Supabase limpa o hash após processar
  const [initialUrlParams] = useState(() => new URLSearchParams(window.location.search));
  const [initialHashParams] = useState(() => new URLSearchParams(window.location.hash.substring(1)));
  
  
  // Detectar link intermediário de recuperação (para evitar consumo por scanners de email)
  const recoveryUrl = initialUrlParams.get('recovery_url');
  
  // Detectar erros de token expirado ou inválido
  const error = initialUrlParams.get('error') || initialHashParams.get('error');
  const errorCode = initialUrlParams.get('error_code') || initialHashParams.get('error_code');
  
  // Efeito para capturar erro de token expirado e persistir no estado
  useEffect(() => {
    if (error === 'access_denied' && errorCode === 'otp_expired') {
        setOtpError(true);
        // Limpar a URL para não processar o erro novamente num reload
        window.history.replaceState(null, '', '/');
    }
  }, [error, errorCode]);

  // Tokens de autenticação (usar valores iniciais capturados)
  const type = initialUrlParams.get('type') || initialHashParams.get('type');
  const accessToken = initialUrlParams.get('access_token') || initialHashParams.get('access_token');
  const refreshToken = initialUrlParams.get('refresh_token') || initialHashParams.get('refresh_token');
  
  // Determinar se é rota de confirmação de email (calculado uma vez na montagem)
  const [isConfirmRoute] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const typeParam = urlParams.get('type') || hashParams.get('type');
    const tokenHashParam = urlParams.get('token_hash') || hashParams.get('token_hash');
    
    // Confirmação de email: type=email E token_hash presente
    const isConfirm = typeParam === 'email' && tokenHashParam;
    return isConfirm;
  });
  
  // Determinar se é rota de recuperação de senha (calculado uma vez na montagem)
  const [isRecoveryRoute] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const typeParam = urlParams.get('type') || hashParams.get('type');
    const accessTokenParam = urlParams.get('access_token') || hashParams.get('access_token');
    const refreshTokenParam = urlParams.get('refresh_token') || hashParams.get('refresh_token');
    
    // Recuperação de senha: type=recovery E (access_token OU refresh_token)
    // NÃO é confirmação de email (type !== 'email')
    const isRecovery = typeParam === 'recovery' && (accessTokenParam || refreshTokenParam);
    return isRecovery;
  });

  // Navigation state is now managed in FarmContext
  const { currentView, navigate, clearData, subscription, isSubscriptionLoading, handleMercadoPagoReturn } = useFarm();

  // Verificar se usuário é admin ao autenticar
  useEffect(() => {
    const checkAdmin = async () => {
      if (authState !== 'app') return;
      
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
  }, [authState]);

  const handleLoginSuccess = () => {
    setAuthState('app');
  };

  const handleRegisterSuccess = () => {
    // Limpa os dados da memória para o novo usuário
    clearData();
    setAuthState('app');
  };

  const handleLogout = async () => {
    // Limpar dados da memória imediatamente
    clearData();
    
    // Mudar estado e URL imediatamente (sem aguardar)
    setAuthState('landing');
    window.history.replaceState(null, '', '/');
    
    // Fazer logout e limpeza em background (não bloqueia UI)
    try {
      // Logout do Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout do Supabase:', error);
    }
    
    // Limpar armazenamento em background (preservando alertas)
    try {
      // Limpar apenas dados da aplicação, preservando alertas
      Object.keys(localStorage).forEach(key => {
        // Protege todas as chaves do sistema de alertas (active, history, dismissed)
        if (!key.startsWith('smartegg_')) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
    
    // Limpar caches do Service Worker em background (não bloqueia)
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      }).catch(error => console.error('Erro ao limpar caches:', error));
    }
    
    // Reload após limpeza básica (sem aguardar caches)
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 50);
  };

  // Estado inicial baseado na URL para evitar flicker
  useEffect(() => {
    if (isRecoveryRoute) {
      setIsPasswordRecovery(true);
      setAuthState('reset-password');
    }
  }, [isRecoveryRoute]);

  // Handle Mercado Pago return URL
  useEffect(() => {
    if (authState === 'app') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Check for Mercado Pago payment_id in URL
      const paymentId = urlParams.get('payment_id') || hashParams.get('payment_id');
      const status = urlParams.get('status') || hashParams.get('status');
      
      if (paymentId && status) {
        // Process the payment return
        handleMercadoPagoReturn(paymentId);
        
        // Clean the URL to remove payment parameters
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }, [authState, handleMercadoPagoReturn]);

  // Verifica se existe uma sessão ativa ao carregar a página e escuta mudanças de auth
  useEffect(() => {
    // Se já detectamos recuperação via URL, não precisamos checar sessão inicial da mesma forma
    if (isRecoveryRoute) return;

    const checkSession = async () => {
      // Race: Se getSession demorar > 200ms, não bloqueamos a UI na Landing Page.
      // O listener onAuthStateChange cuidará da transição assim que possível.
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) => 
        setTimeout(() => resolve({ data: { session: null }, error: null }), 200)
      );

      try {
        const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (error) {
          console.error('[App] Erro ao verificar sessão:', error);
          // Não forçamos landing aqui para dar chance ao listener
          return;
        }
        
        if (data?.session) {
          setAuthState('app');
        }
      } catch (err) {
        console.error('[App] Erro inesperado no checkSession:', err);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Se estamos numa rota de recuperação, ignorar eventos que nos tirariam dela
      if (isRecoveryRoute) {
         return;
      }

      // Detectar evento de recuperação de senha
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setAuthState('reset-password');
        return;
      }
      
      // Se está em modo de recuperação de senha, não mudar estado automaticamente
      if (isPasswordRecovery) {
        return;
      }
      
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
  }, [navigate, isRecoveryRoute, isPasswordRecovery]);

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
      case 'alerts': return <AlertsPage />;
      case 'transactions': return <Transactions />;
      case 'produtividade': return <Productivity />;
      case 'settings': return <Settings />;
      case 'admin': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  // Condicionais de retorno (Renderização)

  if (recoveryUrl) {
    return <RecoveryRedirect confirmationUrl={decodeURIComponent(recoveryUrl)} />;
  }

  // Se houver erro de token expirado, mostrar mensagem e redirecionar para recuperação
  // Usar otpError (estado persistente) ou detecção direta da URL
  if (otpError || (error === 'access_denied' && errorCode === 'otp_expired')) {
    return (
      <ForgotPassword 
        showExpiredMessage={true}
        onBack={() => {
          setOtpError(false);
          setAuthState('landing');
          window.history.replaceState(null, '', '/');
        }}
      />
    );
  }

  if (isConfirmRoute) {
    return <EmailConfirm />;
  }

  // Se for rota de recuperação detectada via URL, renderizar ResetPassword diretamente
  if (isRecoveryRoute) {
    return <ResetPassword 
      onSuccess={() => {
        // Após logout no ResetPassword, ir para tela de login
        setAuthState('login');
        window.location.reload();
      }}
    />;
  }

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

  // Check subscription status for authenticated users
  if (authState === 'app' && !isSubscriptionLoading) {
    // Administradores têm acesso FULL sem verificação de assinatura
    if (isAdmin) {
      // Admin tem acesso total, pular verificação de assinatura
    } else {
      const isTrialExpired = subscription?.status === 'trial' && 
        subscription.trialEnd && 
        new Date(subscription.trialEnd) < new Date();
      
      const isSubscriptionActive = subscription?.status === 'active' || 
        (subscription?.status === 'trial' && !isTrialExpired);

      // If subscription is not active, show the subscription status
      if (!isSubscriptionActive) {
        return <SubscriptionStatus />;
      }
    }
  }

  return (
    <AlertProvider>
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
    </AlertProvider>
  );
};

export default App;
