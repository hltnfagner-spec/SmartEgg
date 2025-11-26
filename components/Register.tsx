
import { useState, FC, FormEvent } from 'react';
import { supabase } from '../services/supabaseClient';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  onBack: () => void;
}

const Register: FC<RegisterProps> = ({ onRegister, onSwitchToLogin, onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    farmName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (phone: string): boolean => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Valida se tem 10 ou 11 dígitos (com ou sem DDD)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return false;
  }
  
  // Valida se começa com DDD válido (11 a 99)
  const ddd = cleanPhone.substring(0, 2);
  if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
    return false;
  }
  
  // Valida se o número não começa com 0 ou 1
  const firstDigit = cleanPhone.length === 11 ? cleanPhone[2] : cleanPhone[2];
  if (firstDigit === '0' || firstDigit === '1') {
    return false;
  }
  
  return true;
};

const formatPhone = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanValue = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedValue = cleanValue.slice(0, 11);
  
  // Aplica formatação
  if (limitedValue.length <= 2) {
    return limitedValue;
  } else if (limitedValue.length <= 6) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  } else if (limitedValue.length <= 10) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
  } else {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`;
  }
};

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem.");
        return;
    }
    if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    if (!formData.agreeTerms) {
        setError("Você precisa aceitar os Termos de Uso.");
        return;
    }
    if (!formData.phone) {
        setError("O telefone é obrigatório.");
        return;
    }
    if (!validatePhone(formData.phone)) {
        setError("Digite um telefone brasileiro válido.");
        return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            farmName: formData.farmName,
            phone: formData.phone,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Após signup, tentar fazer login automático
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // Se login falhar, mostrar mensagem para verificar email
        setError('Conta criada! Verifique seu email para confirmar ou tente fazer login.');
        setIsLoading(false);
        return;
      }

      // Login automático bem sucedido
      setIsLoading(false);
      onRegister();
    } catch (err) {
      console.error(err);
      setError('Erro ao criar conta. Tente novamente.');
      setIsLoading(false);
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
            <h2 className="text-2xl font-bold text-slate-900">Crie sua conta</h2>
            <p className="text-slate-500 mt-2">Comece a gerenciar sua granja hoje mesmo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="Seu nome"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Granja</label>
              <input 
                type="text" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="Ex: Granja Sol Nascente"
                value={formData.farmName}
                onChange={e => setFormData({...formData, farmName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone *</label>
              <input 
                type="tel" 
                required 
                maxLength={15}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar</label>
                <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
                </div>
            </div>

            <div className="flex items-center pt-2">
                <input 
                    id="terms" 
                    type="checkbox" 
                    required
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                    checked={formData.agreeTerms}
                    onChange={e => setFormData({...formData, agreeTerms: e.target.checked})}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                    Li e concordo com os <a href="#" className="text-amber-600 hover:underline">Termos de Uso</a>
                </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 mt-6 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none"
            >
              {isLoading ? 'Criando conta...' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Já tem uma conta?{' '}
            <button onClick={onSwitchToLogin} className="text-amber-600 font-semibold hover:underline">
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
