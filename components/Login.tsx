
import { useState, FC, FormEvent } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onBack: () => void;
}

const Login: FC<LoginProps> = ({ onLogin, onSwitchToRegister, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError('Email ou senha incorretos. Verifique suas credenciais ou tente novamente.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLogin();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setError('Erro ao tentar fazer login. Tente novamente mais tarde.');
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
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="text-slate-500 mt-2">Acesse sua conta SmartEgg</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                id="password"
                name="password"
                type="password" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div className="text-right">
                <a href="#" className="text-xs text-amber-600 hover:underline">Esqueceu a senha?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 mt-2 disabled:bg-slate-400"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Não tem uma conta?{' '}
            <button onClick={onSwitchToRegister} className="text-amber-600 font-semibold hover:underline">
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
