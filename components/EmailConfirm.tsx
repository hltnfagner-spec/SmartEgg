import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { EmailOtpType } from '@supabase/supabase-js';

const EmailConfirm = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token_hash = urlParams.get('token_hash');
        const type = urlParams.get('type') as EmailOtpType;

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
          });

          if (error) {
            setMessage('Erro ao confirmar email. O link pode ter expirado.');
            setIsSuccess(false);
          } else {
            setMessage('Email confirmado com sucesso! Redirecionando...');
            setIsSuccess(true);
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        } else {
          setMessage('Link de confirmação inválido.');
          setIsSuccess(false);
        }
      } catch (err) {
        setMessage('Ocorreu um erro ao processar a confirmação.');
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Confirmando seu email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        <div className="mb-6">
          {isSuccess ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {isSuccess ? 'Sucesso!' : 'Erro'}
        </h2>
        
        <p className="text-slate-600 mb-6">{message}</p>
        
        {!isSuccess && (
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all"
          >
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailConfirm;
