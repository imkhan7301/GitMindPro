import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, email, successUrl, cancelUrl, trial } = req.body;

    if (!priceId || !userId || !email) {
      return res.status(400).json({ error: 'Missing required fields: priceId, userId, email' });
    }

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId },
      success_url: successUrl || `${req.headers.origin}/?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/?checkout=canceled`,
    };

    // Add 7-day free trial when requested
    if (trial) {
      sessionParams.subscription_data = {
        trial_period_days: 7,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
