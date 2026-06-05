<template>
  <section class="hero-section" ref="heroSection">
    <div class="canvas-container" ref="canvasContainer"></div>

    <div class="hero-content">
      <div class="hero-text-wrapper">
        <h1 
          class="hero-title"
          ref="heroTitle"
          @mouseenter="shatterText"
          @mouseleave="reassembleText"
        >
          <span 
            v-for="(char, index) in titleChars" 
            :key="index"
            class="char-particle"
            :ref="el => { if (el) charRefs[index] = el }"
            :style="{ 
              '--char-index': index,
              color: index === 0 ? '#6366f1' : '#ffffff'
            }"
          >
            {{ char }}
          </span>
        </h1>

        <p class="hero-subtitle">
          <span class="typewriter-text">{{ displayedSubtitle }}</span>
          <span class="cursor-blink">|</span>
        </p>
      </div>

      <button 
        class="cta-button"
        ref="ctaButton"
        @mousemove="handleMagneticEffect"
        @mouseleave="resetMagneticEffect"
        @click="handleCTAClick"
      >
        <span class="cta-text">Начать говорить</span>
        <div class="cta-glow"></div>
      </button>

      <div class="scroll-indicator">
        <div class="scroll-line"></div>
        <span class="scroll-text">Прокрутите вниз</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as THREE from 'three';
import anime from 'animejs';
import confetti from 'canvas-confetti';

const heroSection = ref(null);
const canvasContainer = ref(null);
const heroTitle = ref(null);
const ctaButton = ref(null);
const charRefs = ref([]);

const fullTitle = 'Анна Петрова';
const titleChars = ref(fullTitle.split(''));

const fullSubtitle = 'Разговорный клуб нового поколения. Практикуй английский с удовольствием.';
const displayedSubtitle = ref('');
let typewriterTimer = null;

let scene, camera, renderer, animationFrame;
let meshes = [];
let mouseX = 0, mouseY = 0;
let ctaRipple = null;

const startTypewriter = () => {
  let index = 0;
  displayedSubtitle.value = '';
  typewriterTimer = setInterval(() => {
    if (index < fullSubtitle.length) {
      displayedSubtitle.value += fullSubtitle[index];
      index++;
    } else {
      clearInterval(typewriterTimer);
    }
  }, 50);
};

const shatterText = () => {
  if (!charRefs.value?.length) return;
  charRefs.value.forEach((el, index) => {
    if (!el) return;
    const angle = (Math.random() * Math.PI * 2);
    const distance = 100 + Math.random() * 200;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 100;
    anime({
      targets: el,
      translateX: [
        { value: tx * 0.5, duration: 150, easing: 'easeOutQuad' },
        { value: 0, duration: 600, easing: 'easeInOutQuad' }
      ],
      translateY: [
        { value: ty * 0.5, duration: 150, easing: 'easeOutQuad' },
        { value: 0, duration: 600, easing: 'easeInOutQuad' }
      ],
      rotate: [
        { value: Math.random() * 360, duration: 150 },
        { value: 0, duration: 600 }
      ],
      scale: [
        { value: 1.5, duration: 150 },
        { value: 1, duration: 600 }
      ],
      opacity: [
        { value: 0.3, duration: 150 },
        { value: 1, duration: 600 }
      ],
      delay: index * 10,
      easing: 'easeOutElastic(1, .5)'
    });
  });
};

const reassembleText = () => {
  if (!charRefs.value?.length) return;
  charRefs.value.forEach((el, index) => {
    if (!el) return;
    anime({
      targets: el,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      duration: 400,
      delay: index * 5,
      easing: 'easeOutQuad'
    });
  });
};

const handleMagneticEffect = (event) => {
  const btn = ctaButton.value;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  if (distance < 80) {
    const moveX = deltaX * 0.3;
    const moveY = deltaY * 0.3;
    anime({
      targets: btn,
      translateX: moveX,
      translateY: moveY,
      scale: 1.05,
      duration: 200,
      easing: 'easeOutQuad'
    });
  }
};

const resetMagneticEffect = () => {
  const btn = ctaButton.value;
  if (!btn) return;
  anime({
    targets: btn,
    translateX: 0,
    translateY: 0,
    scale: 1,
    duration: 300,
    easing: 'easeOutElastic(1, .6)'
  });
};

// 🔥 КНОПКА CTA С КОНФЕТТИ
const handleCTAClick = () => {
  const btn = ctaButton.value;
  if (!btn) return;
  
  // Ripple effect
  if (ctaRipple) ctaRipple.remove();
  ctaRipple = document.createElement('div');
  ctaRipple.className = 'cta-ripple';
  btn.appendChild(ctaRipple);
  setTimeout(() => { if (ctaRipple) ctaRipple.remove(); }, 1000);
  
  // Конфетти!
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.7 },
    colors: ['#6366f1', '#2dd4bf', '#f59e0b', '#ffffff', '#818cf8'],
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ['circle', 'square'],
  });
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8, x: 0.3 },
      colors: ['#2dd4bf', '#6366f1'],
    });
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8, x: 0.7 },
      colors: ['#f59e0b', '#6366f1'],
    });
  }, 300);
};

// ===== THREE.JS СЦЕНА С БУКВАМИ, ОБЛАКАМИ И СИМВОЛАМИ =====
const initThreeJS = () => {
  if (!canvasContainer.value) return;
  
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Стеклянные буквы
  const letters = ['A', 'B', 'C', 'E', 'G', 'L', 'N', 'S', 'H', 'I'];
  letters.forEach((letter) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'Bold 100px Inter, Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const geometry = new THREE.PlaneGeometry(0.6, 0.6);
    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      transparent: true,
      opacity: 0.15 + Math.random() * 0.2,
      roughness: 0.1,
      metalness: 0.1,
      emissive: new THREE.Color(Math.random() > 0.5 ? '#6366f1' : '#2dd4bf'),
      emissiveIntensity: 0.4,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() - 0.5) * 5;
    mesh.position.y = (Math.random() - 0.5) * 3.5;
    mesh.position.z = (Math.random() - 0.5) * 2 - 0.5;
    
    mesh.userData = {
      rotationSpeed: { x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.005, z: 0 },
      floatSpeed: 0.3 + Math.random() * 0.5,
      floatOffset: Math.random() * Math.PI * 2,
      originalY: mesh.position.y,
      originalX: mesh.position.x,
    };
    
    scene.add(mesh);
    meshes.push(mesh);
  });
  
  // Облака слов
  for (let i = 0; i < 4; i++) {
    const particlesCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    
    for (let j = 0; j < particlesCount; j++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.25 + Math.random() * 0.15;
      positions[j * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[j * 3 + 2] = r * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: i % 2 === 0 ? '#6366f1' : '#2dd4bf',
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    
    const cloud = new THREE.Points(geometry, material);
    cloud.position.x = (Math.random() - 0.5) * 4;
    cloud.position.y = (Math.random() - 0.5) * 3;
    cloud.position.z = (Math.random() - 0.5) * 1.5 - 0.5;
    
    cloud.userData = {
      rotationSpeed: { x: (Math.random() - 0.5) * 0.002, y: 0.003 + Math.random() * 0.005, z: 0 },
      originalX: cloud.position.x,
      originalY: cloud.position.y,
      floatSpeed: 0.2 + Math.random() * 0.4,
      floatOffset: Math.random() * Math.PI * 2,
    };
    
    scene.add(cloud);
    meshes.push(cloud);
  }
  
  // Символы общения
  const symbols = [
    { text: '💬', size: 0.5 },
    { text: '🗣️', size: 0.5 },
    { text: '📝', size: 0.45 },
    { text: '🎯', size: 0.45 },
    { text: '🌐', size: 0.5 },
  ];
  
  symbols.forEach((sym) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sym.text, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const geometry = new THREE.CircleGeometry(sym.size, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.2,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = (Math.random() - 0.5) * 4.5;
    mesh.position.y = (Math.random() - 0.5) * 3;
    mesh.position.z = (Math.random() - 0.5) * 1.5 - 0.5;
    
    mesh.userData = {
      rotationSpeed: { x: 0, y: (Math.random() - 0.5) * 0.004, z: 0 },
      originalX: mesh.position.x,
      originalY: mesh.position.y,
      floatSpeed: 0.2 + Math.random() * 0.3,
      floatOffset: Math.random() * Math.PI * 2,
    };
    
    scene.add(mesh);
    meshes.push(mesh);
  });
  
  const ambientLight = new THREE.AmbientLight('#6366f1', 0.4);
  scene.add(ambientLight);
  
  const light1 = new THREE.PointLight('#6366f1', 1, 10);
  light1.position.set(2, 1, 3);
  scene.add(light1);
  
  const light2 = new THREE.PointLight('#2dd4bf', 1, 10);
  light2.position.set(-2, -1, 3);
  scene.add(light2);
  
  animate();
};

const animate = () => {
  animationFrame = requestAnimationFrame(animate);
  
  const time = Date.now() * 0.001;
  meshes.forEach((mesh) => {
    const data = mesh.userData;
    if (!data) return;
    
    if (data.rotationSpeed) {
      mesh.rotation.x += data.rotationSpeed.x;
      mesh.rotation.y += data.rotationSpeed.y;
    }
    
    if (data.floatSpeed) {
      mesh.position.y = data.originalY + Math.sin(time * data.floatSpeed + data.floatOffset) * 0.3;
    }
    
    mesh.position.x += mouseX * 0.02;
    mesh.position.y -= mouseY * 0.02;
  });
  
  renderer.render(scene, camera);
};

const handleMouseMove = (event) => {
  const section = heroSection.value;
  if (!section) return;
  const rect = section.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
};

const handleResize = () => {
  if (!canvasContainer.value || !renderer || !camera) return;
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

onMounted(async () => {
  await nextTick();
  initThreeJS();
  startTypewriter();
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  clearInterval(typewriterTimer);
  cancelAnimationFrame(animationFrame);
  meshes.forEach(mesh => {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });
  if (renderer) {
    renderer.dispose();
    if (canvasContainer.value && renderer.domElement) {
      canvasContainer.value.removeChild(renderer.domElement);
    }
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg, #0b1120);
}
.canvas-container {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 24px;
  text-align: center;
}
.hero-text-wrapper {
  margin-bottom: 40px;
}
.hero-title {
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(3rem, 6vw, 6rem);
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}
.char-particle {
  display: inline-block;
  transition: transform 0.3s ease;
  cursor: default;
  text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}
.hero-subtitle {
  font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  color: var(--t2, #94a3b8);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}
.cursor-blink {
  animation: blink 1s step-end infinite;
  color: var(--p, #6366f1);
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.cta-button {
  position: relative;
  padding: 16px 40px;
  font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 60px;
}
.cta-button:hover {
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
  border-color: rgba(99, 102, 241, 0.3);
}
.cta-text {
  position: relative;
  z-index: 1;
}
.cta-glow {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, #6366f1, #2dd4bf);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.cta-button:hover .cta-glow {
  opacity: 0.15;
}
.cta-ripple {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid #6366f1;
  animation: rippleEffect 1s ease-out forwards;
}
@keyframes rippleEffect {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
.scroll-indicator {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.scroll-line {
  width: 2px;
  height: 40px;
  background: linear-gradient(to bottom, #6366f1, transparent);
  animation: pulseLine 2s ease-in-out infinite;
}
@keyframes pulseLine {
  0%, 100% { height: 40px; opacity: 0.6; }
  50% { height: 60px; opacity: 1; }
}
.scroll-text {
  font-size: 0.7rem;
  color: var(--t2, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 2px;
}
@media (max-width: 768px) {
  .hero-title {
    font-size: clamp(2rem, 8vw, 3rem);
  }
  .cta-button {
    padding: 14px 32px;
    font-size: 1rem;
  }
}
</style>