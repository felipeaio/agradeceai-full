/**
 * AGRA DECE AÍ - CORE FUNCTIONS
 * Versão otimizada e modularizada
 */

// Configurações globais
const CONFIG = {
  typing: {
    words: ['memórias', 'momentos', 'emoções', 'sentimentos'],
    typeSpeed: 160,
    deleteSpeed: 50,
    pauseEnd: 1000,
    pauseStart: 500,
    cursorBlinkSpeed: 700
  },
  counters: {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px',
    animationDuration: 2000
  },
  slider: {
    interval: 5000,
    desktopBreakpoint: 992
  },
  header: {
    scrollThreshold: 100,
    hideThreshold: 200
  }
};

// Módulo de Utilitários
const Utils = {
  // Debounce para eventos de resize/scroll
  debounce: (func, wait = 100) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // Verifica se elemento existe
  exists: (selector) => {
    const el = document.querySelector(selector);
    return el ? el : null;
  },

  // Atualiza atributos ARIA
  updateAria: (element, attributes) => {
    if (!element) return;
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
};

// Módulo de Menu Mobile
const MobileMenu = {
  init() {
    this.navToggle = Utils.exists('.nav-toggle');
    this.nav = Utils.exists('.nav');
    if (!this.navToggle || !this.nav) return;

    this.setupEvents();
  },

  setupEvents() {
    this.navToggle.addEventListener('click', () => this.toggleMenu());

    // Fechar menu ao clicar em um link
    this.nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });
  },

  toggleMenu() {
    const isOpen = this.nav.getAttribute('data-state') === 'open';

    // Atualiza estado
    this.nav.setAttribute('data-state', isOpen ? 'closed' : 'open');
    Utils.updateAria(this.navToggle, {
      'aria-expanded': !isOpen,
      'aria-label': isOpen ? 'Abrir menu' : 'Fechar menu'
    });

    // Atualiza ícone
    this.navToggle.innerHTML = isOpen
      ? '<i class="fas fa-bars" aria-hidden="true"></i>'
      : '<i class="fas fa-times" aria-hidden="true"></i>';
  },

  closeMenu() {
    this.nav.setAttribute('data-state', 'closed');
    Utils.updateAria(this.navToggle, {
      'aria-expanded': 'false',
      'aria-label': 'Abrir menu'
    });
    this.navToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
  }
};

// Módulo de Animação de Digitação
const TypingAnimation = {
  init() {
    this.typedText = Utils.exists('.typed-text');
    if (!this.typedText) return;

    this.setupAnimation();
  },

  setupAnimation() {
    const { words, cursorBlinkSpeed } = CONFIG.typing;
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = CONFIG.typing.typeSpeed;

    // Cursor piscante
    this.cursor = document.createElement('span');
    this.cursor.className = 'cursor';
    this.cursor.textContent = '|';
    this.typedText.appendChild(this.cursor);

    // Animação do cursor
    this.cursorInterval = setInterval(() => {
      this.cursor.style.visibility = this.cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
    }, cursorBlinkSpeed);

    const type = () => {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        // Modo apagar
        charIndex--;
        typeSpeed = CONFIG.typing.deleteSpeed;
      } else {
        // Modo escrever
        charIndex++;
        typeSpeed = charIndex === currentWord.length ? CONFIG.typing.pauseEnd : CONFIG.typing.typeSpeed;
      }

      // Atualizar texto
      this.typedText.textContent = currentWord.substring(0, charIndex);
      this.typedText.appendChild(this.cursor);

      // Transições de estado
      if (!isDeleting && charIndex === currentWord.length) {
        isDeleting = true;
        typeSpeed = CONFIG.typing.pauseEnd;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = CONFIG.typing.pauseStart;
      }

      this.typingTimeout = setTimeout(type, typeSpeed);
    };

    // Iniciar com delay
    this.startTimeout = setTimeout(type, 1000);
  },

  cleanup() {
    clearTimeout(this.typingTimeout);
    clearTimeout(this.startTimeout);
    clearInterval(this.cursorInterval);
    if (this.cursor) this.cursor.remove();
  }
};

// Módulo de Contadores Animados
const AnimatedCounters = {
  init() {
    this.counters = document.querySelectorAll('[data-counter]');
    if (!this.counters.length) return;

    this.setupIntersectionObserver();
  },

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => this.animateOnIntersect(entries),
      {
        threshold: CONFIG.counters.threshold,
        rootMargin: CONFIG.counters.rootMargin
      }
    );

    const statsSection = Utils.exists('.custom-stats') || Utils.exists('body');
    if (statsSection) observer.observe(statsSection);
  },

  animateOnIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.counters.forEach(counter => {
          this.animateCounter(counter);
        });
      }
    });
  },

  animateCounter(counter) {
    const target = +counter.dataset.counter;
    const duration = CONFIG.counters.animationDuration;
    const startTime = performance.now();
    const locale = document.documentElement.lang || 'pt-BR';

    const updateCount = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const value = Math.floor(progress * target);

      counter.textContent = value.toLocaleString(locale);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }
};

// Módulo de Slider de Preview
const PreviewSlider = {
  init() {
    this.slides = document.querySelectorAll('.slide');
    if (this.slides.length < 2) return;

    this.currentSlide = 0;
    this.setupSlider();
    this.setupResponsive();
  },

  setupSlider() {
    this.showSlide(this.currentSlide);

    // Só ativa o slider em telas maiores
    if (window.innerWidth >= CONFIG.slider.desktopBreakpoint) {
      this.startAutoSlide();
    }
  },

  showSlide(index) {
    this.slides.forEach(slide => slide.classList.remove('active'));
    this.currentSlide = (index + this.slides.length) % this.slides.length;
    this.slides[this.currentSlide].classList.add('active');
  },

  startAutoSlide() {
    this.interval = setInterval(() => {
      this.showSlide(this.currentSlide + 1);
    }, CONFIG.slider.interval);
  },

  stopAutoSlide() {
    clearInterval(this.interval);
  },

  setupResponsive() {
    const handleResize = Utils.debounce(() => {
      if (window.innerWidth >= CONFIG.slider.desktopBreakpoint) {
        this.startAutoSlide();
      } else {
        this.stopAutoSlide();
        this.showSlide(0); // Mostra sempre o primeiro slide em mobile
      }
    }, 200);

    window.addEventListener('resize', handleResize);
  }
};

// Módulo de Scroll Suave - Versão Final
const SmoothScroll = {
  init() {
    this.links = document.querySelectorAll('a[href^="#"]');
    if (!this.links.length) return;

    this.setupLinks();
  },

  setupLinks() {
    this.links.forEach(anchor => {
      // Adiciona tratamento para links hash
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');

        // Ignora links vazios ou âncoras inválidas
        if (targetId === '#' || targetId === '#!') return;

        // Verifica se é um link interno
        if (targetId.startsWith('#')) {
          e.preventDefault();
          this.handleInternalLink(targetId);
        }
      });
    });
  },

  handleInternalLink(targetId) {
    const targetElement = Utils.exists(targetId);
    if (!targetElement) {
      console.warn(`Elemento alvo não encontrado: ${targetId}`);
      return;
    }

    this.scrollToTarget(targetElement);
    MobileMenu.closeMenu(); // Fechar menu mobile se aberto
  },

  scrollToTarget(target) {
    const header = Utils.exists('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    const offsetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Atualiza a URL sem recarregar a página
    history.pushState(null, null, `#${target.id}`);
  }
};

// Módulo de Efeito no Header
const HeaderEffects = {
  init() {
    this.header = Utils.exists('.header');
    if (!this.header) return;

    this.lastScroll = window.pageYOffset;
    this.isHidden = false;
    this.setupScrollEffect();
  },

  setupScrollEffect() {
    window.addEventListener('scroll', Utils.debounce(() => {
      this.handleScroll();
    }, 50));
  },

  handleScroll() {
    const currentScroll = window.pageYOffset;
    const scrollDown = currentScroll > this.lastScroll;

    // Mostrar/ocultar apenas após certo limiar
    if (currentScroll > 100) {
      this.header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';

      if (scrollDown && currentScroll > 200 && !this.isHidden) {
        this.header.style.transform = 'translateY(-100%)';
        this.isHidden = true;
      } else if (!scrollDown && this.isHidden) {
        this.header.style.transform = 'translateY(0)';
        this.isHidden = false;
      }
    } else {
      this.header.style.boxShadow = 'none';
      this.header.style.transform = 'translateY(0)';
      this.isHidden = false;
    }

    this.lastScroll = currentScroll;
  }
};

// Módulo de Partículas (Opcional)
const ParticlesEffect = {
  init() {
    this.container = Utils.exists('#particles-js');
    if (!this.container) return;

    this.loadParticles();
  },

  loadParticles() {
    // Carrega apenas se a biblioteca estiver disponível
    if (typeof particlesJS !== 'function') {
      console.warn('ParticlesJS não carregado');
      return;
    }

    particlesJS('particles-js', {
      particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: "#6366f1" },
        shape: { type: "circle" },
        opacity: { value: 0.3, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#6366f1",
          opacity: 0.2,
          width: 1
        },
        move: { enable: true, speed: 1 }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" }
        }
      }
    });
  }
};

// Inicialização da Aplicação
class App {
  static init() {
    document.addEventListener('DOMContentLoaded', () => {
      MobileMenu.init();
      TypingAnimation.init();
      AnimatedCounters.init();
      PreviewSlider.init();
      SmoothScroll.init();
      HeaderEffects.init();
      ParticlesEffect.init();
    });

    // Limpeza ao sair da página
    window.addEventListener('beforeunload', () => {
      TypingAnimation.cleanup();
      PreviewSlider.stopAutoSlide();
    });
  }
}

// Inicia a aplicação
App.init();