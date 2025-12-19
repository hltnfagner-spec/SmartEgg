import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { EmailOtpType } from '@supabase/supabase-js';

const EmailConfirm = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('[EmailConfirm] URL:', window.location.href);
        console.log('[EmailConfirm] Search:', window.location.search);
        console.log('[EmailConfirm] Hash:', window.location.hash);
        
        // Safari pode ter problemas com URLSearchParams, tentar abordagem alternativa
        let urlParams: URLSearchParams;
        let searchSource = window.location.search;
        
        // Tentar obter parâmetros do hash também (alguns clientes de email podem fazer isso)
        if (!searchSource && window.location.hash && window.location.hash.includes('?')) {
          searchSource = window.location.hash.split('?')[1];
        }
        
        // Se ainda não temos search, tentar hash direto
        if (!searchSource && window.location.hash) {
          searchSource = window.location.hash.substring(1);
        }
        
        try {
          urlParams = new URLSearchParams(searchSource);
        } catch (e) {
          // Fallback manual para Safari
          urlParams = new URLSearchParams();
          if (searchSource) {
            const search = searchSource.startsWith('?') ? searchSource.substring(1) : searchSource;
            const pairs = search.split('&');
            pairs.forEach(pair => {
              const [key, value] = pair.split('=');
              if (key && value) {
                urlParams.set(key, decodeURIComponent(value));
              }
            });
          }
        }
        
        const token_hash = urlParams.get('token_hash');
        const type = urlParams.get('type') as EmailOtpType;
        const error = urlParams.get('error');
        const error_code = urlParams.get('error_code');
        const error_description = urlParams.get('error_description');

        console.log('[EmailConfirm] Parsed params:', { token_hash: !!token_hash, type, error, error_code });

        // Se não encontrou parâmetros, mostrar mensagem de debug
        if (!token_hash && !type && !error) {
          console.error('[EmailConfirm] Nenhum parâmetro encontrado na URL');
          setMessage('Link de confirmação inválido ou corrompido. Verifique se você copiou o link completo do email.');
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        // Tratar erros do Supabase
        if (error) {
          setErrorCode(error_code || '');
          switch (error_code) {
            case 'otp_expired':
              setMessage('O link de confirmação expirou. Por favor, solicite um novo email de confirmação.');
              break;
            case 'access_denied':
              setMessage('Acesso negado. O link é inválido ou já foi utilizado.');
              break;
            default:
              setMessage(error_description?.replace(/\+/g, ' ') || 'Erro ao confirmar email. Tente novamente.');
          }
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        if (token_hash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type,
            token_hash,
          });

          if (verifyError) {
            console.error('Erro na verificação de email:', verifyError);
            setMessage('Erro ao confirmar email. O link pode ter expirado.');
            setIsSuccess(false);
          } else {
            setMessage('Email confirmado com sucesso! Redirecionando...');
            setIsSuccess(true);
            
            // Aguardar um pouco e verificar se a sessão foi estabelecida
            setTimeout(async () => {
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                
                if (sessionData.session) {
                  window.location.href = '/?view=dashboard';
                } else {
                  // Tentar novamente após um pequeno delay
                  setTimeout(() => {
                    window.location.href = '/?view=dashboard';
                  }, 1000);
                }
              } catch (error) {
                console.error('Erro ao verificar sessão após confirmação:', error);
                // Mesmo com erro, tentar redirecionar para dashboard
                window.location.href = '/?view=dashboard';
              }
            }, 2000);
          }
        } else {
          setMessage('Link de confirmação inválido. Faltando parâmetros necessários.');
          setIsSuccess(false);
        }
      } catch (err) {
        console.error('Erro geral na confirmação de email:', err);
        setMessage('Ocorreu um erro ao processar a confirmação. Tente novamente.');
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
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              Voltar para o login
            </button>
            {(errorCode === 'otp_expired' || errorCode === 'access_denied') && (
              <button
                onClick={() => window.location.href = '/?resend_confirmation=true'}
                className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg shadow-lg transition-all"
                disabled={resending}
              >
                {resending ? 'Enviando...' : 'Reenviar email de confirmação'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirm;
