import { useState, FC, FormEvent, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface ForgotPasswordProps {
  onBack: () => void;
  showExpiredMessage?: boolean;
}

const ForgotPassword: FC<ForgotPasswordProps> = ({ onBack, showExpiredMessage = false }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showExpiredWarning, setShowExpiredWarning] = useState(showExpiredMessage);

  // Detectar se veio de um link expirado
  useEffect(() => {
    if (showExpiredMessage) {
      setShowExpiredWarning(true);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    
    if (errorCode === 'otp_expired') {
      setShowExpiredWarning(true);
    }
  }, [showExpiredMessage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Fazer logout de qualquer sessão ativa antes de solicitar recuperação
      await supabase.auth.signOut();
      
      // Usar domínio de produção sem type=recovery para evitar conflito com confirm email
      const redirectUrl = window.location.hostname === 'smartegg.app.br' 
        ? 'https://smartegg.app.br'
        : `${window.location.origin}`;
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError('Erro ao enviar email de recuperação. Verifique o email e tente novamente.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center text-sm transition-colors">
            ← Voltar
          </button>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="SmartEgg" className="h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}/>
              <span className="hidden text-4xl">🥚</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Recuperar Senha</h2>
            <p className="text-slate-500 mt-2">Digite seu email para receber o link de recuperação</p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-center">
                <div className="text-4xl mb-2">✓</div>
                <p className="font-semibold mb-2">Email enviado com sucesso!</p>
                <p className="text-sm">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              </div>
              <button 
                onClick={onBack}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Voltar para Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {showExpiredWarning && (
                <div className="bg-yellow-50 text-yellow-800 text-sm p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⚠️</span>
                    <div>
                      <p className="font-semibold mb-1">Link de recuperação expirado</p>
                      <p className="text-xs">O link que você clicou expirou. Links de recuperação são válidos por apenas 1 hora. Solicite um novo link abaixo.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  required 
                  className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-slate-400"
              >
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
