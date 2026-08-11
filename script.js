const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');
const navShell = document.querySelector('.nav-shell');
const yearTarget = document.getElementById('year');
const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = prefersReducedMotionQuery.matches;

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

/** Sync mobile nav open state with aria-expanded for assistive tech */
const setNavOpen = (isOpen) => {
  if (!navToggle || !navLinks) return;
  navLinks.classList.toggle('is-open', isOpen);
  navToggle.classList.toggle('is-open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!navLinks.classList.contains('is-open'));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });
}

if (navShell) {
  const setScrollState = () => {
    navShell.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  window.addEventListener('scroll', setScrollState, { passive: true });
  setScrollState();
}

const sectionObserver = (() => {
  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a[href^="#"]');
  if (!sections.length || !navAnchors.length) return null;

  const map = new Map();
  navAnchors.forEach((anchor) => map.set(anchor.getAttribute('href'), anchor));

  const sectionRatios = new Map();
  sections.forEach((section) => sectionRatios.set(section.id, 0));

  const setActiveFromRatios = () => {
    let bestId = null;
    let bestRatio = 0;
    sectionRatios.forEach((ratio, id) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestId = id;
      }
    });
    if (!bestId) return;

    const link = map.get(`#${bestId}`);
    if (!link) return;

    navAnchors.forEach((anchor) => anchor.classList.remove('is-active'));
    link.classList.add('is-active');
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sectionRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      setActiveFromRatios();
    },
    { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.05, 0.1, 0.15, 0.25] }
  );

  sections.forEach((section) => observer.observe(section));
  return observer;
})();

// Code overlay animation
const codeOverlayDisplay = document.getElementById('code-overlay');
const codeSnippets = [
  `@app.post("/ingest")
async def ingest_station(payload: StationHealth):
    await influx.write(payload.to_points())
    await db.upsert_station(payload.station_id, payload.status)
    return {"ok": True, "station": payload.station_id}`,
  `async function retrieveAndAnswer(query) {
  const docs = await rag.search(query, { topK: 5 });
  const grounded = docs.map(d => d.citation);
  return llm.complete({ prompt: query, context: grounded });
}`,
  `const handoff = await agent.run({
  role: "career-planner",
  context: sharedState,
  tools: ["jobMatch", "compForecast"]
});
await persistUserState(handoff.nextState);`
];

let codeAnimationTimer;
let currentSnippetIndex = 0;
let currentCharIndex = 0;

const clearCodeAnimation = () => {
  if (codeAnimationTimer) {
    clearTimeout(codeAnimationTimer);
    codeAnimationTimer = undefined;
  }
};

const typeCodeCharacter = () => {
  if (!codeOverlayDisplay) return;
  const snippet = codeSnippets[currentSnippetIndex];
  codeOverlayDisplay.textContent = snippet.slice(0, currentCharIndex);
  currentCharIndex += 1;

  if (currentCharIndex <= snippet.length) {
    codeAnimationTimer = setTimeout(typeCodeCharacter, 42 + Math.random() * 38);
  } else {
    codeAnimationTimer = setTimeout(() => {
      currentSnippetIndex = (currentSnippetIndex + 1) % codeSnippets.length;
      currentCharIndex = 0;
      codeAnimationTimer = setTimeout(typeCodeCharacter, 220);
    }, 1800);
  }
};

const startCodeAnimation = () => {
  if (!codeOverlayDisplay || prefersReducedMotion) return;
  clearCodeAnimation();
  currentSnippetIndex = 0;
  currentCharIndex = 0;
  codeOverlayDisplay.textContent = '';
  codeAnimationTimer = setTimeout(typeCodeCharacter, 320);
};

if (codeOverlayDisplay) {
  if (prefersReducedMotion) {
    codeOverlayDisplay.textContent = codeSnippets[0];
  } else {
    startCodeAnimation();
  }
}

/** Skip WebGL particles on phones / coarse pointers / reduced motion */
const shouldRunParticles = () => {
  if (prefersReducedMotion) return false;
  if (typeof THREE === 'undefined') return false;
  if (window.matchMedia('(max-width: 980px)').matches) return false;
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return true;
};

// Particle background using Three.js
const initParticleBackground = () => {
  if (!shouldRunParticles()) return;

  const container = document.getElementById('vanta-bg');
  if (!container || container.querySelector('canvas')) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const COUNT = 250;
  const positions = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    velocities[i] = 0.002 + Math.random() * 0.004;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.06,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let mouseX = 0;
  let mouseY = 0;
  let rafId = 0;
  let running = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  }, { passive: true });

  const tick = () => {
    if (!running) return;
    rafId = requestAnimationFrame(tick);

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += velocities[i];
      if (pos[i * 3 + 1] > 10) {
        pos[i * 3 + 1] = -10;
        pos[i * 3]     = (Math.random() - 0.5) * 20;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    camera.position.x += (mouseX - camera.position.x) * 0.02;
    camera.position.y += (-mouseY - camera.position.y) * 0.02;

    renderer.render(scene, camera);
  };

  const startLoop = () => {
    if (running || document.hidden) return;
    running = true;
    tick();
  };

  const stopLoop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(max-width: 980px)').matches) {
      stopLoop();
      renderer.domElement.style.display = 'none';
      return;
    }
    renderer.domElement.style.display = '';
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    startLoop();
  }, { passive: true });

  startLoop();
};

/** Defer particle init until the browser is idle after load */
const scheduleParticleInit = () => {
  const run = () => initParticleBackground();
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 200);
  }
};

window.addEventListener('load', scheduleParticleInit);

// Lenis smooth scroll + GSAP animations
window.addEventListener('DOMContentLoaded', () => {
  if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  if (!prefersReducedMotion && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Scroll reveal batch
    ScrollTrigger.batch('[data-scroll-reveal]', {
      onEnter: (elements) => gsap.fromTo(elements,
        { opacity: 0, y: 40, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', stagger: 0.08 }
      ),
      once: true,
      start: 'top 88%'
    });

    // Hero entrance timeline
    const heroTl = gsap.timeline({ delay: 0.1 });
    const heroEyebrow = document.querySelector('.hero__eyebrow');
    const heroTitle = document.querySelector('.hero__title');
    const heroDesc = document.querySelector('.hero__description');
    const heroActions = document.querySelector('.hero__actions');
    const heroPanelItems = document.querySelectorAll('.hero__panel > *');

    if (heroEyebrow) heroTl.from(heroEyebrow, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
    if (heroTitle) heroTl.from(heroTitle, { opacity: 0, y: 30, duration: 0.7, ease: 'power3.out' }, '-=0.3');
    if (heroDesc) heroTl.from(heroDesc, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    if (heroActions) heroTl.from(heroActions, { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' }, '-=0.2');
    if (heroPanelItems.length) {
      heroTl.from(heroPanelItems, { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out', stagger: 0.12 }, '-=0.3');
    }

    // Section header parallax
    document.querySelectorAll('.section__header').forEach((header) => {
      gsap.to(header, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: header,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        }
      });
    });
  }
});

prefersReducedMotionQuery.addEventListener('change', (event) => {
  prefersReducedMotion = event.matches;
  if (prefersReducedMotion) {
    clearCodeAnimation();
    if (codeOverlayDisplay) {
      codeOverlayDisplay.textContent = codeSnippets[0];
    }
  } else {
    startCodeAnimation();
  }
});

// Update nav link labels if you rename sections to keep highlighting accurate.
