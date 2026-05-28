const { auth } = require('../middleware/auth');

module.exports = (app, supabase) => {
  // Получить тарифы
  app.get('/api/plans', auth, async (req, res) => {
    const plans = [
      { id: 'basic', name: 'Базовый', price: 990, period: 'месяц', features: ['Чат', 'Календарь', '10 встреч/мес'], stripePriceId: 'price_basic', color: '#6366f1' },
      { id: 'pro', name: 'PRO', price: 2490, period: 'месяц', features: ['Всё из Базового', 'Видеозвонки', '50 встреч/мес', 'Ачивки'], stripePriceId: 'price_pro', color: '#2dd4bf', popular: true },
      { id: 'vip', name: 'VIP', price: 4990, period: 'месяц', features: ['Всё из PRO', 'Безлимит', 'Персональный учитель', 'Сертификат'], stripePriceId: 'price_vip', color: '#f59e0b' }
    ];
    res.json(plans);
  });

  // Создать платёж Stripe
  app.post('/api/create-checkout', auth, async (req, res) => {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: req.body.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?payment=success`,
        cancel_url: `${req.headers.origin}/dashboard?payment=cancel`,
        client_reference_id: req.session.userId.toString()
      });
      res.json({ url: session.url });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Проверить статус подписки
  app.get('/api/subscription', auth, async (req, res) => {
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', req.session.userId).single();
    res.json(data || { plan: 'free', active: false });
  });

  // Webhook Stripe
  app.post('/api/stripe-webhook', async (req, res) => {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await supabase.from('subscriptions').upsert({
          user_id: parseInt(session.client_reference_id),
          plan: session.metadata?.plan || 'pro',
          active: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
        });
      }
      res.json({ received: true });
    } catch(e) {
      res.status(400).json({ error: e.message });
    }
  });
};
