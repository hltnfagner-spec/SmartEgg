import { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';

const SubscriptionCard = () => {
  const {
    subscription,
    isSubscriptionLoading,
    startSubscriptionCheckout,
    isCheckoutLoading,
    checkoutError,
  } = useFarm();

  const hasSubscription = !!subscription;
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  
  // Usa trialEnd para trial, paymentDueDate para assinatura ativa
  const endDate = isTrial 
    ? (subscription?.trialEnd ? new Date(subscription.trialEnd) : null)
    : (isActive && subscription?.paymentDueDate ? new Date(subscription.paymentDueDate) : null);
    
  // Calcula dias restantes considerando fuso horário local (Brasil UTC-3)
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
    
  // Debug: mostrar valores para verificar cálculo
  if (process.env.NODE_ENV === 'development' && daysRemaining !== null) {
    console.log('[SubscriptionCard] Debug:', {
      status: subscription?.status,
      paymentDueDate: subscription?.paymentDueDate,
      endDate: endDate?.toISOString(),
      now: new Date().toISOString(),
      daysRemaining
    });
  }

  const statusLabel = useMemo(() => {
    if (subscription?.status === 'active') return 'Assinatura ativa';
    if (subscription?.status === 'trial') return 'Período de teste';
    return 'Nenhuma assinatura';
  }, [subscription]);

  if (isSubscriptionLoading) {
    return (
      <div className="h-32 rounded-2xl bg-slate-900/10 animate-pulse" />
    );
  }

  const buttonLabel = subscription?.status === 'trial' ? 'Renovar Agora' : 'Assinar Agora';

  const handleCheckout = async () => {
    const checkoutUrl = await startSubscriptionCheckout();
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 sm:p-6 shadow-2xl shadow-slate-900/40 text-white">
      <div className="flex flex-col justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="text-xl sm:text-2xl">👑</span>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">{statusLabel}</span>
              {isTrial && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-blue-500 text-white rounded-full tracking-wider">
                  Trial
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-200">
            <span>Vencimento:</span>
            <span className="font-semibold">
              {subscription?.paymentDueDate
                ? new Date(subscription.paymentDueDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'})
                : '—'}
            </span>
          </div>
          {daysRemaining !== null && (
            <div className="text-xs sm:text-sm text-emerald-300 mt-1">
              <span className="hidden sm:inline">Dias restantes: </span>
              <span className="sm:hidden">Restam: </span>
              <span className="font-semibold">{daysRemaining}</span>
              <span className="hidden sm:inline"> dias</span>
              <span className="sm:hidden">d</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button
            onClick={() => !isCheckoutLoading && handleCheckout()}
            disabled={isCheckoutLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-900 font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg shadow-emerald-500/40 hover:brightness-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>⚡</span>
            <span>{buttonLabel}</span>
          </button>
          <span className="text-[9px] sm:text-[10px] text-slate-200 text-center sm:text-right uppercase tracking-wide w-full sm:w-auto">
            <span className="hidden sm:inline">Pagamento seguro via Mercado Pago</span>
            <span className="sm:hidden">Mercado Pago Seguro</span>
          </span>
        </div>
      </div>
      {checkoutError && (
        <div className="mt-3 sm:mt-4 text-xs text-amber-200 bg-amber-500/10 p-2 rounded">
          {checkoutError}
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;
