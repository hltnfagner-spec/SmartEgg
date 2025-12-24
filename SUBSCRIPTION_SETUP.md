# SmartEgg Subscription System Setup

This document explains how to set up and test the subscription system with Mercado Pago integration.

## Prerequisites

1. **Mercado Pago Account**: Create a Mercado Pago developer account at https://www.mercadopago.com/developers
2. **Supabase Project**: Have a running Supabase project with the subscriptions table created

## Setup Steps

### 1. Configure Mercado Pago

1. Go to [Mercado Pago Developers](https://www.mercadopago.com/developers/panel)
2. Create a new application or use an existing one
3. Get your **Public Key** and **Access Token**
4. Configure Webhook URLs:
   - Production: `https://your-project.supabase.co/functions/v1/mercado-pago-webhook`
   - Sandbox: `https://your-project.supabase.co/functions/v1/mercado-pago-webhook`

### 2. Environment Variables

Create a `.env` file in the project root with:

```env
# Mercado Pago Configuration
VITE_MP_PUBLIC_KEY=your_public_key_here
VITE_MP_ACCESS_TOKEN=your_access_token_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Deploy Webhook Function

Deploy the Mercado Pago webhook to Supabase:

```bash
# Navigate to your project directory
cd supabase/functions/mercado-pago-webhook

# Deploy the function
supabase functions deploy mercado-pago-webhook
```

### 4. Set Environment Variables for Edge Function

In your Supabase dashboard, set the following secrets for the Edge Function:

- `MERCADO_PAGO_ACCESS_TOKEN`: Your Mercado Pago access token
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_URL`: Your Supabase URL

## Testing the Subscription Flow

### 1. Test Trial Period

1. Create a new user account
2. The system should automatically create a trial subscription
3. Verify the trial period works (default 7 days)

### 2. Test Payment Flow

1. After trial expires or for new subscriptions:
   - Click "Assinar Agora" button
   - You'll be redirected to Mercado Pago checkout
   - Complete the payment process
   - After payment, you'll be redirected back to the app

### 3. Test Webhook

1. Simulate a webhook notification from Mercado Pago
2. Check that the subscription status is updated in the database
3. Verify the user can access the app after payment

## Database Schema

The `subscriptions` table should have the following structure:

```sql
CREATE TABLE subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'trial',
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '7 days'),
  payment_due_date timestamptz,
  last_payment_at timestamptz,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Subscription Status Values

- `trial`: User is in trial period
- `active`: Subscription is active and paid
- `expired`: Subscription has expired
- `blocked`: Subscription is blocked

## Troubleshooting

### Common Issues

1. **Webhook not receiving notifications**: 
   - Check webhook URL is correctly configured in Mercado Pago
   - Verify Edge Function is deployed and accessible

2. **Payment not updating subscription**:
   - Check webhook logs in Supabase
   - Verify payment metadata includes userId
   - Check database permissions

3. **Trial not working**:
   - Verify trial_end date is set correctly
   - Check subscription status in database

### Debug Mode

Enable debug logging by checking the browser console for:
- `[App]` - App-level logs
- `[FarmContext]` - Context-level logs
- `[Webhook]` - Webhook processing logs

## Security Considerations

1. Never expose the Mercado Pago access token in client-side code
2. Use environment variables for sensitive data
3. Validate webhook signatures in production
4. Implement proper error handling for payment failures

## Production Checklist

- [ ] Use production Mercado Pago credentials
- [ ] Set up proper webhook security
- [ ] Configure proper CORS settings
- [ ] Test with real payment methods
- [ ] Set up monitoring for payment failures
- [ ] Create customer support process for payment issues
