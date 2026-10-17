const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');
const navShell = document.querySelector('.nav-shell');
const yearTarget = document.getElementById('year');
const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = prefersReducedMotionQuery.matches;

/** Set by the inline <head> script; cleared once GSAP owns the hidden state (or isn't coming) */
const clearRevealPending = () => document.documentElement.classList.remove('reveal-pending');

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

const isNavOpen = () => Boolean(navLinks && navLinks.classList.contains('is-open'));

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!isNavOpen());
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isNavOpen()) return;
    setNavOpen(false);
    navToggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (!isNavOpen()) return;
    if (navLinks.contains(event.target) || navToggle.contains(event.target)) return;
    setNavOpen(false);
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

// Hero terminal typewriter
const terminalCode = document.getElementById('terminal-code');
const codeSnippets = [
  `# ingest/station_health.py
@app.post("/ingest")
async def ingest(payload: StationHealth):
    await influx.write(payload.to_points())
    await db.upsert_station(payload.id, payload.status)
    return {"ok": True, "station": payload.id}`,
  `// rag/answer.ts
async function retrieveAndAnswer(query) {
  const docs = await rag.search(query, { topK: 5 });
  const cited = docs.map((d) => d.citation);
  return llm.complete({ prompt: query, context: cited });
}`,
  `// agents/handoff.ts
const handoff = await agent.run({
  role: "career-planner",
  context: sharedState,
  tools: ["jobMatch", "compForecast"],
});
await persistUserState(handoff.nextState);`
];

/** Split a snippet into [{ text, cls }] runs for lightweight syntax colouring */
const tokenizeSnippet = (source) => {
  const pattern = /(#[^\n]*|\/\/[^\n]*)|("[^"\n]*")|(@\w+(?:\.\w+)*)|\b(async|await|def|return|const|function|True)\b|\b(\d+)\b/g;
  const classes = ['tok-comment', 'tok-string', 'tok-deco', 'tok-key', 'tok-num'];
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) tokens.push({ text: source.slice(lastIndex, match.index), cls: '' });
    const groupIndex = match.slice(1).findIndex((group) => group !== undefined);
    tokens.push({ text: match[0], cls: classes[groupIndex] });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < source.length) tokens.push({ text: source.slice(lastIndex), cls: '' });
  return tokens;
};

const tokenizedSnippets = codeSnippets.map(tokenizeSnippet);
const terminalCaret = document.createElement('span');
terminalCaret.className = 'terminal__caret';

/** Render the first `count` characters of a snippet as coloured spans (textContent only) */
const renderSnippet = (snippetIndex, count) => {
  if (!terminalCode) return;
  const fragment = document.createDocumentFragment();
  let remaining = count;

  for (const token of tokenizedSnippets[snippetIndex]) {
    if (remaining <= 0) break;
    const text = token.text.slice(0, remaining);
    remaining -= text.length;
    if (token.cls) {
      const span = document.createElement('span');
      span.className = token.cls;
      span.textContent = text;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(text));
    }
  }

  fragment.appendChild(terminalCaret);
  terminalCode.replaceChildren(fragment);
};

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
  if (!terminalCode) return;
  const snippet = codeSnippets[currentSnippetIndex];
  renderSnippet(currentSnippetIndex, currentCharIndex);
  currentCharIndex += 1;

  if (currentCharIndex <= snippet.length) {
    codeAnimationTimer = setTimeout(typeCodeCharacter, 34 + Math.random() * 34);
  } else {
    codeAnimationTimer = setTimeout(() => {
      currentSnippetIndex = (currentSnippetIndex + 1) % codeSnippets.length;
      currentCharIndex = 0;
      codeAnimationTimer = setTimeout(typeCodeCharacter, 220);
    }, 2200);
  }
};

const startCodeAnimation = () => {
  if (!terminalCode || prefersReducedMotion) return;
  clearCodeAnimation();
  currentSnippetIndex = 0;
  currentCharIndex = 0;
  renderSnippet(0, 0);
  codeAnimationTimer = setTimeout(typeCodeCharacter, 900);
};

const renderStaticSnippet = () => {
  clearCodeAnimation();
  renderSnippet(0, codeSnippets[0].length);
};

if (terminalCode) {
  if (prefersReducedMotion) {
    renderStaticSnippet();
  } else {
    startCodeAnimation();
  }

  // Pause typing in background tabs; resume where it left off
  document.addEventListener('visibilitychange', () => {
    if (prefersReducedMotion) return;
    if (document.hidden) {
      clearCodeAnimation();
    } else if (!codeAnimationTimer) {
      codeAnimationTimer = setTimeout(typeCodeCharacter, 320);
    }
  });
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

// Cursor spotlight: feed pointer position to the hovered card's ::after glow
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
  document.addEventListener('pointermove', (event) => {
    const card = event.target instanceof Element ? event.target.closest('.spotlight') : null;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });
}

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

    // Glide to in-page anchors, landing below the sticky nav
    document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const hash = anchor.getAttribute('href');
        if (hash === '#top') {
          event.preventDefault();
          lenis.scrollTo(0);
          return;
        }
        const target = hash.length > 1 ? document.querySelector(hash) : null;
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -(navShell ? navShell.offsetHeight : 0) });
      });
    });
  }

  if (!prefersReducedMotion && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Scroll reveal batch: hidden state is set here, then animated in on enter.
    // onLeave covers elements the page was already scrolled past on load.
    const reveal = (elements) => gsap.to(elements, {
      opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', stagger: 0.08, overwrite: true
    });
    gsap.set('[data-scroll-reveal]', { opacity: 0, y: 40, scale: 0.97 });
    // GSAP now holds the hidden state inline; drop the CSS gate before the hero
    // .from() tweens read their end values (same task, so nothing paints in between)
    clearRevealPending();
    ScrollTrigger.batch('[data-scroll-reveal]', {
      onEnter: reveal,
      onLeave: reveal,
      once: true,
      start: 'top 88%'
    });

    // Hero entrance timeline
    const heroTl = gsap.timeline({ delay: 0.1 });
    const heroIntroItems = document.querySelectorAll('.hero__intro > *');
    const heroPanelItems = document.querySelectorAll('.hero__panel > *');

    if (heroIntroItems.length) {
      heroTl.from(heroIntroItems, { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    }
    if (heroPanelItems.length) {
      heroTl.from(heroPanelItems, { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out', stagger: 0.12 }, '-=0.45');
    }

    // Count the impact stats up from zero as they appear
    document.querySelectorAll('[data-count-to]').forEach((el) => {
      const target = Number(el.dataset.countTo);
      const counter = { value: 0 };
      el.textContent = '0';
      heroTl.to(counter, {
        value: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(counter.value); }
      }, 0.55);
    });
  }

  clearRevealPending();
});

prefersReducedMotionQuery.addEventListener('change', (event) => {
  prefersReducedMotion = event.matches;
  if (prefersReducedMotion) {
    renderStaticSnippet();
  } else {
    startCodeAnimation();
  }
});

// Update nav link labels if you rename sections to keep highlighting accurate.
