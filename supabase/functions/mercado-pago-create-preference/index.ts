import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreatePreferenceParams = {
  title: string;
  quantity: number;
  unitPrice: number;
  currencyId?: string;
  payerEmail?: string;
  metadata?: Record<string, unknown>;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  autoReturn?: 'approved' | 'all';
};

const sanitizePayload = <T,>(payload: T): T => JSON.parse(JSON.stringify(payload));

Deno.serve(async (req) => {
  // Force cache bust v2
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[MP Create Preference] v2 - Request received', { method: req.method, url: req.url });
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !mercadoPagoAccessToken) {
      console.error('[MP Create Preference] Missing SUPABASE_URL, SUPABASE_ANON_KEY or MERCADO_PAGO_ACCESS_TOKEN');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.warn('[MP Create Preference] Unauthorized', { userError: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bodyText = await req.text();
    let params: CreatePreferenceParams;
    try {
      params = bodyText ? JSON.parse(bodyText) : ({} as CreatePreferenceParams);
    } catch {
      console.warn('[MP Create Preference] Invalid JSON body');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!params?.title || !params?.quantity || !params?.unitPrice) {
      console.warn('[MP Create Preference] Missing required fields', { title: params?.title, quantity: (params as any)?.quantity, unitPrice: (params as any)?.unitPrice });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, quantity, unitPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quantity = typeof (params as any).quantity === 'string'
      ? Number((params as any).quantity)
      : (params as any).quantity;
    const unitPrice = typeof (params as any).unitPrice === 'string'
      ? Number((params as any).unitPrice)
      : (params as any).unitPrice;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      console.warn('[MP Create Preference] Invalid quantity', { quantity, raw: (params as any).quantity });
      return new Response(
        JSON.stringify({ error: 'Invalid quantity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      console.warn('[MP Create Preference] Invalid unitPrice', { unitPrice, raw: (params as any).unitPrice });
      return new Response(
        JSON.stringify({ error: 'Invalid unitPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const defaultReturnUrl = 'https://smartegg.app.br/dashboard?checkout=mercadopago';
    
    const backUrls = {
      success: params.backUrls?.success || defaultReturnUrl,
      failure: params.backUrls?.failure || defaultReturnUrl,
      pending: params.backUrls?.pending || defaultReturnUrl,
    };

    const autoReturn = params.autoReturn ?? 'approved';

    const mpBody = sanitizePayload({
      items: [
        {
          title: params.title,
          quantity,
          unit_price: unitPrice,
          currency_id: params.currencyId ?? 'BRL',
        },
      ],
      payer: params.payerEmail ? { email: params.payerEmail } : undefined,
      metadata: {
        ...(params.metadata ?? {}),
        userId: userData.user.id,
      },
      back_urls: backUrls,
      auto_return: params.autoReturn ?? autoReturn,
    });

    console.log('[MP Create Preference] Calling Mercado Pago', {
      userId: userData.user.id,
      title: params.title,
      quantity,
      unitPrice,
      currencyId: params.currencyId ?? 'BRL',
      backUrls,
      autoReturn,
    });

    console.log('[MP Create Preference] Full payload to MP:', JSON.stringify(mpBody, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mpBody),
    });

    if (!mpResponse.ok) {
      const contentType = mpResponse.headers.get('content-type') ?? '';
      const errorPayload = contentType.includes('application/json')
        ? await mpResponse.json().catch(() => null)
        : await mpResponse.text().catch(() => null);

      console.error('[MP Create Preference] Mercado Pago error', {
        status: mpResponse.status,
        details: errorPayload,
      });

      return new Response(
        JSON.stringify({
          error: 'Mercado Pago error',
          status: mpResponse.status,
          details: errorPayload ?? mpResponse.statusText,
        }),
        { status: mpResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await mpResponse.json();

    return new Response(
      JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        preference_id: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[MP Create Preference] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
