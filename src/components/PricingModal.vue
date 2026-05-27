<template>
  <div class="pricing-overlay" @click.self="$emit('close')">
    <div class="pricing-card">
      <h2>Выбери тариф</h2>
      <div class="plans-grid">
        <div v-for="plan in plans" :key="plan.id" 
             class="plan-card" 
             :class="{ popular: plan.popular }"
             :style="{ borderColor: plan.color }">
          <div v-if="plan.popular" class="popular-badge">Популярный</div>
          <h3>{{ plan.name }}</h3>
          <div class="plan-price">{{ plan.price }}₽<span>/{{ plan.period }}</span></div>
          <ul class="plan-features">
            <li v-for="f in plan.features" :key="f">✅ {{ f }}</li>
          </ul>
          <button class="plan-btn" :style="{ background: plan.color }" @click="selectPlan(plan)">
            Выбрать {{ plan.name }}
          </button>
        </div>
      </div>
      <button class="close-btn" @click="$emit('close')">Закрыть</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PricingModal',
  emits: ['close'],
  data() {
    return { plans: [] };
  },
  async mounted() {
    try {
      const r = await axios.get('/api/plans');
      this.plans = r.data;
    } catch(e) {}
  },
  methods: {
    async selectPlan(plan) {
      try {
        const r = await axios.post('/api/create-checkout', { priceId: plan.stripePriceId });
        if (r.data.url) window.open(r.data.url, '_blank');
      } catch(e) {
        alert('Ошибка создания платежа');
      }
    }
  }
};
</script>

<style scoped>
.pricing-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.pricing-card { background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; max-width: 800px; width: 90%; color: #fff; }
.pricing-card h2 { text-align: center; font-family: 'Space Grotesk', sans-serif; margin-bottom: 24px; }
.plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr; } }
.plan-card { background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 24px; text-align: center; position: relative; }
.plan-card.popular { border-width: 2px; }
.popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #f59e0b; color: #000; padding: 4px 16px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; }
.plan-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; margin-bottom: 8px; }
.plan-price { font-size: 2rem; font-weight: 800; margin-bottom: 4px; }
.plan-price span { font-size: 0.8rem; color: #94a3b8; }
.plan-features { list-style: none; padding: 0; margin: 16px 0; text-align: left; }
.plan-features li { padding: 4px 0; font-size: 0.85rem; color: #94a3b8; }
.plan-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; font-size: 0.9rem; transition: transform 0.2s; }
.plan-btn:hover { transform: scale(1.05); }
.close-btn { display: block; margin: 20px auto 0; padding: 8px 24px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: #fff; cursor: pointer; }
</style>
