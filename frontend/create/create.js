import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/+esm';

// Configurações do Supabase
const supabaseUrl = 'https://tswzuxuthwbudkztvxod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzd3p1eHV0aHdidWRrenR2eG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Nzc2MjgsImV4cCI6MjA2MDI1MzYyOH0.upqHqTvYg65dEeYBetq6ZykT-8x0GfjX7xBMaFThtYA';
let supabase;

// Configurações da aplicação
const CONFIG = {
  MAX_STEPS: 8,
  MAX_IMAGES: 7,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SLIDE_DURATION: 3000, // 3 segundos
  MAX_EMOJIS: 50,
};

// Estado inicial da aplicação
const state = {
  currentStep: 1,
  selectedImages: [],
  selectedBackground: 'none',
  effectInterval: null,
  sliderInterval: null,
  formData: {
    email: '',
    plano: '',
    status_pagamento: 'pendente',
    conteudo: {
      pageName: '',
      title: '',
      message: '',
      background: 'none',
      images: [],
      music: null,
    },
  },
};

// Gerador de UUID
const generateUUID = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Supabase
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    NavigationManager.showAlert('Erro ao conectar com o servidor. Algumas funcionalidades podem não estar disponíveis.');
  }

  // Cache de elementos DOM
  const DOM = {
    form: document.getElementById('creation-form'),
    steps: document.querySelectorAll('.form-step'),
    progressSteps: document.querySelectorAll('.progress-step'),
    pageName: document.getElementById('page-name'),
    pageTitle: document.getElementById('page-title'),
    message: document.getElementById('page-message'),
    musicLink: document.getElementById('music-link'),
    email: document.getElementById('user-email'),
    fileInput: document.getElementById('image-upload'),
    uploadArea: document.getElementById('upload-area'),
    thumbnails: document.getElementById('thumbnails'),
    previewTitle: document.getElementById('preview-title'),
    previewMessage: document.getElementById('preview-message'),
    previewImages: document.getElementById('preview-images'),
    previewPlayer: document.getElementById('preview-player'),
    previewContent: document.getElementById('preview-content'),
    browserUrl: document.querySelector('.browser-url'),
    charCounter: document.getElementById('char-counter'),
  };

  // Classe para validação de entradas
  class Validator {
    static validatePageName(name) {
      if (!name || name.length < 3) return { valid: false, message: 'O nome deve ter no mínimo 3 caracteres' };
      if (name.length > 30) return { valid: false, message: 'O nome deve ter no máximo 30 caracteres' };
      return { valid: true };
    }

    static validateTitle(title) {
      if (!title || title.length < 3) return { valid: false, message: 'O título deve ter no mínimo 3 caracteres' };
      if (title.length > 50) return { valid: false, message: 'O título deve ter no máximo 50 caracteres' };
      return { valid: true };
    }

    static validateMessage(message) {
      if (!message || message.length < 10) return { valid: false, message: 'A mensagem deve ter no mínimo 10 caracteres' };
      if (message.length > 5000) return { valid: false, message: 'A mensagem deve ter no máximo 5000 caracteres' };
      return { valid: true };
    }

    static validateEmail(email) {
      const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
      if (!email || !regex.test(email)) return { valid: false, message: 'Por favor, insira um e-mail válido' };
      return { valid: true };
    }

    static validateMusic(link) {
      if (!link) return { valid: true };
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube\.com\/shorts)\/.+/;
      const spotifyRegex = /^(https?:\/\/)?(www\.)?open\.spotify\.com\/(track|playlist)\/.+/;
      if (!youtubeRegex.test(link) && !spotifyRegex.test(link)) {
        return { valid: false, message: 'O link deve ser do YouTube ou Spotify' };
      }
      return { valid: true };
    }

    static sanitizePageName(name) {
      return DOMPurify.sanitize(name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 30);
    }
  }

  // Classe para gerenciar efeitos de fundo
  class EffectManager {
    static applyBackground(effect) {
      if (!DOM.previewContent) return;
      this.clearEffects();
      DOM.previewContent.className = `preview-content ${effect}`;
      DOM.previewContent.setAttribute('data-bg', effect);

      if (effect === 'emoji-rain') this.startEmojiRain();
      else if (effect === 'rain') this.startRain();
    }

    static startEmojiRain() {
      if (!DOM.previewContent) return;
      let emojiCount = 0;
      const createEmoji = () => {
        if (emojiCount >= CONFIG.MAX_EMOJIS) return;
        const emoji = document.createElement('div');
        emoji.className = 'emoji-falling';
        emoji.textContent = ['❤️', '💖', '💘'][Math.floor(Math.random() * 3)];
        emoji.style.left = `${Math.random() * 100}%`;
        emoji.style.animationDuration = `${3 + Math.random() * 2}s`;
        DOM.previewContent.appendChild(emoji);
        emojiCount++;
        setTimeout(() => {
          emoji.remove();
          emojiCount--;
        }, 5000);
      };
      state.effectInterval = setInterval(createEmoji, 150);
    }

    static startRain() {
      if (!DOM.previewContent) return;
      let dropCount = 0;
      const createDrop = () => {
        if (dropCount >= CONFIG.MAX_EMOJIS) return;
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.8 + Math.random() * 0.4}s`;
        DOM.previewContent.appendChild(drop);
        dropCount++;
        setTimeout(() => {
          drop.remove();
          dropCount--;
        }, 2000);
      };
      state.effectInterval = setInterval(createDrop, 50);
    }

    static clearEffects() {
      if (!DOM.previewContent) return;
      DOM.previewContent.className = 'preview-content';
      DOM.previewContent.removeAttribute('data-bg');
      if (state.effectInterval) {
        clearInterval(state.effectInterval);
        state.effectInterval = null;
      }
      const elementsToRemove = DOM.previewContent.querySelectorAll('.emoji-falling, .rain-drop');
      elementsToRemove.forEach(el => el.remove());
    }
  }

  // Classe para gerenciar upload e visualização de imagens
  class ImageManager {
    static async uploadImages(files) {
      if (!DOM.uploadArea || !supabase) {
        NavigationManager.showAlert('Erro de conexão com o servidor.');
        return;
      }

      const validFiles = Array.from(files).filter(file => {
        const isValidType = CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
        const isValidSize = file.size <= CONFIG.MAX_IMAGE_SIZE;
        if (!isValidType) NavigationManager.showAlert(`Formato inválido: ${file.name}`, 'warning');
        if (!isValidSize) NavigationManager.showAlert(`Tamanho excedido: ${file.name}`, 'warning');
        return isValidType && isValidSize;
      });

      if (validFiles.length + state.selectedImages.length > CONFIG.MAX_IMAGES) {
        NavigationManager.showAlert(`Você pode adicionar até ${CONFIG.MAX_IMAGES} imagens`, 'warning');
        return;
      }

      if (validFiles.length === 0) {
        NavigationManager.showAlert('Nenhuma imagem válida selecionada.', 'warning');
        return;
      }

      DOM.uploadArea.classList.add('uploading');

      try {
        const uploads = validFiles.map(async file => {
          const fileExt = file.name.split('.').pop();
          const filePath = `card-images/${generateUUID()}.${fileExt}`;
          const { error } = await supabase.storage.from('card-images').upload(filePath, file);
          if (error) throw new Error(`Não foi possível enviar ${file.name}.`);
          const { data } = supabase.storage.from('card-images').getPublicUrl(filePath);
          if (!data.publicUrl) throw new Error(`Falha ao obter URL pública para ${file.name}`);
          return data.publicUrl;
        });

        const urls = await Promise.all(uploads);
        state.selectedImages = [...state.selectedImages, ...urls];
        state.formData.conteudo.images = state.selectedImages;
        this.updateThumbnails();
        this.updateSlider();
        NavigationManager.showAlert('Imagens enviadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro no upload:', error);
        NavigationManager.showAlert(`Erro ao enviar imagens: ${error.message}`);
      } finally {
        DOM.uploadArea.classList.remove('uploading');
        if (DOM.fileInput) DOM.fileInput.value = '';
      }
    }

    static updateThumbnails() {
      if (!DOM.thumbnails) return;
      DOM.thumbnails.innerHTML = '';
      state.selectedImages.forEach((url, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumbnail';
        thumb.innerHTML = `
          <img src="${url}" alt="Imagem ${index + 1}">
          <button class="thumbnail-remove" data-index="${index}" aria-label="Remover imagem ${index + 1}">
            <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        `;
        DOM.thumbnails.appendChild(thumb);
      });
    }

    static updateSlider() {
      if (!DOM.previewImages) return;
      const slider = DOM.previewImages.querySelector('.preview-slider');
      if (!slider) return;

      slider.innerHTML = '';
      if (state.selectedImages.length === 0) {
        slider.innerHTML = '<div class="preview-slide"><i class="fas fa-image"></i></div>';
      } else {
        state.selectedImages.forEach(url => {
          const slide = document.createElement('div');
          slide.className = 'preview-slide';
          slide.style.backgroundImage = `url(${url})`;
          slider.appendChild(slide);
        });
        this.startSlider();
      }
    }

    static startSlider() {
      if (state.selectedImages.length <= 1 || !DOM.previewImages) return;
      const slider = DOM.previewImages.querySelector('.preview-slider');
      if (!slider) return;

      let index = 0;
      const slide = () => {
        index = (index + 1) % state.selectedImages.length;
        slider.style.transform = `translateX(-${index * 100}%)`;
      };

      if (state.sliderInterval) clearInterval(state.sliderInterval);
      state.sliderInterval = setInterval(slide, CONFIG.SLIDE_DURATION);
    }

    static removeImage(index) {
      if (index < 0 || index >= state.selectedImages.length) return;
      state.selectedImages.splice(index, 1);
      state.formData.conteudo.images = state.selectedImages;
      this.updateThumbnails();
      this.updateSlider();
      NavigationManager.showAlert('Imagem removida com sucesso!', 'success');
    }
  }

  // Classe para gerenciar a pré-visualização de música
  class MusicManager {
    static updatePreview() {
      if (!DOM.previewPlayer) return;
      DOM.previewPlayer.innerHTML = '';
      DOM.previewPlayer.classList.remove('has-music');

      const link = state.formData.conteudo.music || '';
      if (!link) {
        DOM.previewPlayer.innerHTML = `
          <div class="music-placeholder">
            <i class="fas fa-headphones"></i>
            <p>Prévia da música aparecerá aqui</p>
          </div>
        `;
        return;
      }

      const sanitized = DOMPurify.sanitize(link);
      let html = '';
      if (sanitized.match(/youtube\.com|youtu\.be/)) {
        const idMatch = sanitized.match(/(?:v=|\/|shorts\/)([0-9A-Za-z_-]{11})/);
        const id = idMatch?.[1];
        html = id
          ? `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube Player" frameborder="0" allowfullscreen></iframe>`
          : '<div class="music-error"><i class="fas fa-exclamation-circle"></i> Link do YouTube inválido</div>';
      } else if (sanitized.match(/spotify\.com/)) {
        const idMatch = sanitized.match(/(track|playlist)\/([a-zA-Z0-9]+)/);
        const type = idMatch?.[1];
        const id = idMatch?.[2];
        html = id && type
          ? `<iframe src="https://open.spotify.com/embed/${type}/${id}" title="Spotify Player" frameborder="0"></iframe>`
          : '<div class="music-error"><i class="fas fa-exclamation-circle"></i> Link do Spotify inválido</div>';
      } else {
        html = '<div class="music-error"><i class="fas fa-exclamation-circle"></i> Link inválido</div>';
      }

      DOM.previewPlayer.innerHTML = `<div class="music-preview">${html}</div>`;
      DOM.previewPlayer.classList.add('has-music');
    }
  }

  // Classe para gerenciar navegação entre etapas
  class NavigationManager {
    static async nextStep() {
      if (state.currentStep >= CONFIG.MAX_STEPS) return;

      const validations = {
        1: () => Validator.validatePageName(DOM.pageName?.value || ''),
        2: () => Validator.validateTitle(DOM.pageTitle?.value || ''),
        3: () => Validator.validateMessage(DOM.message?.value || ''),
        6: () => Validator.validateMusic(DOM.musicLink?.value || ''),
        7: () => Validator.validateEmail(DOM.email?.value || '')
      };

      if (validations[state.currentStep]) {
        const validation = validations[state.currentStep]();
        
        if (!validation.valid) {
          this.showAlert(validation.message);
          
          // Adiciona efeito visual temporário no campo inválido
          const inputFields = {
            1: 'pageName',
            2: 'pageTitle',
            3: 'message',
            6: 'musicLink',
            7: 'email'
          };
          
          const fieldName = inputFields[state.currentStep];
          if (fieldName && DOM[fieldName]) {
            DOM[fieldName].classList.add('input-error');
            setTimeout(() => {
              DOM[fieldName].classList.remove('input-error');
            }, 2000);
          }
          
          return;
        }
      }

      // Atualiza os dados no state
      switch(state.currentStep) {
        case 1: state.formData.conteudo.pageName = DOM.pageName?.value || ''; break;
        case 2: state.formData.conteudo.title = DOM.pageTitle?.value || ''; break;
        case 3: state.formData.conteudo.message = DOM.message?.value || ''; break;
        case 6: state.formData.conteudo.music = DOM.musicLink?.value || null; break;
        case 7: state.formData.email = DOM.email?.value || ''; break;
      }

      state.currentStep++;
      this.updateUI();
    }

    static prevStep() {
      if (state.currentStep <= 1) return;
      state.currentStep--;
      this.updateUI();
    }

    static updateUI() {
      if (!DOM.steps || DOM.steps.length === 0) return;

      DOM.steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        const isActive = stepNumber === state.currentStep;
        step.style.display = isActive ? 'block' : 'none';
        step.classList.toggle('active', isActive);
        step.style.opacity = isActive ? '1' : '0';
        step.style.transform = isActive ? 'translateX(0)' : 'translateX(20px)';
      });

      if (DOM.progressSteps) {
        DOM.progressSteps.forEach((step, index) => {
          step.classList.toggle('active', index < state.currentStep);
        });
      }

      if (DOM.browserUrl) {
        const sanitized = Validator.sanitizePageName(state.formData.conteudo.pageName);
        DOM.browserUrl.textContent = `agradeceai.com/${sanitized || 'seu-link'}`;
      }

      if (DOM.previewTitle) {
        DOM.previewTitle.textContent = DOMPurify.sanitize(state.formData.conteudo.title) || 'Título da Página';
      }

      if (DOM.previewMessage) {
        DOM.previewMessage.innerHTML = DOMPurify.sanitize(
          state.formData.conteudo.message?.replace(/\n/g, '<br>')
        ) || 'Sua mensagem aparecerá aqui...';
      }

      if (DOM.charCounter) {
        const remaining = 5000 - (state.formData.conteudo.message?.length || 0);
        DOM.charCounter.textContent = `${remaining} caracteres restantes`;
      }

      EffectManager.applyBackground(state.formData.conteudo.background);
      MusicManager.updatePreview();
    }

    static showAlert(message, type = 'error') {
      const alert = document.createElement('div');
      alert.className = `form-alert ${type}`;
      alert.innerHTML = `
        <span class="alert-icon">${type === 'error' ? '⚠️' : type === 'warning' ? '⚠️' : '✅'}</span>
        ${DOMPurify.sanitize(message)}
      `;
      document.body.appendChild(alert);

      setTimeout(() => {
        alert.classList.add('show');
        setTimeout(() => {
          alert.classList.remove('show');
          setTimeout(() => alert.remove(), 400);
        }, 3000);
      }, 10);
    }
  }

  // Configurar event listeners
  const nextButtons = document.querySelectorAll('.btn-next');
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => NavigationManager.nextStep());
  });

  const prevButtons = document.querySelectorAll('.btn-prev');
  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => NavigationManager.prevStep());
  });

  // Listeners para atualização em tempo real (sem validação)
  if (DOM.pageName) {
    DOM.pageName.addEventListener('input', () => {
      state.formData.conteudo.pageName = DOM.pageName.value;
      NavigationManager.updateUI();
    });
  }

  if (DOM.pageTitle) {
    DOM.pageTitle.addEventListener('input', () => {
      state.formData.conteudo.title = DOM.pageTitle.value;
      NavigationManager.updateUI();
    });
  }

  if (DOM.message) {
    DOM.message.addEventListener('input', () => {
      state.formData.conteudo.message = DOM.message.value;
      NavigationManager.updateUI();
    });
  }

  if (DOM.musicLink) {
    DOM.musicLink.addEventListener('input', () => {
      state.formData.conteudo.music = DOM.musicLink.value || null;
      NavigationManager.updateUI();
    });
  }

  if (DOM.email) {
    DOM.email.addEventListener('input', () => {
      state.formData.email = DOM.email.value;
      NavigationManager.updateUI();
    });
  }

  // Listeners para upload de imagens
  if (DOM.uploadArea && DOM.fileInput) {
    DOM.uploadArea.addEventListener('click', () => DOM.fileInput.click());
    DOM.uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      DOM.uploadArea.classList.add('dragover');
    });
    DOM.uploadArea.addEventListener('dragleave', () => {
      DOM.uploadArea.classList.remove('dragover');
    });
    DOM.uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      DOM.uploadArea.classList.remove('dragover');
      ImageManager.uploadImages(e.dataTransfer.files);
    });
    DOM.fileInput.addEventListener('change', () => ImageManager.uploadImages(DOM.fileInput.files));
  }

  if (DOM.thumbnails) {
    DOM.thumbnails.addEventListener('click', e => {
      const removeBtn = e.target.closest('.thumbnail-remove');
      if (removeBtn) ImageManager.removeImage(parseInt(removeBtn.dataset.index));
    });
  }

  // Listeners para seleção de fundo
  const backgroundOptions = document.querySelectorAll('.background-option');
  backgroundOptions.forEach(option => {
    option.addEventListener('click', () => {
      backgroundOptions.forEach(opt => {
        opt.classList.remove('selected');
        opt.setAttribute('aria-selected', 'false');
      });
      option.classList.add('selected');
      option.setAttribute('aria-selected', 'true');
      state.formData.conteudo.background = option.dataset.bg;
      NavigationManager.updateUI();
    });
    option.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        option.click();
      }
    });
  });

  // Listener para envio do formulário
  if (DOM.form) {
    DOM.form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!supabase) {
        NavigationManager.showAlert('Erro de conexão com o servidor.');
        return;
      }

      if (!e.submitter || !e.submitter.dataset.plan) {
        NavigationManager.showAlert('Por favor, selecione um plano.');
        return;
      }

      state.formData.plano = e.submitter.dataset.plan;
      
      // Validação final antes de enviar
      const validations = [
        Validator.validatePageName(state.formData.conteudo.pageName),
        Validator.validateTitle(state.formData.conteudo.title),
        Validator.validateMessage(state.formData.conteudo.message),
        Validator.validateEmail(state.formData.email),
      ];

      const invalid = validations.find(v => !v.valid);
      if (invalid) {
        NavigationManager.showAlert(invalid.message);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Falha ao criar cartão');
        }

        const result = await response.json();
        NavigationManager.showAlert('Cartão criado com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
          window.location.href = result.data.url;
        }, 2000);
      } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        NavigationManager.showAlert(`Erro ao criar cartão: ${error.message}`);
      }
    });
  }

  // Inicializar UI
  NavigationManager.updateUI();
});