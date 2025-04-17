/**
 * =============================================
 * Configurações Globais
 * =============================================
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';

console.log('create.js carregado!');

// Configurações do Supabase
const supabaseUrl = 'https://tswzuxuthwbudkztvxod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3p1eHV0aHdidWRrenR2eG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Nzc2MjgsImV4cCI6MjA2MDI1MzYyOH0.upqHqTvYg65dEeYBetq6ZykT-8x0GfjX7xBMaFThtYA';

// Inicialização segura do Supabase
async function initializeSupabase() {
  try {
    console.log('Inicializando Supabase com ES Modules (+esm)');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    window.supabase = supabaseClient;
    console.log('Supabase inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao iniciar Supabase:', error.message);
    window.alert('Erro ao conectar ao servidor. Algumas funcionalidades estarão limitadas.');
    return false;
  }
}

// Configurações da aplicação
const CONFIG = {
  MAX_STEPS: 8,
  MAX_IMAGES: 7,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB por arquivo
  MAX_MESSAGE_LENGTH: 5000,
  SLIDE_DURATION: 3000,
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
    UPDATE_INTERVAL: 2000,
    MAX_DROPS: 100
  },
  EMOJI_RAIN: {
    DENSITY: 80,
    SPAWN_RATE: 15
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
  PAGE_NAME_INPUT: document.getElementById('page-name'),
  PAGE_TITLE_INPUT: document.getElementById('page-title'),
  MESSAGE_TEXTAREA: document.getElementById('page-message'),
  MUSIC_LINK_INPUT: document.getElementById('music-link'),
  EMAIL_INPUT: document.getElementById('user-email'),
  FILE_INPUT: document.getElementById('image-upload'),
  UPLOAD_AREA: document.getElementById('upload-area'),
  THUMBNAILS_CONTAINER: document.getElementById('thumbnails'),
  PREVIEW_TITLE: document.getElementById('preview-title'),
  PREVIEW_MESSAGE: document.getElementById('preview-message'),
  PREVIEW_IMAGES: document.getElementById('preview-images'),
  PREVIEW_PLAYER: document.getElementById('preview-player'),
  PREVIEW_QR: document.getElementById('preview-qr'),
  PREVIEW_CONTENT: document.getElementById('preview-content'),
  BROWSER_URL: document.querySelector('.browser-url'),
  CHAR_COUNTER: document.getElementById('char-counter'),
  EMAIL_ERROR: document.getElementById('email-error'),
  NEXT_BUTTON: document.querySelector('.btn-next'),
  PREV_BUTTON: document.querySelector('.btn-prev')
};

/**
 * =============================================
 * Estado da Aplicação
 * =============================================
 */
const STATE = {
  _selectedImages: [],
  currentStep: 1,
  selectedBackground: null,
  currentImageIndex: 0,
  imageSliderInterval: null,
  isUploading: false,
  activeEffects: {
    rain: null,
    emoji: null
  },
  formData: {
    email: '',
    plano: '',
    status_pagamento: 'pendente',
    conteudo: {
      pageName: '',
      title: '',
      message: '',
      background: null,
      images: [],
      music: null
    }
  },

  // Getters e Setters para sincronização automática
  set selectedImages(images) {
    this._selectedImages = images;
    this.formData.conteudo.images = images;
  },

  get selectedImages() {
    return this._selectedImages;
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
    if (name.trim().length > CONFIG.SANITIZATION.MAX_PAGE_NAME_LENGTH) {
      return { valid: false, message: `Nome da página deve ter no máximo ${CONFIG.SANITIZATION.MAX_PAGE_NAME_LENGTH} caracteres` };
    }
    return { valid: true };
  }

  static sanitizePageName(name) {
    if (!name) return '';
    return DOMPurify.sanitize(name.trim()
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, CONFIG.SANITIZATION.MAX_PAGE_NAME_LENGTH)
    );
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
    if (title.trim().length > 50) {
      return { valid: false, message: 'Título deve ter no máximo 50 caracteres' };
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
    if (message.trim().length > CONFIG.MAX_MESSAGE_LENGTH) {
      return { valid: false, message: `Mensagem deve ter no máximo ${CONFIG.MAX_MESSAGE_LENGTH} caracteres` };
    }
    return { valid: true };
  }

  static validateEmail(email) {
    if (!email) {
      return { valid: false, message: 'E-mail é obrigatório!' };
    }
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

    if (effect === 'emoji-rain') {
      this.startEmojiRain(container);
    } else if (effect === 'rain') {
      this.startRainEffect(container);
    }
  }

  static startEmojiRain(container) {
    const createEmoji = () => {
      const emoji = document.createElement('div');
      emoji.className = 'emoji-falling';
      emoji.textContent = CONFIG.EMOJIS[Math.floor(Math.random() * CONFIG.EMOJIS.length)];
      emoji.style.setProperty('--start-x', `${Math.random() * 100}vw`);
      emoji.style.animationDuration = `${3 + Math.random() * 2}s`;
      emoji.style.animationDelay = `-${Math.random() * 2}s`;
      container.appendChild(emoji);
      setTimeout(() => emoji.remove(), 5000);
    };

    const interval = setInterval(createEmoji, 150);
    STATE.activeEffects.emoji = { interval };
  }

  static startRainEffect(container) {
    const createRainDrop = () => {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
      container.appendChild(drop);
      setTimeout(() => drop.remove(), 2000);
    };

    const interval = setInterval(createRainDrop, 50);
    STATE.activeEffects.rain = { interval };
  }

  static clearEffects(container) {
    container.className = 'preview-content';
    container.removeAttribute('data-bg');

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

class ImageHandler {
  static async processFiles(files) {
    const validFiles = Array.from(files).filter(file =>
      CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type) &&
      file.size <= CONFIG.MAX_IMAGE_SIZE
    );

    if (!validFiles.length) {
      throw new Error(`Escolha imagens válidas (${CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}), até ${CONFIG.MAX_IMAGE_SIZE / 1024 / 1024}MB cada.`);
    }

    if (STATE.selectedImages.length + validFiles.length > CONFIG.MAX_IMAGES) {
      throw new Error(`No máximo ${CONFIG.MAX_IMAGES} imagens são permitidas.`);
    }

    const uploadPromises = validFiles.map(file => this.uploadImage(file));
    const results = await Promise.allSettled(uploadPromises);

    const successfulUploads = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    if (successfulUploads.length === 0 && results.some(r => r.status === 'rejected')) {
      throw new Error('Falha ao enviar imagens. Tente novamente.');
    }

    return successfulUploads;
  }

  static async uploadImage(file) {
    if (!window.supabase) {
      throw new Error('Serviço de armazenamento indisponível no momento.');
    }

    try {
      // Mostrar progresso
      const progressId = `progress-${Date.now()}`;
      const progressElement = document.createElement('div');
      progressElement.id = progressId;
      progressElement.className = 'upload-progress';
      DOM.UPLOAD_AREA.appendChild(progressElement);

      const fileId = crypto.randomUUID();
      const fileExt = file.name.split('.').pop();
      const filePath = `card-images/${fileId}.${fileExt}`;

      const { data, error } = await window.supabase.storage
        .from('card-images')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
          cacheControl: '3600'
        });

      progressElement.remove();

      if (error) throw error;

      const { data: { publicUrl } } = window.supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error(`Falha ao enviar "${file.name}": ${error.message}`);
    }
  }

  static updateThumbnails() {
    DOM.THUMBNAILS_CONTAINER.innerHTML = '';
    STATE.selectedImages.forEach((img, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'thumbnail';
      thumbnail.innerHTML = `
        <img src="${img}" alt="Imagem ${index + 1}" loading="lazy">
        <button class="thumbnail-remove" data-index="${index}" aria-label="Remover imagem">
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
        slide.setAttribute('aria-hidden', 'false');
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
    const link = STATE.formData.conteudo.music || '';
    const player = DOM.PREVIEW_PLAYER;

    // Limpar player existente
    player.innerHTML = '';
    player.classList.remove('has-music', 'has-error');

    // Remover todos os iframes primeiro para evitar vazamento de memória
    const iframes = player.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.src = '';
      iframe.remove();
    });

    if (!link) {
      this.showPlaceholder(player);
      return;
    }

    const sanitizedLink = DOMPurify.sanitize(link);
    let playerContent;

    if (this.isYouTubeLink(sanitizedLink)) {
      const videoId = this.extractYouTubeId(sanitizedLink);
      playerContent = videoId ? this.createYouTubePlayer(videoId) : this.createError('Link do YouTube inválido');
    } else if (this.isSpotifyLink(sanitizedLink)) {
      const spotifyId = this.extractSpotifyId(sanitizedLink);
      playerContent = spotifyId ? this.createSpotifyPlayer(spotifyId) : this.createError('Link do Spotify inválido');
    } else {
      playerContent = this.createError('Insira um link válido do YouTube ou Spotify');
    }

    player.classList.add(playerContent.classList.contains('music-error') ? 'has-error' : 'has-music');
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

        // Validação básica dos dados
        if (!parsed.conteudo) throw new Error('Estrutura de dados inválida');

        STATE.formData = {
          email: parsed.email || '',
          plano: parsed.plano || '',
          status_pagamento: parsed.status_pagamento || 'pendente',
          conteudo: {
            pageName: parsed.conteudo.pageName || '',
            title: parsed.conteudo.title || '',
            message: parsed.conteudo.message || '',
            background: parsed.conteudo.background || null,
            images: parsed.conteudo.images || [],
            music: parsed.conteudo.music || null
          }
        };

        // Sincroniza com o getter/setter
        STATE.selectedImages = STATE.formData.conteudo.images;
        STATE.selectedBackground = STATE.formData.conteudo.background;

        this.updateUIFromState();
      } catch (e) {
        console.error('Erro ao carregar rascunho:', e);
        this.clearDraft();
      }
    }
  }

  static saveDraft() {
    try {
      // Garante que tudo está sincronizado antes de salvar
      STATE.formData.conteudo.images = STATE.selectedImages;
      STATE.formData.conteudo.background = STATE.selectedBackground;

      localStorage.setItem('agradeceai_draft', JSON.stringify(STATE.formData));
    } catch (e) {
      console.error('Erro ao salvar rascunho:', e);
    }
  }

  static clearDraft() {
    localStorage.removeItem('agradeceai_draft');
  }

  static updateUIFromState() {
    if (STATE.currentStep === 8 && !STATE.formData.email) {
      NavigationManager.showAlert('Insira seu e-mail primeiro');
      STATE.currentStep = 7;
      NavigationManager.updateProgressBar();
      return;
    }

    // Atualiza inputs
    DOM.PAGE_NAME_INPUT.value = STATE.formData.conteudo.pageName || '';
    DOM.PAGE_TITLE_INPUT.value = STATE.formData.conteudo.title || '';
    DOM.MESSAGE_TEXTAREA.value = STATE.formData.conteudo.message || '';
    DOM.MUSIC_LINK_INPUT.value = STATE.formData.conteudo.music || '';
    DOM.EMAIL_INPUT.value = STATE.formData.email || '';

    // Atualiza previews
    this.updateBrowserUrl();
    this.updateTitlePreview();
    this.updateMessagePreview();
    MusicPlayer.updatePreview();
    ImageHandler.updateThumbnails();
    ImageHandler.updateImageSlider();

    // Atualiza background selecionado
    const bgOption = document.querySelector(`.background-option[data-bg="${STATE.selectedBackground || 'none'}"]`);
    if (bgOption && !bgOption.classList.contains('selected')) {
      bgOption.click();
    }
  }

  static updateBrowserUrl() {
    const sanitized = FormValidator.sanitizePageName(STATE.formData.conteudo.pageName);
    DOM.BROWSER_URL.textContent = `agradeceai.com/${sanitized || 'seu-link'}`;
  }

  static updateTitlePreview() {
    DOM.PREVIEW_TITLE.textContent = DOMPurify.sanitize(STATE.formData.conteudo.title) || 'Título da Página';
  }

  static updateMessagePreview() {
    const message = STATE.formData.conteudo.message || '';
    const remaining = CONFIG.MAX_MESSAGE_LENGTH - message.length;
    DOM.CHAR_COUNTER.textContent = `${remaining} caracteres restantes`;

    DOM.PREVIEW_MESSAGE.innerHTML = message
      ? DOMPurify.sanitize(message.replace(/\n/g, '<br>').replace(/ {2}/g, ' &nbsp;'))
      : 'Sua mensagem aparecerá aqui...';
  }
}

class NavigationManager {
  static isNavigating = false;

  static async goToNextStep() {
    if (this.isNavigating || STATE.currentStep >= CONFIG.MAX_STEPS) {
      console.log('Navegação bloqueada - já em transição ou no último passo');
      return;
    }

    const validations = {
      1: () => FormValidator.validatePageName(STATE.formData.conteudo.pageName),
      2: () => FormValidator.validatePageTitle(STATE.formData.conteudo.title),
      3: () => FormValidator.validateMessage(STATE.formData.conteudo.message),
      7: () => FormValidator.validateEmail(STATE.formData.email)
    };

    if (validations[STATE.currentStep]) {
      const validation = validations[STATE.currentStep]();
      if (!validation.valid) {
        this.showAlert(validation.message);
        this.focusInvalidField(STATE.currentStep);
        return;
      }
    }

    await this.animateStepTransition(true);
  }

  static async goToPrevStep() {
    if (this.isNavigating || STATE.currentStep <= 1) return;
    await this.animateStepTransition(false);
  }

  static async animateStepTransition(forward) {
    return new Promise((resolve) => {
      try {
        console.log('Iniciando transição. CurrentStep:', STATE.currentStep, 'Forward:', forward);
        this.isNavigating = true;
        const currentStepElement = DOM.STEPS[STATE.currentStep - 1];
        const nextStepIndex = forward ? STATE.currentStep + 1 : STATE.currentStep - 1;
        const nextStepElement = DOM.STEPS[nextStepIndex - 1];
        console.log('Current Element:', currentStepElement);
        console.log('Next Element:', nextStepElement);
  
        currentStepElement.style.opacity = '0';
        currentStepElement.style.transform = forward ? 'translateX(-20px)' : 'translateX(20px)';
        currentStepElement.classList.remove('active');
  
        nextStepElement.classList.add('active');
        nextStepElement.style.opacity = '0';
        nextStepElement.style.transform = forward ? 'translateX(20px)' : 'translateX(-20px)';
  
        requestAnimationFrame(() => {
          console.log('Executando requestAnimationFrame para etapa:', nextStepIndex);
          try {
            nextStepElement.style.opacity = '1';
            nextStepElement.style.transform = 'translateX(0)';
            STATE.currentStep = nextStepIndex;
            this.updateProgressBar();
            this.scrollToTop();
            this.isNavigating = false;
            console.log('Transição concluída. isNavigating:', this.isNavigating);
            resolve();
          } catch (error) {
            console.error('Erro na animação interna:', error);
            this.isNavigating = false;
            resolve();
          }
        });
      } catch (error) {
        console.error('Erro ao iniciar animação:', error);
        this.isNavigating = false;
        resolve();
      }
    });
  }

  static focusInvalidField(step) {
    const fields = {
      1: DOM.PAGE_NAME_INPUT,
      2: DOM.PAGE_TITLE_INPUT,
      3: DOM.MESSAGE_TEXTAREA,
      7: DOM.EMAIL_INPUT
    };

    if (fields[step]) {
      fields[step].focus();
      fields[step].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.form-alert');
    existingAlerts.forEach(alert => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 400);
    });

    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `form-alert ${type}`;
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');

    // Conteúdo do alerta
    const icon = document.createElement('span');
    icon.className = 'alert-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'error' ? '⚠️' : '✅';

    const text = document.createElement('span');
    text.textContent = DOMPurify.sanitize(message);

    alert.append(icon, text);
    document.body.appendChild(alert);

    // Forçar recálculo de layout para animação
    void alert.offsetWidth;

    // Animação de entrada
    alert.classList.add('show');

    // Remover após duração
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 400);
    }, duration);
  }
}

class App {
  static async validateFormData(data) {
    const validations = [
      FormValidator.validateEmail(data.email),
      FormValidator.validatePageName(data.conteudo.pageName),
      FormValidator.validatePageTitle(data.conteudo.title),
      FormValidator.validateMessage(data.conteudo.message),
      FormValidator.validateImages(data.conteudo.images),
      { valid: ['para_sempre', 'anual'].includes(data.plano), message: 'Escolha um plano válido' }
    ];

    const error = validations.find(v => !v.valid);
    if (error) throw new Error(error.message);

    if (data.conteudo.music && !MusicPlayer.isYouTubeLink(data.conteudo.music) && !MusicPlayer.isSpotifyLink(data.conteudo.music)) {
      throw new Error('Link de música deve ser do YouTube ou Spotify');
    }
  }

  static async handleFormSubmission() {
    const submitBtn = document.querySelector('.btn-submit');
    if (!submitBtn) return;

    try {
      // Feedback visual
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

      // Validar dados
      await this.validateFormData(STATE.formData);

      // Enviar dados
      const response = await this.submitFormData(STATE.formData);

      // Feedback de sucesso
      NavigationManager.showAlert(
        `Cartão criado com sucesso! Acesse em: ${response.url}`,
        'success'
      );

      // Limpar rascunho e redirecionar
      StateManager.clearDraft();
      setTimeout(() => {
        window.location.href = response.redirectUrl || '/obrigado.html';
      }, 3000);
    } catch (error) {
      console.error('Erro no envio do formulário:', error);
      NavigationManager.showAlert(error.message || 'Erro ao criar cartão');

      // Restaurar botão
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Selecionar';
    }
  }

  static async submitFormData(data) {
    if (!window.supabase) {
      throw new Error('Serviço indisponível no momento. Tente novamente mais tarde.');
    }

    try {
      const id = crypto.randomUUID();
      const token_edit = crypto.randomUUID();
      const sanitizedPageName = FormValidator.sanitizePageName(data.conteudo.pageName);
      const url = `agradeceai.com/c/${id}-${sanitizedPageName}`;

      // Preparar dados para inserção
      const cardData = {
        id,
        email: data.email,
        url,
        status_pagamento: data.status_pagamento || 'pendente',
        plano: data.plano,
        token_edit,
        conteudo: {
          pageName: data.conteudo.pageName,
          title: data.conteudo.title,
          message: data.conteudo.message,
          background: data.conteudo.background,
          images: data.conteudo.images || [],
          music: data.conteudo.music || null
        },
        created_at: new Date().toISOString()
      };

      // Inserir no Supabase
      const { data: response, error } = await window.supabase
        .from('cards')
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Erro no Supabase:', error);
        throw this.handleSupabaseError(error);
      }

      return {
        ...response,
        url,
        redirectUrl: `/c/${id}-${sanitizedPageName}`
      };
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      throw error;
    }
  }

  static handleSupabaseError(error) {
    switch (error.code) {
      case '23505':
        return new Error('Já existe um cartão com este nome. Escolha outro.');
      case '413':
        return new Error('Dados muito grandes. Reduza o tamanho das imagens.');
      case '42501':
        return new Error('Permissão negada. Entre em contato com o suporte.');
      default:
        return new Error(`Erro no servidor: ${error.message}`);
    }
  }

  static async init() {
    console.log('[App] Iniciando aplicação...');

    // Verificar elementos essenciais
    if (!this.checkRequiredElements()) {
      NavigationManager.showAlert('Erro ao carregar formulário. Recarregue a página.');
      return;
    }

    try {
      // Inicializar Supabase
      const supabaseReady = await initializeSupabase();
      if (!supabaseReady) {
        NavigationManager.showAlert('Algumas funcionalidades estarão limitadas devido a problemas de conexão.');
      }

      // Configurar eventos
      this.setupEventListeners();

      // Inicializar componentes
      ImageHandler.initImageSlider();
      StateManager.loadDraft();
      this.setupMessageCounter();
      this.initBackgroundPreviews();
      this.setupPlanSelection();

      console.log('[App] Inicialização concluída');
    } catch (error) {
      console.error('[App] Erro na inicialização:', error);
      NavigationManager.showAlert('Erro ao iniciar. Recarregue a página.');
    }
  }

  static checkRequiredElements() {
    const requiredElements = [
      DOM.FORM, DOM.NEXT_BUTTON, DOM.PREV_BUTTON,
      DOM.PAGE_NAME_INPUT, DOM.PAGE_TITLE_INPUT,
      DOM.MESSAGE_TEXTAREA, DOM.PREVIEW_CONTENT
    ];

    const missingElements = requiredElements.filter(el => !el);
    if (missingElements.length) {
      console.error('Elementos ausentes:', missingElements);
      return false;
    }

    return true;
  }

  static setupEventListeners() {
    // Navegação
    DOM.NEXT_BUTTON.addEventListener('click', (e) => {
      e.preventDefault();
      NavigationManager.goToNextStep();
    });

    DOM.PREV_BUTTON.addEventListener('click', (e) => {
      e.preventDefault();
      NavigationManager.goToPrevStep();
    });

    // Upload de imagens
    this.setupUploadListeners();

    // Inputs com debounce
    this.setupDebouncedInputs();

    // Eventos globais
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    document.addEventListener('keydown', this.handleKeyNavigation.bind(this));

    // Remoção de thumbnails
    DOM.THUMBNAILS_CONTAINER.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.thumbnail-remove');
      if (removeBtn) this.removeThumbnail(removeBtn);
    });
  }

  static setupUploadListeners() {
    DOM.UPLOAD_AREA.addEventListener('click', () => {
      if (!STATE.isUploading) DOM.FILE_INPUT.click();
    });

    DOM.UPLOAD_AREA.addEventListener('keydown', (e) => {
      if (['Enter', ' '].includes(e.key)) {
        e.preventDefault();
        DOM.FILE_INPUT.click();
      }
    });

    DOM.UPLOAD_AREA.addEventListener('dragenter', this.handleDragEnter.bind(this));
    DOM.UPLOAD_AREA.addEventListener('dragover', this.handleDragOver.bind(this));
    DOM.UPLOAD_AREA.addEventListener('dragleave', this.handleDragLeave.bind(this));
    DOM.UPLOAD_AREA.addEventListener('drop', this.handleFileDrop.bind(this));
    DOM.FILE_INPUT.addEventListener('change', this.handleFileUpload.bind(this));
  }

  static setupDebouncedInputs() {
    const debounce = (func, wait, immediate = false) => {
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
    };

    // Page Name
    DOM.PAGE_NAME_INPUT.addEventListener('input', debounce(e => {
      STATE.formData.conteudo.pageName = e.target.value;
      StateManager.updateBrowserUrl();
      StateManager.saveDraft();
    }, 300));

    // Page Title
    DOM.PAGE_TITLE_INPUT.addEventListener('input', debounce(e => {
      STATE.formData.conteudo.title = e.target.value;
      StateManager.updateTitlePreview();
      StateManager.saveDraft();
    }, 300));

    // Message
    DOM.MESSAGE_TEXTAREA.addEventListener('input', debounce(e => {
      STATE.formData.conteudo.message = DOMPurify.sanitize(e.target.value);
      StateManager.updateMessagePreview();
      StateManager.saveDraft();
    }, 100));

    // Music Link
    DOM.MUSIC_LINK_INPUT.addEventListener('input', debounce(e => {
      STATE.formData.conteudo.music = e.target.value || null;
      MusicPlayer.updatePreview();
      StateManager.saveDraft();
    }, 500));

    // Email
    DOM.EMAIL_INPUT.addEventListener('input', debounce(e => {
      STATE.formData.email = e.target.value;
      StateManager.saveDraft();
      const validation = FormValidator.validateEmail(e.target.value);
      DOM.EMAIL_ERROR.textContent = validation.valid ? '' : validation.message;
    }, 300));
  }

  static setupMessageCounter() {
    if (!DOM.CHAR_COUNTER) {
      const counter = document.createElement('div');
      counter.id = 'char-counter';
      counter.className = 'char-counter';
      counter.textContent = `${CONFIG.MAX_MESSAGE_LENGTH} caracteres restantes`;
      DOM.MESSAGE_TEXTAREA.insertAdjacentElement('afterend', counter);
      DOM.CHAR_COUNTER = counter;
    }
  }

  static initBackgroundPreviews() {
    // Forçar renderização dos efeitos
    document.querySelectorAll('.bg-preview.emoji-rain, .bg-preview.rain').forEach(preview => {
      void preview.offsetWidth;
    });

    // Configurar eventos dos backgrounds
    document.querySelectorAll('.background-option').forEach(option => {
      option.addEventListener('click', () => this.selectBackground(option));
      option.addEventListener('keydown', (e) => {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          this.selectBackground(option);
        }
      });
    });
  }

  static setupPlanSelection() {
    document.querySelectorAll('.btn-select-plan').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.handlePlanSelection(button);
      });
    });
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
      e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      StateManager.saveDraft();
    }
  }

  static handleKeyNavigation(e) {
    if (e.key === 'ArrowRight') NavigationManager.goToNextStep();
    if (e.key === 'ArrowLeft') NavigationManager.goToPrevStep();
  }

  static selectBackground(option) {
    document.querySelectorAll('.background-option').forEach(el => {
      el.classList.remove('selected');
    });

    option.classList.add('selected');
    STATE.selectedBackground = option.dataset.bg;
    STATE.formData.conteudo.background = option.dataset.bg;
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
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-content">
        <p>${DOMPurify.sanitize(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn-cancel">Cancelar</button>
          <button type="button" class="btn-confirm">Confirmar</button>
        </div>
      </div>
    `;

    // Foco no primeiro botão para acessibilidade
    const confirmBtn = modal.querySelector('.btn-confirm');
    const cancelBtn = modal.querySelector('.btn-cancel');

    confirmBtn.addEventListener('click', () => {
      onConfirm();
      modal.remove();
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Fechar ao pressionar ESC
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    });

    document.body.appendChild(modal);

    // Animação de entrada
    setTimeout(() => modal.classList.add('open'), 10);

    // Focar no botão de cancelar por padrão
    cancelBtn.focus();

    return modal;
  }

  static handlePlanSelection(button) {
    const planCard = button.closest('.plan-card');
    const planName = planCard.querySelector('h3').textContent.toLowerCase().replace(' ', '_');
    STATE.formData.plano = planName === 'para_sempre' ? 'para_sempre' : 'anual';
    this.handleFormSubmission();
  }
}

/**
 * =============================================
 * Inicialização da Aplicação
 * =============================================
 */
document.addEventListener('DOMContentLoaded', () => {
  // Adicionar classe de carregamento ao body
  document.body.classList.add('app-loading');

  // Inicializar app quando tudo estiver pronto
  const init = async () => {
    try {
      await App.init();
    } catch (error) {
      console.error('Falha crítica na inicialização:', error);
      NavigationManager.showAlert('Falha ao carregar o aplicativo. Recarregue a página.');
    } finally {
      document.body.classList.remove('app-loading');
    }
  };

  init();
});