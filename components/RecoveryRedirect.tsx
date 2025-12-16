import { FC, useState } from 'react';

interface RecoveryRedirectProps {
  confirmationUrl: string;
}

const RecoveryRedirect: FC<RecoveryRedirectProps> = ({ confirmationUrl }) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirect = () => {
    setIsRedirecting(true);
    // Redirecionar para a URL real do Supabase
    window.location.href = confirmationUrl;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="SmartEgg" 
                className="h-12 w-auto object-contain" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  e.currentTarget.nextElementSibling?.classList.remove('hidden'); 
                }}
              />
              <span className="hidden text-4xl">🥚</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Redefinir Senha</h2>
            <p className="text-slate-500 mt-2">Clique no botão abaixo para continuar com a redefinição da sua senha</p>
          </div>

          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-sm">
              <strong>⚠️ Importante:</strong> Este link é de uso único. Clique no botão apenas quando estiver pronto para criar sua nova senha.
            </p>
          </div>

          <button 
            onClick={handleRedirect}
            disabled={isRedirecting}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-slate-400 disabled:cursor-not-allowed text-lg"
          >
            {isRedirecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecionando...
              </span>
            ) : (
              '🔐 Redefinir Minha Senha'
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-6">
            Se você não solicitou a redefinição de senha, ignore esta página.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecoveryRedirect;
