import { useFarm } from '../context/FarmContext';

export const SubscriptionStatus = () => {
  const { 
    subscription, 
    isSubscriptionLoading, 
    startSubscriptionCheckout,
    isCheckoutLoading
  } = useFarm();

  if (isSubscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status da assinatura...</p>
        </div>
      </div>
    );
  }

  const isTrialExpired = subscription?.status === 'trial' && 
    subscription.trialEnd && 
    new Date(subscription.trialEnd) < new Date();

  const isSubscriptionActive = subscription?.status === 'active' || 
    (subscription?.status === 'trial' && !isTrialExpired);

  if (isSubscriptionActive) {
    return null;
  }

  const handleSubscribe = async () => {
    try {
      const checkoutUrl = await startSubscriptionCheckout();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isTrialExpired 
            ? 'Seu período de avaliação expirou' 
            : 'Assinatura necessária'}
        </h3>
        <p className="text-gray-500 mb-6">
          {isTrialExpired
            ? 'Para continuar usando o SmartEgg, assine agora mesmo e tenha acesso ilimitado a todas as funcionalidades.'
            : 'Seu acesso ao SmartEgg requer uma assinatura ativa.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={isCheckoutLoading}
            className="w-full justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isCheckoutLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processando...
              </>
            ) : (
              'Assinar Agora - R$29,90/mês'
            )}
          </button>
          {isTrialExpired && (
            <button
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              onClick={() => {
                // Clear local storage and reload to force logout (preservando alertas)
                Object.keys(localStorage).forEach(key => {
                  if (!key.startsWith('smartegg_')) {
                    localStorage.removeItem(key);
                  }
                });
                sessionStorage.clear();
                window.location.href = '/';
              }}
            >
              Sair
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
