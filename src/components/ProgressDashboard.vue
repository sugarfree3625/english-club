<template>
  <div class="progress-dashboard">
    <!-- 3D Спираль -->
    <div class="spiral-container" ref="spiralContainer"></div>
    
    <!-- Виджеты -->
    <div class="widgets-panel">
      <div 
        class="widget-card"
        v-for="(widget, index) in widgets"
        :key="index"
        @mousemove="handleWidgetTilt($event, index)"
        @mouseleave="resetWidgetTilt(index)"
        @click="handleWidgetClick(index)"
        ref="widgetRefs"
      >
        <div class="widget-icon" :style="{ background: widget.gradient }">
          <span class="widget-emoji">{{ widget.icon }}</span>
        </div>
        <div class="widget-content">
          <h3 class="widget-label">{{ widget.label }}</h3>
          <div class="widget-value">
            <span class="counter-number">{{ widget.displayValue }}</span>
            <span class="counter-suffix">{{ widget.suffix }}</span>
          </div>
          <div class="widget-progress">
            <div 
              class="widget-progress-fill"
              :style="{ 
                width: widget.progress + '%',
                background: widget.gradient 
              }"
            ></div>
          </div>
          <span class="widget-change" :class="widget.change > 0 ? 'positive' : 'negative'">
            {{ widget.change > 0 ? '+' : '' }}{{ widget.change }}{{ widget.unit }}
          </span>
        </div>
        <div class="hologram-glare"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as THREE from 'three';
import anime from 'animejs';

// Refs
const spiralContainer = ref(null);
const widgetRefs = ref([]);

// Three.js
let scene, camera, renderer, animationFrame;
let spiralGroup;

// Widgets data
const widgets = ref([
  {
    label: 'Слова',
    icon: '📚',
    value: 450,
    displayValue: 0,
    suffix: 'слов',
    progress: 75,
    change: 45,
    unit: ' за неделю',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    tiltX: 0,
    tiltY: 0,
  },
  {
    label: 'Уроки',
    icon: '🎯',
    value: 32,
    displayValue: 0,
    suffix: 'уроков',
    progress: 64,
    change: 8,
    unit: ' в этом месяце',
    gradient: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
    tiltX: 0,
    tiltY: 0,
  },
  {
    label: 'Ачивки',
    icon: '🏆',
    value: 12,
    displayValue: 0,
    suffix: 'достижений',
    progress: 40,
    change: -3,
    unit: ' до цели',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    tiltX: 0,
    tiltY: 0,
  },
]);

// ===== THREE.JS DNA SPIRAL =====
const initSpiral = () => {
  if (!spiralContainer.value) return;
  
  const container = spiralContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 12;
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  spiralGroup = new THREE.Group();
  
  const segments = 20;
  const heightTotal = 6;
  const radius = 1.5;
  
  createStrand('#6366f1', segments, heightTotal, radius, 0);
  createStrand('#2dd4bf', segments, heightTotal, radius, Math.PI);
  createBridges(segments, heightTotal, radius);
  
  scene.add(spiralGroup);
  
  const ambientLight = new THREE.AmbientLight('#6366f1', 0.3);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight('#2dd4bf', 1, 15);
  pointLight.position.set(3, 2, 5);
  scene.add(pointLight);
  
  createParticles();
  animateSpiral();
};

const createStrand = (color, segments, heightTotal, radius, offset) => {
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 4 + offset;
    const x = Math.cos(angle) * radius;
    const y = (t - 0.5) * heightTotal;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.08, 8, false);
  
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.8,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.7,
  });
  
  const tube = new THREE.Mesh(tubeGeometry, material);
  spiralGroup.add(tube);
};

const createBridges = (segments, heightTotal, radius) => {
  for (let i = 0; i <= segments; i += 2) {
    const t = i / segments;
    const angle = t * Math.PI * 4;
    
    const x1 = Math.cos(angle) * radius;
    const y1 = (t - 0.5) * heightTotal;
    const z1 = Math.sin(angle) * radius;
    
    const bridgeGeometry = new THREE.CylinderGeometry(0.03, 0.03, radius * 2, 6);
    const bridgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      emissive: 0x6366f1,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.4,
    });
    
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, y1, 0);
    bridge.rotation.z = Math.PI / 2;
    
    spiralGroup.add(bridge);
  }
};

const createParticles = () => {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 50;
  const positions = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x6366f1,
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  spiralGroup.add(particles);
};

const animateSpiral = () => {
  animationFrame = requestAnimationFrame(animateSpiral);
  
  if (spiralGroup) {
    spiralGroup.rotation.y += 0.003;
    spiralGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// ===== WIDGET INTERACTIONS =====
const handleWidgetTilt = (event, index) => {
  const widget = widgetRefs.value[index];
  if (!widget) return;
  
  const rect = widget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const rotateY = ((event.clientX - centerX) / rect.width) * 15;
  const rotateX = ((centerY - event.clientY) / rect.height) * 15;
  
  widgets.value[index].tiltX = rotateX;
  widgets.value[index].tiltY = rotateY;
  
  widget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
};

const resetWidgetTilt = (index) => {
  const widget = widgetRefs.value[index];
  if (!widget) return;
  
  widgets.value[index].tiltX = 0;
  widgets.value[index].tiltY = 0;
  
  widget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
};

const handleWidgetClick = (index) => {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
  
  const widget = widgetRefs.value[index];
  if (!widget) return;
  
  widget.style.transform = 'perspective(1000px) scale(0.95)';
  setTimeout(() => {
    widget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  }, 150);
};

// ===== COUNTER ANIMATION =====
const animateCounters = () => {
  widgets.value.forEach((widget, index) => {
    const targetValue = widget.value;
    const duration = 2000;
    
    anime({
      targets: widget,
      displayValue: targetValue,
      round: 1,
      duration: duration,
      delay: index * 300,
      easing: 'easeOutCubic',
      update: () => {
        widgets.value[index] = { ...widgets.value[index] };
      }
    });
  });
};

const handleResize = () => {
  if (!spiralContainer.value || !renderer || !camera) return;
  
  const container = spiralContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

onMounted(async () => {
  await nextTick();
  initSpiral();
  animateCounters();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame);
  
  if (renderer) {
    renderer.dispose();
    if (spiralContainer.value && renderer.domElement) {
      spiralContainer.value.removeChild(renderer.domElement);
    }
  }
  
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.progress-dashboard {
  display: flex;
  gap: 40px;
  padding: 40px;
  min-height: 500px;
  background: var(--bg, #0b1120);
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.spiral-container {
  width: 400px;
  height: 400px;
  position: relative;
}

.widgets-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.widget-card {
  position: relative;
  width: 280px;
  padding: 24px;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(12px);
  display: flex;
  gap: 16px;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  perspective: 1000px;
  overflow: hidden;
}

.widget-card:hover {
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.2),
              0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.widget-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.widget-emoji {
  font-size: 1.5rem;
}

.widget-content {
  flex: 1;
}

.widget-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: var(--t2, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.widget-value {
  font-family: 'Space Grotesk', monospace;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--t, #ffffff);
  margin-bottom: 6px;
}

.counter-suffix {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--t2, #94a3b8);
  margin-left: 6px;
}

.widget-progress {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  margin-bottom: 6px;
  overflow: hidden;
}

.widget-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.widget-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.widget-change.positive {
  color: #10b981;
}

.widget-change.negative {
  color: #ef4444;
}

.hologram-glare {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(99, 102, 241, 0.05) 45%,
    rgba(45, 212, 191, 0.08) 50%,
    rgba(99, 102, 241, 0.05) 55%,
    transparent 60%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.widget-card:hover .hologram-glare {
  opacity: 1;
  animation: glareScan 2s ease-in-out infinite;
}

@keyframes glareScan {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

@media (max-width: 768px) {
  .progress-dashboard {
    flex-direction: column;
    padding: 20px;
    gap: 20px;
  }
  
  .spiral-container {
    width: 300px;
    height: 300px;
  }
  
  .widget-card {
    width: 100%;
    max-width: 300px;
  }
}
</style>
