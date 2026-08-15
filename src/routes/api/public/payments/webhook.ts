import { createFileRoute } from '@tanstack/react-router'
import Stripe from 'stripe'
import { type StripeEnv, createStripeClient } from '@/lib/stripe.server'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'

const OWNER_EMAIL = 'rory@theroyeffect.com'
const BRIEF_BASE_URL = 'https://www.theroyeffect.com/brief'

const money = (amount: number | null | undefined, currency: string | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (currency ?? 'usd').toUpperCase(),
  }).format((amount ?? 0) / 100)

function resolveEnv(url: string): StripeEnv {
  const param = new URL(url).searchParams.get('env')
  return param === 'live' ? 'live' : 'sandbox'
}

function webhookSecret(env: StripeEnv): string {
  const key = env === 'live' ? 'PAYMENTS_LIVE_WEBHOOK_SECRET' : 'PAYMENTS_SANDBOX_WEBHOOK_SECRET'
  const value = process.env[key]
  if (!value) throw new Error(`${key} is not configured`)
  return value
}

async function handleCheckoutCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  env: StripeEnv,
) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price.product'],
  })
  const lineItem = full.line_items?.data[0]
  const price = lineItem?.price
  const product =
    price && typeof price.product !== 'string' && price.product && !('deleted' in price.product)
      ? (price.product as Stripe.Product)
      : null
  const productName = product?.name ?? lineItem?.description ?? 'Commission'
  const recurring = full.mode === 'subscription'
  const customerEmail =
    full.customer_details?.email ?? full.customer_email ?? undefined
  const amountLabel = money(full.amount_total, full.currency)

  // Record the order (idempotent on the session id).
  const { error } = await supabaseAdmin.from('orders').upsert(
    {
      stripe_session_id: full.id,
      stripe_payment_intent_id:
        typeof full.payment_intent === 'string' ? full.payment_intent : null,
      stripe_customer_id: typeof full.customer === 'string' ? full.customer : null,
      customer_email: customerEmail ?? null,
      customer_name: full.customer_details?.name ?? null,
      price_id: full.metadata?.['price_lookup_key'] ?? price?.lookup_key ?? null,
      product_name: productName,
      tier_label: full.metadata?.['tier_label'] ?? null,
      purchase_kind: recurring ? 'subscription' : 'one_time',
      amount_total: full.amount_total ?? 0,
      currency: full.currency ?? 'usd',
      payment_status: full.payment_status ?? 'unpaid',
      environment: env,
      emails_sent: false,
    },
    { onConflict: 'stripe_session_id' },
  )
  if (error) console.error('Order insert failed:', error.message)

  // Notify Rory, and send the client a receipt plus the brief link.
  try {
    await sendTemplateEmail('order-notification', OWNER_EMAIL, {
      templateData: {
        productName,
        amountLabel,
        customerEmail,
        customerName: full.customer_details?.name ?? '',
        kind: recurring ? 'subscription' : 'one-time',
        environment: env,
      },
      idempotencyKey: `order-notification-${full.id}`,
      ...(customerEmail ? { replyTo: customerEmail } : {}),
    })

    if (customerEmail) {
      await sendTemplateEmail('order-confirmation', customerEmail, {
        templateData: { productName, amountLabel, briefUrl: `${BRIEF_BASE_URL}?session_id=${encodeURIComponent(full.id)}`, recurring },
        idempotencyKey: `order-confirmation-${full.id}`,
        replyTo: OWNER_EMAIL,
      })
    }

    await supabaseAdmin
      .from('orders')
      .update({ emails_sent: true })
      .eq('stripe_session_id', full.id)
  } catch (mailError) {
    console.error('Order emails failed:', mailError)
  }
}

async function handleSubscriptionEvent(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  eventType: string,
  env: StripeEnv,
) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

  const item = subscription.items.data[0]
  const priceId = item?.price?.lookup_key ?? null
  let productName = 'Design Retainer'
  const productRef = item?.price?.product
  if (typeof productRef === 'string') {
    try {
      const product = await stripe.products.retrieve(productRef)
      productName = product.name
    } catch {
      /* keep default */
    }
  }

  let customerEmail: string | null = null
  if (typeof subscription.customer === 'string') {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer)
      if (!('deleted' in customer)) customerEmail = customer.email ?? null
    } catch {
      /* ignore */
    }
  }

  const periodEndUnix = (item as unknown as { current_period_end?: number } | undefined)
    ?.current_period_end
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null

  const { error } = await supabaseAdmin.from('retainer_subscriptions').upsert(
    {
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === 'string' ? subscription.customer : null,
      customer_email: customerEmail,
      price_id: priceId,
      product_name: productName,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      current_period_end: periodEnd ? periodEnd.toISOString() : null,
      environment: env,
    },
    { onConflict: 'stripe_subscription_id' },
  )
  if (error) console.error('Subscription upsert failed:', error.message)

  const event =
    eventType === 'customer.subscription.created'
      ? 'started'
      : eventType === 'customer.subscription.deleted'
        ? 'ended'
        : subscription.cancel_at_period_end
          ? 'cancellation scheduled'
          : 'updated'

  try {
    await sendTemplateEmail('subscription-notification', OWNER_EMAIL, {
      templateData: {
        event,
        productName,
        customerEmail,
        status: subscription.status,
        periodEnd: periodEnd
          ? periodEnd.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '',
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      },
      idempotencyKey: `subscription-${subscription.id}-${eventType}-${subscription.status}-${subscription.cancel_at_period_end}`,
      ...(customerEmail ? { replyTo: customerEmail } : {}),
    })
  } catch (mailError) {
    console.error('Subscription email failed:', mailError)
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = resolveEnv(request.url)
        const signature = request.headers.get('stripe-signature')
        const body = await request.text()

        if (!signature) return new Response('Missing signature', { status: 401 })

        const stripe = createStripeClient(env)
        let event: Stripe.Event
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret(env),
            undefined,
            Stripe.createSubtleCryptoProvider(),
          )
        } catch (error) {
          console.error('Webhook signature verification failed:', error)
          return new Response('Invalid signature', { status: 401 })
        }

        try {
          switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded': {
              const session = event.data.object as Stripe.Checkout.Session
              // Delayed methods (SEPA, boleto...) stay "unpaid" until they
              // settle — wait for async_payment_succeeded before fulfilling.
              if (session.payment_status !== 'unpaid') {
                await handleCheckoutCompleted(stripe, session, env)
              }
              break
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
              await handleSubscriptionEvent(
                stripe,
                event.data.object as Stripe.Subscription,
                event.type,
                env,
              )
              break
            default:
              break
          }
        } catch (error) {
          console.error(`Webhook handling failed for ${event.type}:`, error)
          return new Response('Handler error', { status: 500 })
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
