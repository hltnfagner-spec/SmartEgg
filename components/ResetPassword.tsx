import { useState, FC, FormEvent } from 'react';
import { supabase } from '../services/supabaseClient';

interface ResetPasswordProps {
  onSuccess: () => void;
}

const ResetPassword: FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[ResetPassword] 1. Form submitted');
    setIsLoading(true);
    setError('');

    // Validar senhas
    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    console.log('[ResetPassword] 2. Validation passed');

    try {
      // Verificar se há sessão ativa
      console.log('[ResetPassword] 3. Checking session...');
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[ResetPassword] 4. Session check done:', !!sessionData.session);
      
      if (!sessionData.session) {
        setError('Sessão expirada. Por favor, solicite um novo link de recuperação.');
        setIsLoading(false);
        return;
      }

      console.log('[ResetPassword] 5. Calling updateUser...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });
      console.log('[ResetPassword] 6. updateUser returned, error:', updateError);

      if (updateError) {
        setError(`Erro ao redefinir senha: ${updateError.message}`);
        setIsLoading(false);
        return;
      }

      // Sucesso! Mostrar mensagem e fazer logout
      console.log('[ResetPassword] 7. SUCCESS! Setting success state...');
      setIsLoading(false);
      setSuccess(true);
      console.log('[ResetPassword] 8. Success state set, scheduling redirect...');
      
      // Fazer logout após 2 segundos e redirecionar para login
      setTimeout(async () => {
        console.log('[ResetPassword] 9. Timeout fired, signing out...');
        await supabase.auth.signOut();
        console.log('[ResetPassword] 10. Signed out, redirecting...');
        window.history.replaceState(null, '', '/');
        onSuccess();
      }, 2000);
      
    } catch (err) {
      console.error('[ResetPassword] CATCH Error:', err);
      setIsLoading(false);
      setError('Erro ao processar solicitação. Tente novamente mais tarde.');
    }
  };

  // Log para confirmar que o componente está renderizando
  console.log('[ResetPassword] Rendering form, success:', success, 'isLoading:', isLoading);

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Senha Redefinida!</h2>
            <p className="text-slate-500 mb-4">Sua senha foi alterada com sucesso.</p>
            <p className="text-sm text-slate-400">Redirecionando para o login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="SmartEgg" className="h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}/>
              <span className="hidden text-4xl">🥚</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Redefinir Senha</h2>
            <p className="text-slate-500 mt-2">Digite sua nova senha</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
              <input 
                id="password"
                name="password"
                type="password" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              onClick={() => console.log('[ResetPassword] Button clicked!')}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 disabled:bg-slate-400"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
