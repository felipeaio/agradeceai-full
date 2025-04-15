/**
 * =============================================
 * Configurações Globais
 * =============================================
 */
const CONFIG = {
  MAX_STEPS: 8,
  MAX_IMAGES: 7,
  MAX_MESSAGE_LENGTH: 5000,
  SLIDE_DURATION: 3000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SANITIZATION: {
    MAX_PAGE_NAME_LENGTH: 30,
    ALLOWED_CHARS: /[^a-z0-9-]/g
  },
  RAIN_EFFECT: {
    DROP_COUNT: 80,
    BASE_DURATION: 1,
    DROP_COLOR: 'rgba(200, 230, 255, 0.8)',
    SPLASH_COLOR: 'rgba(200, 230, 255, 0.6)',
    UPDATE_INTERVAL: 2000, // Intervalo de limpeza em ms
    MAX_DROPS: 100 // Limite máximo de gotas simultâneas
  },
  EMOJI_RAIN: {
    DENSITY: 80,      // Quantidade total de emojis visíveis
    SPAWN_RATE: 15    // Emojis novos por segundo
  },
  EMOJIS: ['❤️', '💖', '💘', '💕', '💞', '💓']
};

/**
 * =============================================
 * Cache de Elementos DOM
 * =============================================
 */
const DOM = {
  FORM: document.getElementById('creation-form'),
  STEPS: document.querySelectorAll('.form-step'),
  PROGRESS_STEPS: document.querySelectorAll('.progress-step'),

  // Inputs
  PAGE_NAME_INPUT: document.getElementById('page-name'),
  PAGE_TITLE_INPUT: document.getElementById('page-title'),
  MESSAGE_TEXTAREA: document.getElementById('page-message'),
  MUSIC_LINK_INPUT: document.getElementById('music-link'),
  EMAIL_INPUT: document.getElementById('user-email'),
  FILE_INPUT: document.getElementById('image-upload'),

  // Áreas interativas
  UPLOAD_AREA: document.getElementById('upload-area'),
  THUMBNAILS_CONTAINER: document.getElementById('thumbnails'),

  // Pré-visualização
  PREVIEW_TITLE: document.getElementById('preview-title'),
  PREVIEW_MESSAGE: document.getElementById('preview-message'),
  PREVIEW_IMAGES: document.getElementById('preview-images'),
  PREVIEW_PLAYER: document.getElementById('preview-player'),
  PREVIEW_QR: document.getElementById('preview-qr'),
  PREVIEW_CONTENT: document.getElementById('preview-content'),
  BROWSER_URL: document.querySelector('.browser-url'),
  CHAR_COUNTER: document.getElementById('char-counter'),
  EMAIL_ERROR: document.getElementById('email-error')
};

/**
 * =============================================
 * Estado da Aplicação
 * =============================================
 */
const STATE = {
  currentStep: 1,
  selectedBackground: 'none',
  selectedImages: [],
  currentImageIndex: 0,
  imageSliderInterval: null,
  isUploading: false,
  activeEffects: {
    rain: null,
    emoji: null
  },
  formData: {
    pageName: '',
    pageTitle: '',
    message: '',
    background: 'none',
    images: [],
    musicLink: '',
    plan: '',
    userEmail: ''
  }
};

/**
 * =============================================
 * Classes Utilitárias
 * =============================================
 */
class FormValidator {
  static validatePageName(name) {
    if (!name || name.trim().length < 3) {
      return { valid: false, message: 'Nome da página inválido! Mínimo 3 caracteres' };
    }

    const sanitized = this.sanitizePageName(name);
    if (!sanitized) {
      return { valid: false, message: 'Nome contém caracteres inválidos' };
    }

    return { valid: true };
  }

  static sanitizePageName(name) {
    if (!name) return '';

    return name.trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, CONFIG.SANITIZATION.MAX_PAGE_NAME_LENGTH);
  }

  static validateImages(images) {
    if (images.length > CONFIG.MAX_IMAGES) {
      return { valid: false, message: `Você pode adicionar no máximo ${CONFIG.MAX_IMAGES} imagens.` };
    }
    return { valid: true };
  }

  static validatePageTitle(title) {
    if (!title || title.trim().length === 0) {
      return { valid: false, message: 'Título da página é obrigatório!' };
    }

    if (title.trim().length < 3) {
      return { valid: false, message: 'Título muito curto! Mínimo 3 caracteres' };
    }

    return { valid: true };
  }

  static validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return { valid: false, message: 'Mensagem é obrigatória!' };
    }

    if (message.trim().length < 10) {
      return { valid: false, message: 'Mensagem muito curta! Mínimo 10 caracteres' };
    }

    return { valid: true };
  }

  static validateEmail(email) {
    if (!email) {
      return { valid: false, message: 'E-mail é obrigatório!' };
    }

    // Regex corrigida
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Por favor, insira um e-mail válido' };
    }

    return { valid: true };
  }
}

class EffectManager {
  static applyBackgroundEffect(effect, container) {
    this.clearEffects(container);

    container.className = `preview-content ${effect}`;
    container.setAttribute('data-bg', effect);

    switch (effect) {
      case 'emoji-rain':
        this.startEmojiRain(container);
        break;
      case 'rain':
        this.startRainEffect(container);
        break;
      case 'starry-sky':
        // Implementação existente
        break;
    }
  }

  static startEmojiRain(container) {
    const createEmoji = () => {
      const emoji = document.createElement('div');
      emoji.className = 'emoji-falling';
      emoji.textContent = CONFIG.EMOJIS[Math.floor(Math.random() * CONFIG.EMOJIS.length)];

      // Posição horizontal aleatória mas fixa durante a queda
      const startX = Math.random() * 100;
      emoji.style.setProperty('--start-x', `${startX}vw`); // Usando CSS variable

      // Configurações de animação
      emoji.style.animationDuration = `${3 + Math.random() * 2}s`;
      emoji.style.animationDelay = `-${Math.random() * 2}s`;

      container.appendChild(emoji);

      // Remoção após animação
      setTimeout(() => emoji.remove(), 5000);
    };

    // Intervalo de criação
    const interval = setInterval(createEmoji, 150);
    STATE.activeEffects.emoji = { interval };
  }

  static startRainEffect(container) {
    const createRainDrop = () => {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';

      // Posicionamento
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${0.5 + Math.random() * 1}s`;

      container.appendChild(drop);

      // Remove após animação
      setTimeout(() => drop.remove(), 2000);
    };

    // Iniciar fluxo
    const interval = setInterval(createRainDrop, 50);
    STATE.activeEffects.rain = { interval };
  }

  static clearEffects(container) {
    container.className = 'preview-content';
    container.removeAttribute('data-bg');

    // Limpar todos os efeitos
    if (STATE.activeEffects.emoji) {
      clearInterval(STATE.activeEffects.emoji.interval);
      container.querySelectorAll('.emoji-falling').forEach(e => e.remove());
    }

    if (STATE.activeEffects.rain) {
      clearInterval(STATE.activeEffects.rain.interval);
      container.querySelectorAll('.rain-drop').forEach(d => d.remove());
    }
  }
}

class RainEffectManager {
  constructor(container) {
    this.container = container;
    this.drops = [];
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.createRainEffect();
    this.setupResizeListener();
  }

  createRainEffect() {
    // Cria o container do efeito
    this.rainContainer = document.createElement('div');
    this.rainContainer.className = 'rain-effect';
    this.container.appendChild(this.rainContainer);

    // Cria gotas iniciais em diferentes estágios
    for (let i = 0; i < CONFIG.RAIN_EFFECT.DROP_COUNT; i++) {
      this.createDrop(Math.random());
    }

    // Inicia o intervalo de limpeza
    this.startCleanupInterval();
  }

  createDrop(progress = 0) {
    if (this.drops.length >= CONFIG.RAIN_EFFECT.MAX_DROPS) return;

    const drop = document.createElement('div');
    drop.className = 'rain-drop';

    const left = Math.random() * 100;
    const duration = CONFIG.RAIN_EFFECT.BASE_DURATION + Math.random() * 0.5;
    const angle = 10 + Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1);
    const length = 20 + Math.random() * 15;
    const startY = -length;
    const delay = Math.random() * duration;

    // Calcula a posição inicial baseada no progresso
    const initialOffset = progress * window.innerHeight * 1.2;

    drop.style.cssText = `
      left: ${left}%;
      top: ${startY}px;
      height: ${length}px;
      transform: translateY(${initialOffset}px) rotate(${angle}deg);
      background: linear-gradient(to bottom, transparent, ${CONFIG.RAIN_EFFECT.DROP_COLOR});
      animation: rain-drop-fall ${duration}s linear ${delay}s infinite;
      will-change: transform, opacity;
    `;

    this.rainContainer.appendChild(drop);
    this.drops.push({
      element: drop,
      createdAt: Date.now()
    });
  }

  startCleanupInterval() {
    this.updateInterval = setInterval(() => {
      this.cleanupDrops();
      this.balanceDrops();
    }, CONFIG.RAIN_EFFECT.UPDATE_INTERVAL);
  }

  cleanupDrops() {
    const now = Date.now();
    const viewportHeight = window.innerHeight;

    this.drops = this.drops.filter(dropInfo => {
      const rect = dropInfo.element.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < viewportHeight;

      if (!isVisible || now - dropInfo.createdAt > 10000) {
        dropInfo.element.remove();
        return false;
      }
      return true;
    });
  }

  balanceDrops() {
    const neededDrops = CONFIG.RAIN_EFFECT.DROP_COUNT - this.drops.length;
    if (neededDrops > 0) {
      for (let i = 0; i < neededDrops; i++) {
        this.createDrop();
      }
    }
  }

  setupResizeListener() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateDropsPosition();
      }, 200);
    });
  }

  updateDropsPosition() {
    this.drops.forEach(dropInfo => {
      const left = parseFloat(dropInfo.element.style.left);
      dropInfo.element.style.left = `${left * (window.innerWidth / this.container.offsetWidth)}%`;
    });
  }

  destroy() {
    clearInterval(this.updateInterval);
    this.rainContainer.remove();
    window.removeEventListener('resize', this.updateDropsPosition);
  }
}

class ImageHandler {
  static async processFiles(files) {
    const validFiles = Array.from(files).filter(file =>
      CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type) &&
      file.size <= CONFIG.MAX_FILE_SIZE
    );

    if (!validFiles.length) {
      throw new Error('Escolha imagens válidas (JPEG, PNG, GIF, WEBP, até 5MB).');
    }

    if (STATE.selectedImages.length + validFiles.length > CONFIG.MAX_IMAGES) {
      throw new Error(`No máximo ${CONFIG.MAX_IMAGES} imagens são permitidas.`);
    }

    const processedImages = await Promise.all(validFiles.map(file => this.compressImage(file)));

    // Checar tamanho total em KB
    const totalSize = processedImages.reduce((sum, img) => {
      const base64Size = Math.round(img.length / 1024); // Tamanho aproximado
      return sum + base64Size;
    }, 0);

    if (totalSize > 50) { // 50KB para ficar seguro
      throw new Error('Imagens muito grandes após compressão. Use fotos menores.');
    }

    return processedImages;
  }

  static compressImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressed = await this._compressImageData(event.target.result, 300, 0.2);
        resolve(compressed);
      };
      reader.readAsDataURL(file);
    });
  }

  static _compressImageData(imageData, maxWidth, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageData;

      img.onload = function () {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  }

  static updateThumbnails() {
    DOM.THUMBNAILS_CONTAINER.innerHTML = '';

    STATE.selectedImages.forEach((img, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'thumbnail';
      thumbnail.innerHTML = `
        <img src="${img}" alt="Imagem ${index + 1}" loading="lazy">
        <button class="thumbnail-remove" data-index="${index}" 
                aria-label="Remover imagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      `;
      DOM.THUMBNAILS_CONTAINER.appendChild(thumbnail);
    });
  }

  static initImageSlider() {
    const slider = document.createElement('div');
    slider.className = 'preview-slider';

    const slide = document.createElement('div');
    slide.className = 'preview-slide';
    slide.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i>';
    slider.appendChild(slide);

    DOM.PREVIEW_IMAGES.innerHTML = '';
    DOM.PREVIEW_IMAGES.appendChild(slider);
  }

  static updateImageSlider() {
    const slider = DOM.PREVIEW_IMAGES.querySelector('.preview-slider');
    slider.innerHTML = '';

    if (STATE.selectedImages.length === 0) {
      const slide = document.createElement('div');
      slide.className = 'preview-slide';
      slide.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i>';
      slider.appendChild(slide);
    } else {
      STATE.selectedImages.forEach(img => {
        const slide = document.createElement('div');
        slide.className = 'preview-slide';
        slide.style.backgroundImage = `url(${img})`;
        slider.appendChild(slide);
      });
    }

    this.startImageSlider();
  }

  static startImageSlider() {
    if (STATE.imageSliderInterval) {
      clearInterval(STATE.imageSliderInterval);
    }

    if (STATE.selectedImages.length <= 1) return;

    const slider = DOM.PREVIEW_IMAGES.querySelector('.preview-slider');
    let counter = 0;

    function slide() {
      counter = (counter + 1) % STATE.selectedImages.length;
      slider.style.transform = `translateX(-${counter * 100}%)`;
      STATE.imageSliderInterval = setTimeout(slide, CONFIG.SLIDE_DURATION);
    }

    slide();
  }
}

class MusicPlayer {
  static updatePreview() {
    const link = STATE.formData.musicLink.trim();
    const player = DOM.PREVIEW_PLAYER;

    // Reset classes
    player.classList.remove('has-music', 'has-error');

    // Limpar conteúdo
    player.innerHTML = '';

    if (!link) {
      this.showPlaceholder(player);
      return;
    }

    const sanitizedLink = DOMPurify.sanitize(link);
    let playerContent;

    if (this.isYouTubeLink(sanitizedLink)) {
      const videoId = this.extractYouTubeId(sanitizedLink);
      playerContent = videoId ?
        this.createYouTubePlayer(videoId) :
        this.createError('Link do YouTube inválido');
    }
    else if (this.isSpotifyLink(sanitizedLink)) {
      const spotifyId = this.extractSpotifyId(sanitizedLink);
      playerContent = spotifyId ?
        this.createSpotifyPlayer(spotifyId) :
        this.createError('Link do Spotify inválido');
    }
    else {
      playerContent = this.createError('Insira um link válido do YouTube ou Spotify');
    }

    if (playerContent.classList.contains('music-error')) {
      player.classList.add('has-error');
    } else {
      player.classList.add('has-music');
    }

    player.appendChild(playerContent);
  }

  static showPlaceholder(container) {
    const placeholder = document.createElement('div');
    placeholder.className = 'music-placeholder';
    placeholder.innerHTML = `
      <i class="fas fa-headphones" aria-hidden="true"></i>
      <p>Prévia da música aparecerá aqui</p>
    `;
    container.appendChild(placeholder);
  }

  static createYouTubePlayer(videoId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'music-preview';
    wrapper.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1"
        title="Player de vídeo do YouTube"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        sandbox="allow-same-origin allow-scripts allow-popups">
      </iframe>
      <span class="music-source">YouTube</span>
    `;
    return wrapper;
  }

  static createSpotifyPlayer(spotifyId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'music-preview';
    wrapper.innerHTML = `
      <iframe 
        src="https://open.spotify.com/embed/track/${spotifyId}"
        title="Player do Spotify"
        allow="encrypted-media"
        sandbox="allow-same-origin allow-scripts">
      </iframe>
      <span class="music-source">Spotify</span>
    `;
    return wrapper;
  }

  static createError(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'music-error';
    wrapper.innerHTML = `
      <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
      <p>${DOMPurify.sanitize(message)}</p>
    `;
    return wrapper;
  }

  static isYouTubeLink(link) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(link);
  }

  static isSpotifyLink(link) {
    return /^(https?:\/\/)?(www\.)?open\.spotify\.com\/track\/.+/.test(link);
  }

  static extractYouTubeId(link) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = link.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  static extractSpotifyId(link) {
    const regExp = /^.*open\.spotify\.com\/track\/([a-zA-Z0-9]+).*/;
    const match = link.match(regExp);
    return match ? match[1] : null;
  }
}

class StateManager {
  static loadDraft() {
    const draft = localStorage.getItem('agradeceai_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        Object.assign(STATE.formData, parsed);
        STATE.selectedImages = STATE.formData.images || [];
        STATE.selectedBackground = STATE.formData.background || 'none';
        this.updateUIFromState();
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e);
        this.clearDraft();
      }
    }
  }

  static saveDraft() {
    STATE.formData.images = STATE.selectedImages;
    STATE.formData.background = STATE.selectedBackground;
    localStorage.setItem('agradeceai_draft', JSON.stringify(STATE.formData));
  }

  static clearDraft() {
    localStorage.removeItem('agradeceai_draft');
  }

  static updateUIFromState() {
    // Verificação de segurança para o e-mail na etapa 8
    if (STATE.currentStep === 8 && !STATE.formData.userEmail) {
      NavigationManager.showAlert('Por favor, insira seu e-mail primeiro');
      STATE.currentStep = 7; // Volta para a etapa do e-mail
      NavigationManager.updateProgressBar();
      return; // Impede a atualização da UI até o e-mail ser preenchido
    }

    // Atualiza inputs
    DOM.PAGE_NAME_INPUT.value = STATE.formData.pageName;
    DOM.PAGE_TITLE_INPUT.value = STATE.formData.pageTitle;
    DOM.MESSAGE_TEXTAREA.value = STATE.formData.message;
    DOM.MUSIC_LINK_INPUT.value = STATE.formData.musicLink;
    DOM.EMAIL_INPUT.value = STATE.formData.userEmail || '';

    // Atualiza previews
    this.updateBrowserUrl();
    this.updateTitlePreview();
    this.updateMessagePreview();
    MusicPlayer.updatePreview();
    ImageHandler.updateThumbnails();
    ImageHandler.updateImageSlider();

    // Atualiza background selecionado
    const bgOption = document.querySelector(`.background-option[data-bg="${STATE.selectedBackground}"]`);
    if (bgOption) bgOption.click();
  }

  static updateBrowserUrl() {
    const sanitized = FormValidator.sanitizePageName(STATE.formData.pageName);
    DOM.BROWSER_URL.textContent = `agradeceai.com/${sanitized || ''}`;
  }

  static updateTitlePreview() {
    DOM.PREVIEW_TITLE.textContent = DOMPurify.sanitize(STATE.formData.pageTitle) || 'Título da Página';
  }

  static updateMessagePreview() {
    const message = STATE.formData.message;
    const remaining = CONFIG.MAX_MESSAGE_LENGTH - message.length;
    DOM.CHAR_COUNTER.textContent = `${remaining} caracteres restantes`;

    DOM.PREVIEW_MESSAGE.innerHTML = message
      ? DOMPurify.sanitize(message.replace(/\n/g, '<br>').replace(/ {2}/g, ' &nbsp;'))
      : 'Sua mensagem aparecerá aqui...';
  }
}

class NavigationManager {
  static isNavigating = false; // Bloqueio para evitar cliques múltiplos

  static goToNextStep() {
    if (this.isNavigating || STATE.currentStep >= CONFIG.MAX_STEPS) return;

    // Validação por etapa
    const validations = {
      1: () => FormValidator.validatePageName(STATE.formData.pageName),
      2: () => FormValidator.validatePageTitle(STATE.formData.pageTitle),
      3: () => FormValidator.validateMessage(STATE.formData.message),
      7: () => FormValidator.validateEmail(STATE.formData.userEmail)
    };

    if (validations[STATE.currentStep]) {
      const validation = validations[STATE.currentStep]();
      if (!validation.valid) {
        this.showAlert(validation.message);
        this.focusInvalidField(STATE.currentStep);
        return;
      }
    }

    this.animateStepTransition(true);
  }

  static goToPrevStep() {
    if (this.isNavigating || STATE.currentStep <= 1) return;
    this.animateStepTransition(false);
  }

  static animateStepTransition(forward) {
    this.isNavigating = true;

    const currentStepElement = DOM.STEPS[STATE.currentStep - 1];
    currentStepElement.style.opacity = '0';
    currentStepElement.style.transform = forward ? 'translateX(-20px)' : 'translateX(20px)';
    currentStepElement.classList.remove('active');

    // Atualiza o estado apenas uma vez
    const nextStepIndex = forward ? STATE.currentStep + 1 : STATE.currentStep - 1;

    requestAnimationFrame(() => {
      const nextStepElement = DOM.STEPS[nextStepIndex - 1];
      nextStepElement.classList.add('active');
      nextStepElement.style.opacity = '0';
      nextStepElement.style.transform = forward ? 'translateX(20px)' : 'translateX(-20px)';

      requestAnimationFrame(() => {
        nextStepElement.style.opacity = '1';
        nextStepElement.style.transform = 'translateX(0)';

        // Atualiza o estado após a transição
        STATE.currentStep = nextStepIndex;
        this.updateProgressBar();
        this.scrollToTop();
        this.isNavigating = false; // Libera o bloqueio
      });
    });
  }

  static focusInvalidField(step) {
    const fields = {
      1: DOM.PAGE_NAME_INPUT,
      2: DOM.PAGE_TITLE_INPUT,
      3: DOM.MESSAGE_TEXTAREA,
      7: DOM.EMAIL_INPUT
    };
    fields[step]?.focus();
  }

  static updateProgressBar() {
    DOM.PROGRESS_STEPS.forEach((step, index) => {
      step.classList.toggle('active', index < STATE.currentStep);
    });
    document.querySelector('.progress-bar').setAttribute('aria-valuenow', STATE.currentStep);
  }

  static scrollToTop() {
    DOM.FORM.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  static showAlert(message, type = 'error', duration = 3000) {
    const existingAlert = document.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = `form-alert ${type}`;
    alert.innerHTML = DOMPurify.sanitize(message);
    alert.setAttribute('role', 'alert');

    const icon = document.createElement('span');
    icon.className = 'alert-icon';
    icon.setAttribute('aria-hidden', 'true');
    alert.prepend(icon);

    document.body.appendChild(alert);

    void alert.offsetWidth;
    alert.classList.add('show');

    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 400);
    }, duration);
  }
}

/**
 * =============================================
 * Inicialização e Event Listeners
 * =============================================
 */
class App {
  static init() {
    this.setupEventListeners();
    ImageHandler.initImageSlider();
    StateManager.loadDraft();
    this.setupMessageCounter();
    this.registerServiceWorker();
    this.initBackgroundPreviews();
    this.setupEmailInput();
  }

  static initBackgroundPreviews() {
    // Força a renderização dos efeitos de background
    document.querySelectorAll('.bg-preview.emoji-rain, .bg-preview.rain').forEach(preview => {
      void preview.offsetWidth; // Trigger reflow
    });
  }

  static setupEventListeners() {
    // Eventos globais
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('keydown', this.handleKeyNavigation.bind(this));

    // Upload de imagens
    this.setupUploadListeners();

    // Inputs com debounce
    this.setupDebouncedInputs();

    // Beforeunload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  static setupUploadListeners() {
    DOM.UPLOAD_AREA.addEventListener('click', (e) => {
      if (!STATE.isUploading) DOM.FILE_INPUT.click();
    });

    DOM.UPLOAD_AREA.addEventListener('keydown', (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        DOM.FILE_INPUT.click();
      }
    });

    // Drag and drop
    DOM.UPLOAD_AREA.addEventListener('dragenter', this.handleDragEnter.bind(this));
    DOM.UPLOAD_AREA.addEventListener('dragover', this.handleDragOver.bind(this));
    DOM.UPLOAD_AREA.addEventListener('dragleave', this.handleDragLeave.bind(this));
    DOM.UPLOAD_AREA.addEventListener('drop', this.handleFileDrop.bind(this));

    DOM.FILE_INPUT.addEventListener('change', this.handleFileUpload.bind(this));
  }

  static setupDebouncedInputs() {
    const inputs = {
      PAGE_NAME_INPUT: { handler: this.handlePageNameInput.bind(this), delay: 300 },
      PAGE_TITLE_INPUT: { handler: this.handlePageTitleInput.bind(this), delay: 300 },
      MESSAGE_TEXTAREA: { handler: this.handleMessageInput.bind(this), delay: 100 },
      MUSIC_LINK_INPUT: { handler: this.handleMusicLinkInput.bind(this), delay: 500 },
      EMAIL_INPUT: { handler: this.handleEmailInput.bind(this), delay: 300 }
    };

    Object.entries(inputs).forEach(([id, { handler, delay }]) => {
      DOM[id].addEventListener('input', this.debounce(handler, delay));
    });
  }

  static setupEmailInput() {
    DOM.EMAIL_INPUT.addEventListener('input', this.debounce(e => {
      STATE.formData.userEmail = e.target.value;
      StateManager.saveDraft();

      // Validação em tempo real
      const validation = FormValidator.validateEmail(e.target.value);
      DOM.EMAIL_ERROR.textContent = validation.valid ? '' : validation.message;
    }, 300));
  }

  static setupMessageCounter() {
    if (!DOM.CHAR_COUNTER) {
      const counter = document.createElement('span');
      counter.id = 'char-counter';
      counter.className = 'char-counter';
      counter.textContent = `${CONFIG.MAX_MESSAGE_LENGTH} caracteres restantes`;
      DOM.MESSAGE_TEXTAREA.insertAdjacentElement('afterend', counter);
      DOM.CHAR_COUNTER = counter;
    }
  }

 // static registerServiceWorker() {
  //  if ('serviceWorker' in navigator) {
  //    navigator.serviceWorker.register('/sw.js')
   //     .then(registration => {
   //       console.log('ServiceWorker registrado:', registration.scope);
   ///     })
   //     .catch(error => {
    //      console.log('Falha no registro do ServiceWorker:', error);
   //     });
   // }
  //}

  static handleDocumentClick(e) {
    const target = e.target;

    if (target.closest('.btn-next')) {
      e.preventDefault();
      NavigationManager.goToNextStep();
      return;
    }

    if (target.closest('.btn-prev')) {
      e.preventDefault();
      NavigationManager.goToPrevStep();
      return;
    }

    if (target.closest('.btn-select-plan')) {
      e.preventDefault();
      this.handlePlanSelection(target.closest('.btn-select-plan'));
      return;
    }

    if (target.closest('.btn-submit')) {
      e.preventDefault();
      this.handleFormSubmission();
      return;
    }

    const bgOption = target.closest('.background-option');
    if (bgOption) {
      e.preventDefault();
      this.selectBackground(bgOption);
      return;
    }

    const thumbRemove = target.closest('.thumbnail-remove');
    if (thumbRemove) {
      e.preventDefault();
      this.removeThumbnail(thumbRemove);
      return;
    }

    const openModal = document.querySelector('.modal.open');
    if (openModal && !target.closest('.modal-content')) {
      this.closeModal(openModal);
    }
  }

  static handleKeyNavigation(e) {
    if (e.key === 'ArrowRight') NavigationManager.goToNextStep();
    if (e.key === 'ArrowLeft') NavigationManager.goToPrevStep();
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.open');
      if (openModal) this.closeModal(openModal);
    }
  }

  static async handleFileUpload(e) {
    if (STATE.isUploading) return;

    try {
      STATE.isUploading = true;
      DOM.UPLOAD_AREA.classList.add('uploading');

      const files = e.target.files || e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const processedImages = await ImageHandler.processFiles(files);
      STATE.selectedImages = [...STATE.selectedImages, ...processedImages];

      ImageHandler.updateThumbnails();
      ImageHandler.updateImageSlider();
      StateManager.saveDraft();

    } catch (error) {
      console.error('Erro no upload:', error);
      NavigationManager.showAlert(error.message);
    } finally {
      STATE.isUploading = false;
      DOM.FILE_INPUT.value = '';
      DOM.UPLOAD_AREA.classList.remove('uploading', 'dragover');
    }
  }

  static handleDragEnter(e) {
    e.preventDefault();
    DOM.UPLOAD_AREA.classList.add('dragover');
  }

  static handleDragOver(e) {
    e.preventDefault();
  }

  static handleDragLeave(e) {
    e.preventDefault();
    DOM.UPLOAD_AREA.classList.remove('dragover');
  }

  static handleFileDrop(e) {
    e.preventDefault();
    this.handleFileUpload(e);
  }

  static handleBeforeUnload(e) {
    if (STATE.currentStep > 1) {
      e.preventDefault();
      e.returnValue = '';
      StateManager.saveDraft();
    }
  }

  static selectBackground(option) {
    document.querySelectorAll('.background-option').forEach(el => {
      el.classList.remove('selected');
    });

    option.classList.add('selected');
    STATE.selectedBackground = option.dataset.bg;
    EffectManager.applyBackgroundEffect(STATE.selectedBackground, DOM.PREVIEW_CONTENT);
    StateManager.saveDraft();
  }

  static removeThumbnail(button) {
    const index = parseInt(button.getAttribute('data-index'));
    const modal = this.createConfirmationModal(
      'Remover esta imagem?',
      () => {
        STATE.selectedImages.splice(index, 1);
        ImageHandler.updateThumbnails();
        ImageHandler.updateImageSlider();
        StateManager.saveDraft();
      }
    );
    document.body.appendChild(modal);
  }

  static createConfirmationModal(message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <div class="modal-actions">
          <button type="button" class="btn-cancel">Cancelar</button>
          <button type="button" class="btn-confirm">Confirmar</button>
        </div>
      </div>
    `;

    modal.querySelector('.btn-confirm').addEventListener('click', () => {
      onConfirm();
      modal.remove();
    });

    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      modal.remove();
    });

    setTimeout(() => modal.classList.add('open'), 10);
    return modal;
  }

  static handlePlanSelection(button) {
    const planCard = button.closest('.plan-card');
    const planName = planCard.querySelector('h3').textContent;
    STATE.formData.plan = planName;

    // Submete o formulário
    this.handleFormSubmission();
  }

  static async handleFormSubmission() {
    try {
      // Validação final
      const emailValidation = FormValidator.validateEmail(STATE.formData.userEmail);
      if (!emailValidation.valid) {
        NavigationManager.showAlert(emailValidation.message);
        DOM.EMAIL_INPUT.focus();
        return;
      }

      // Mostrar loading
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

      // Enviar dados ao backend
      const response = await this.submitFormData(STATE.formData);

      // Mostrar sucesso com a URL do cartão
      NavigationManager.showAlert(
        `Cartão criado com sucesso! Acesse em: ${response.url}`,
        'success'
      );

      // Limpar estado após sucesso
      StateManager.clearDraft();
      setTimeout(() => {
        window.location.href = '/obrigado.html'; // Página de confirmação
      }, 3000);

    } catch (error) {
      console.error('Erro no envio:', error);
      NavigationManager.showAlert(error.message || 'Erro ao criar cartão');
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Enviar'; // Restaurar texto original
    }
  }

  static async submitFormData(data) {
    try {
      const response = await fetch('http://localhost:3000/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      throw error;
    }
  }

  static handlePageNameInput(e) {
    STATE.formData.pageName = e.target.value;
    StateManager.updateBrowserUrl();
    StateManager.saveDraft();
  }

  static handlePageTitleInput(e) {
    STATE.formData.pageTitle = e.target.value;
    StateManager.updateTitlePreview();
    StateManager.saveDraft();
  }

  static handleMessageInput(e) {
    STATE.formData.message = e.target.value;
    StateManager.updateMessagePreview();
    StateManager.saveDraft();
  }

  static handleMusicLinkInput(e) {
    STATE.formData.musicLink = e.target.value;
    MusicPlayer.updatePreview();
    StateManager.saveDraft();
  }

  static handleEmailInput(e) {
    STATE.formData.userEmail = e.target.value;
    StateManager.saveDraft();
  }

  static closeModal(modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }

  static debounce(func, wait, immediate = false) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (immediate && !timeout) func.apply(context, args);
    };
  }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => App.init());