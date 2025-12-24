import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    if (!signature || !requestId) {
      console.warn('[Webhook] Missing signature or request-id');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[Webhook] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    let data: any;
    try {
      data = body ? JSON.parse(body) : {};
    } catch (parseError) {
      console.error('[Webhook] Invalid JSON body');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[Webhook] Received webhook:', { 
      type: data.type, 
      action: data.action,
      data: data.data 
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Handle payment approval
    if (
      data?.type === 'payment' &&
      (data?.action === 'payment.created' || data?.action === 'payment.updated')
    ) {
      const paymentId = data?.data?.id;

      if (!paymentId) {
        console.error('[Webhook] Missing payment id in payload');
        return new Response(
          JSON.stringify({ error: 'Missing payment id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!mercadoPagoAccessToken) {
        console.error('[Webhook] Missing MERCADO_PAGO_ACCESS_TOKEN');
        return new Response(
          JSON.stringify({ error: 'Server misconfiguration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get payment details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mpResponse.ok) {
        console.error('[Webhook] Failed to get payment details:', mpResponse.statusText);
        return new Response(
          JSON.stringify({ error: 'Failed to verify payment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payment = await mpResponse.json();
      console.log('[Webhook] Payment details:', { 
        id: payment.id, 
        status: payment.status, 
        status_detail: payment.status_detail,
        metadata: payment.metadata 
      });

      // If payment is approved, update subscription
      if (payment.status === 'approved') {
        const userId = payment.metadata?.userId ?? payment.metadata?.user_id;
        
        if (!userId) {
          console.error('[Webhook] No userId found in payment metadata');
          return new Response(
            JSON.stringify({ error: 'Invalid payment metadata' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update subscription in database
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'active',
            last_payment_at: new Date().toISOString(),
            payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            mp_payment_id: paymentId.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[Webhook] Error updating subscription:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Webhook] Subscription activated for user:', userId);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
