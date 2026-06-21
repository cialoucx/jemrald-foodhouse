<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Platter Size Estimator'
  },
  initialGuests: {
    type: Number,
    default: 4
  }
})

const guests = ref(props.initialGuests)

const increment = () => {
  if (guests.value < 50) guests.value++
}
const decrement = () => {
  if (guests.value > 1) guests.value--
}

const recommendation = computed(() => {
  const count = guests.value
  if (count <= 2) {
    return {
      size: '10pcs - 24pcs Maki',
      priceRange: '₱150 - ₱350',
      avgPrice: 250,
      emoji: '🍣',
      desc: 'Perfect for an intimate meal or a solo craving.'
    }
  } else if (count <= 4) {
    return {
      size: '30pcs - 40pcs Maki',
      priceRange: '₱450 - ₱535',
      avgPrice: 490,
      emoji: '🍱',
      desc: 'Great for small family dinners or casual get-togethers.'
    }
  } else if (count <= 6) {
    return {
      size: '50pcs - 60pcs Platter',
      priceRange: '₱650 - ₱800',
      avgPrice: 725,
      emoji: '🍢',
      desc: 'Ideal for group parties or weekend gatherings.'
    }
  } else {
    return {
      size: '70pcs - 100pcs Grand Platter',
      priceRange: '₱940 - ₱1,500',
      avgPrice: 1220,
      emoji: '🎉',
      desc: 'Feast-sized platters designed for major celebrations.'
    }
  }
})

const estPoints = computed(() => {
  // 1 point per 10 pesos spent
  return Math.floor(recommendation.value.avgPrice / 10)
})
</script>

<template>
  <div class="vue-card">
    <div class="vue-badge">Vue 3 Engine</div>
    <h3 class="vue-title">{{ title }}</h3>
    <p class="vue-desc">Planning a meal? Tell us how many guests are eating and we'll estimate your platter needs.</p>
    
    <div class="estimator-section">
      <div class="guest-selector">
        <label class="selector-label">Number of Guests</label>
        <div class="counter-control">
          <button @click="decrement" class="counter-btn" aria-label="Decrease guests">-</button>
          <span class="counter-val">{{ guests }}</span>
          <button @click="increment" class="counter-btn" aria-label="Increase guests">+</button>
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">
          <span class="result-emoji">{{ recommendation.emoji }}</span>
          <div>
            <div class="result-label">Recommended Platter</div>
            <div class="result-value">{{ recommendation.size }}</div>
          </div>
        </div>
        
        <p class="result-desc">{{ recommendation.desc }}</p>

        <div class="result-stats">
          <div class="stat-box">
            <span class="stat-lbl">Est. Price</span>
            <span class="stat-val highlight">{{ recommendation.priceRange }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Loyalty Points</span>
            <span class="stat-val">+{{ estPoints }} pts</span>
          </div>
        </div>
      </div>
    </div>

    <div class="vue-footer">
      Estimates based on average serving sizes. Points can be redeemed at checkout.
    </div>
  </div>
</template>

<style scoped>
.vue-card {
  background: rgba(18, 16, 14, 0.65);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 26px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--cream);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.vue-card:hover {
  transform: translateY(-2px);
  border-color: rgba(211, 18, 27, 0.4);
  box-shadow: 0 12px 40px rgba(211, 18, 27, 0.1);
}

.vue-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: linear-gradient(135deg, var(--red), var(--red-bright));
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.vue-title {
  font-family: "Playfair Display", serif;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: var(--cream);
}

.vue-desc {
  font-family: "DM Sans", sans-serif;
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0 0 4px 0;
  line-height: 1.5;
}

.estimator-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.guest-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface2);
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.selector-label {
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--muted);
}

.counter-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.counter-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--cream);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justifyContent: center;
  transition: all 0.2s ease;
  font-weight: 600;
  padding: 0;
  line-height: 1;
}

.counter-btn:hover {
  background: var(--red);
  border-color: var(--red-bright);
  color: #ffffff;
}

.counter-val {
  font-family: "Playfair Display", serif;
  font-size: 1.4rem;
  font-weight: 700;
  min-width: 28px;
  text-align: center;
}

.result-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-emoji {
  font-size: 2rem;
  line-height: 1;
}

.result-label {
  font-family: "DM Sans", sans-serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  margin-bottom: 2px;
}

.result-value {
  font-family: "DM Sans", sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cream);
}

.result-desc {
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.4;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 12px;
  margin-top: 4px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-lbl {
  font-family: "DM Sans", sans-serif;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
}

.stat-val {
  font-family: "Playfair Display", serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cream);
}

.stat-val.highlight {
  color: var(--red-bright);
}

.vue-footer {
  font-family: "DM Sans", sans-serif;
  font-size: 0.72rem;
  color: var(--muted);
  opacity: 0.6;
  margin-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 12px;
  line-height: 1.4;
}
</style>
