import { supabase } from './supabaseClient';

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;

export interface CreatePreferenceParams {
  title: string;
  quantity: number;
  unitPrice: number;
  currencyId?: string;
  payerEmail?: string;
  metadata?: Record<string, any>;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  autoReturn?: 'approved' | 'all';
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  preference_id?: string;
}

export interface MercadoPagoPayment {
  id: string;
  status: string;
  status_detail: string;
  payment_method_id?: string;
  payment_type_id?: string;
  preference_id?: string;
}

const sanitizePayload = <T>(payload: T): T =>
  JSON.parse(JSON.stringify(payload));

export const createMercadoPagoPreference = async (
  params: CreatePreferenceParams
): Promise<MercadoPagoPreferenceResponse> => {
  const body = sanitizePayload(params);

  console.debug('[MercadoPago] Payload enviado:', JSON.stringify(body));

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke('mercado-pago-create-preference', {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    const anyError = error as any;
    const ctx = anyError?.context;
    const status = typeof ctx?.status === 'number' ? ctx.status : undefined;
    const resp: any = ctx?.response;
    let detailsText = '';
    if (resp && typeof resp.text === 'function') {
      try {
        detailsText = await resp.text();
      } catch {
        detailsText = '';
      }
    }

    if (!detailsText) {
      const details = ctx?.body ?? undefined;
      detailsText =
        typeof details === 'string'
          ? details
          : details
            ? JSON.stringify(details)
            : '';
    }
    const suffix = `${status ? ` (status ${status})` : ''}${detailsText ? `: ${detailsText}` : ''}`;
    throw new Error(`${error.message}${suffix}`);
  }

  return data as MercadoPagoPreferenceResponse;
};

export const getMercadoPagoPayment = async (
  paymentId: string
): Promise<MercadoPagoPayment> => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke('mercado-pago-get-payment', {
    body: { paymentId },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    const anyError = error as any;
    const ctx = anyError?.context;
    const status = typeof ctx?.status === 'number' ? ctx.status : undefined;
    const resp: any = ctx?.response;
    let detailsText = '';
    if (resp && typeof resp.text === 'function') {
      try {
        detailsText = await resp.text();
      } catch {
        detailsText = '';
      }
    }

    if (!detailsText) {
      const details = ctx?.body ?? undefined;
      detailsText =
        typeof details === 'string'
          ? details
          : details
            ? JSON.stringify(details)
            : '';
    }
    const suffix = `${status ? ` (status ${status})` : ''}${detailsText ? `: ${detailsText}` : ''}`;
    throw new Error(`${error.message}${suffix}`);
  }

  return data as MercadoPagoPayment;
};

export const getMercadoPagoPublicKey = () => MP_PUBLIC_KEY;
