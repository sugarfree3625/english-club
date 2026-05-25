<template>
  <section class="hero-section" ref="heroSection">
    <!-- Three.js Canvas -->
    <div class="canvas-container" ref="canvasContainer"></div>

    <!-- Overlay Content -->
    <div class="hero-content">
      <div class="hero-text-wrapper">
        <!-- Распадающийся заголовок -->
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

        <!-- Пишущийся подзаголовок -->
        <p class="hero-subtitle">
          <span class="typewriter-text">{{ displayedSubtitle }}</span>
          <span class="cursor-blink">|</span>
        </p>
      </div>

      <!-- CTA Кнопка с магнитным эффектом -->
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

      <!-- Скролл-индикатор -->
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

// Refs
const heroSection = ref(null);
const canvasContainer = ref(null);
const heroTitle = ref(null);
const ctaButton = ref(null);
const charRefs = ref([]);

// Title management
const fullTitle = 'Анна Петрова';
const titleChars = ref(fullTitle.split(''));

// Subtitle typewriter effect
const fullSubtitle = 'Разговорный клуб нового поколения. Практикуй английский с удовольствием.';
const displayedSubtitle = ref('');
let typewriterTimer = null;

// Three.js variables
let scene, camera, renderer, animationFrame;
let meshes = [];
let mouseX = 0, mouseY = 0;

// CTA ripple effect
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

// ===== TEXT SHATTER EFFECT =====
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

// ===== MAGNETIC BUTTON =====
const handleMagneticEffect = (event) => {
  const btn = ctaButton.value;
  if (!btn) return;
  
  const rect = btn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const deltaX = event.clientX - centerX;
  const deltaY = event.clientY - centerY;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  
  // Magnetic effect within 80px radius
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

const handleCTAClick = () => {
  // Ripple effect
  const btn = ctaButton.value;
  if (!btn) return;
  
  if (ctaRipple) {
    ctaRipple.remove();
  }
  
  ctaRipple = document.createElement('div');
  ctaRipple.className = 'cta-ripple';
  btn.appendChild(ctaRipple);
  
  setTimeout(() => {
    if (ctaRipple) ctaRipple.remove();
  }, 1000);
  
  // Emit or navigate
  console.log('CTA clicked');
};

// ===== THREE.JS SCENE =====
const initThreeJS = () => {
  if (!canvasContainer.value) return;
  
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Scene
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ 
    alpha: true,
    antialias: true 
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Create geometric shapes
  const shapes = [
    new THREE.IcosahedronGeometry(0.3, 0),
    new THREE.TorusGeometry(0.2, 0.08, 8, 12),
    new THREE.OctahedronGeometry(0.25, 0),
    new THREE.TetrahedronGeometry(0.3, 0),
    new THREE.DodecahedronGeometry(0.25, 0),
  ];
  
  for (let i = 0; i < 25; i++) {
    const geometry = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Glass material with glowing edges
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(Math.random() > 0.5 ? '#6366f1' : '#2dd4bf'),
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.3,
      envMap: null,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Edge glow
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: Math.random() > 0.5 ? '#6366f1' : '#2dd4bf',
      transparent: true,
      opacity: 0.3,
    });
    const edgeLine = new THREE.LineSegments(edges, edgeMaterial);
    mesh.add(edgeLine);
    
    // Random position in 3D space
    mesh.position.x = (Math.random() - 0.5) * 6;
    mesh.position.y = (Math.random() - 0.5) * 4;
    mesh.position.z = (Math.random() - 0.5) * 2 - 1;
    
    // Store metadata for animation
    mesh.userData = {
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005,
      },
      orbitRadius: Math.random() * 0.5 + 0.2,
      orbitSpeed: Math.random() * 0.001 + 0.0005,
      orbitAngle: Math.random() * Math.PI * 2,
      originalX: mesh.position.x,
      originalY: mesh.position.y,
      originalZ: mesh.position.z,
    };
    
    scene.add(mesh);
    meshes.push(mesh);
  }
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x6366f1, 0.5);
  scene.add(ambientLight);
  
  // Add point lights
  const light1 = new THREE.PointLight('#6366f1', 1, 10);
  light1.position.set(2, 1, 3);
  scene.add(light1);
  
  const light2 = new THREE.PointLight('#2dd4bf', 1, 10);
  light2.position.set(-2, -1, 3);
  scene.add(light2);
  
  // Start animation
  animate();
};

const animate = () => {
  animationFrame = requestAnimationFrame(animate);
  
  meshes.forEach((mesh) => {
    const data = mesh.userData;
    
    // Rotate each mesh
    mesh.rotation.x += data.rotationSpeed.x;
    mesh.rotation.y += data.rotationSpeed.y;
    mesh.rotation.z += data.rotationSpeed.z;
    
    // Orbital movement
    data.orbitAngle += data.orbitSpeed;
    mesh.position.x = data.originalX + Math.cos(data.orbitAngle) * data.orbitRadius;
    mesh.position.y = data.originalY + Math.sin(data.orbitAngle) * data.orbitRadius;
    
    // Parallax from mouse
    mesh.position.x += mouseX * 0.02;
    mesh.position.y -= mouseY * 0.02;
  });
  
  renderer.render(scene, camera);
};

// Mouse parallax handler
const handleMouseMove = (event) => {
  const section = heroSection.value;
  if (!section) return;
  
  const rect = section.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
};

// Resize handler
const handleResize = () => {
  if (!canvasContainer.value || !renderer || !camera) return;
  
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

// ===== LIFECYCLE =====
onMounted(async () => {
  await nextTick();
  
  // Start Three.js
  initThreeJS();
  
  // Start typewriter
  startTypewriter();
  
  // Add event listeners
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // Cleanup
  clearInterval(typewriterTimer);
  cancelAnimationFrame(animationFrame);
  
  // Dispose Three.js resources
  meshes.forEach(mesh => {
    mesh.geometry.dispose();
    mesh.material.dispose();
    if (mesh.children[0]) {
      mesh.children[0].geometry.dispose();
      mesh.children[0].material.dispose();
    }
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

/* Shatter Title */
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

/* Typewriter Subtitle */
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

/* CTA Button */
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

/* Ripple */
.cta-ripple {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid #6366f1;
  animation: rippleEffect 1s ease-out forwards;
}

@keyframes rippleEffect {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Scroll Indicator */
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
  0%, 100% { 
    height: 40px;
    opacity: 0.6;
  }
  50% { 
    height: 60px;
    opacity: 1;
  }
}

.scroll-text {
  font-size: 0.7rem;
  color: var(--t2, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Responsive */
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
