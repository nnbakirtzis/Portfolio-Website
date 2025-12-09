const navToggle = document.querySelector('.nav__toggle');
const navLinks = document.querySelector('.nav__links');
const navShell = document.querySelector('.nav-shell');
const yearTarget = document.getElementById('year');
const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = prefersReducedMotionQuery.matches;

if (!prefersReducedMotion) {
  window.requestAnimationFrame(() => {
    document.documentElement.classList.add('scroll-animate');
  });
}

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
    navToggle.classList.toggle('is-open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-open');
    });
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = `#${entry.target.id}`;
        const link = map.get(id);
        if (!link) return;
        if (entry.isIntersecting) {
          navAnchors.forEach((anchor) => anchor.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    },
    { rootMargin: '-35% 0px -50% 0px', threshold: 0.15 }
  );

  sections.forEach((section) => observer.observe(section));
  return observer;
})();

const revealObserver = (() => {
  if (prefersReducedMotion) return null;
  const revealables = document.querySelectorAll('[data-scroll-reveal]');
  if (!revealables.length) return null;

  revealables.forEach((el) => {
    if (el.dataset.scrollDelay && !el.style.transitionDelay) {
      el.style.transitionDelay = `${parseInt(el.dataset.scrollDelay, 10)}ms`;
    }
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.18 }
  );

  revealables.forEach((el) => observer.observe(el));
  return observer;
})();

const codeOverlayDisplay = document.getElementById('code-overlay');
const codeSnippets = [
  `const sentinel = createFirewall({
  threatModel: 'zero-trust',
  hardening: ['inputValidation', 'rateLimiting'],
  observability: true
});
await sentinel.deploy();`,
  `interface ThreatReport {
  id: string;
  indicators: Indicator[];
  mitigations: string[];
}

const composePlaybook = (report: ThreatReport) =>
  report.mitigations.map(step => \`- [ ] \${step}\`).join('\n');`,
  `async function harden(api) {
  await api.enableTLS();
  api.enableAuditLogs();
  api.setRateLimit({ burst: 200, sustained: 80 });
  return api;
}

await harden(paymentsService);`
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

prefersReducedMotionQuery.addEventListener('change', (event) => {
  prefersReducedMotion = event.matches;
  if (prefersReducedMotion) {
    document.documentElement.classList.remove('scroll-animate');
    clearCodeAnimation();
    if (codeOverlayDisplay) {
      codeOverlayDisplay.textContent = codeSnippets[0];
    }
  } else {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.add('scroll-animate');
      startCodeAnimation();
    });
  }
});

let vantaEffect;

/**
 * Initialize a subtle Vanta NET background that matches the site's palette.
 */
const initVantaBackground = () => {
  if (prefersReducedMotion) return;
  if (typeof VANTA === 'undefined' || !VANTA.NET) return;

  const target = document.getElementById('vanta-bg');
  if (!target) return;

  if (vantaEffect) {
    vantaEffect.destroy();
    vantaEffect = null;
  }

  vantaEffect = VANTA.NET({
    el: target,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x6e6e73,
    backgroundColor: 0xf5f5f7,
    points: 8.0,
    maxDistance: 14.0,
    spacing: 18.0,
    showDots: true
  });
};

const destroyVantaBackground = () => {
  if (vantaEffect) {
    vantaEffect.destroy();
    vantaEffect = null;
  }
};

window.addEventListener('load', initVantaBackground);
window.addEventListener('beforeunload', destroyVantaBackground);

prefersReducedMotionQuery.addEventListener('change', (event) => {
  prefersReducedMotion = event.matches;
  if (prefersReducedMotion) {
    destroyVantaBackground();
  } else {
    initVantaBackground();
  }
});

// Update nav link labels if you rename sections to keep highlighting accurate.
