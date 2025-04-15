document.addEventListener('DOMContentLoaded', function() {
    // ========== EFEITO DE PARTÍCULAS 3D ==========
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    // Configuração das Partículas
    const particles = [];
    const particleCount = window.innerWidth < 768 ? 30 : 60;
  
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.density = Math.random() * 30 + 1;
        this.color = `hsla(${Math.random() * 60 + 200}, 100%, 65%, ${Math.random() * 0.5 + 0.1})`;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }
      
      update() {
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Efeito de flutuação suave
        if (Math.random() < 0.1) {
          this.speedX = Math.random() * 2 - 1;
          this.speedY = Math.random() * 2 - 1;
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Efeito de brilho
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      }
    }
  
    // Inicializar Partículas
    function initParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
  
    // Animação das Partículas
    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Linhas de conexão
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance = Math.sqrt(
            Math.pow(particles[a].x - particles[b].x, 2) + 
            Math.pow(particles[a].y - particles[b].y, 2)
          );
          
          if (distance < 150) {
            ctx.strokeStyle = `hsla(200, 100%, 65%, ${1 - distance/150})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        particles[a].update();
        particles[a].draw();
      }
      requestAnimationFrame(animateParticles);
    }
  
    // Redimensionamento
    window.addEventListener('resize', function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  
    // ========== EFEITO MAGNÉTICO NO BOTÃO ==========
    const btn = document.getElementById('searchBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnIcon = btn.querySelector('.btn-icon');
    
    btn.addEventListener('mousemove', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Movimento do texto e ícone
      btnText.style.transform = `translate(${(x - rect.width/2) * 0.1}px, ${(y - rect.height/2) * 0.1}px)`;
      btnIcon.style.transform = `translate(${(x - rect.width/2) * 0.2}px, ${(y - rect.height/2) * 0.2}px)`;
      
      // Efeito de partículas no mouse
      if (Math.random() > 0.7) {
        createParticle(x, y);
      }
    });
    
    btn.addEventListener('mouseleave', function() {
      btnText.style.transform = 'translate(0, 0)';
      btnIcon.style.transform = 'translate(0, 0)';
    });
    
    function createParticle(x, y) {
      const particle = document.createElement('span');
      particle.className = 'btn-particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      btn.appendChild(particle);
      
      setTimeout(() => {
        particle.style.opacity = '0';
        particle.style.transform = `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px)`;
      }, 10);
      
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  
    // ========== LÓGICA DE BUSCA ==========
    const memoryCode = document.getElementById('memoryCode');
    const searchResult = document.getElementById('searchResult');
    let confetti = null;
  
    // Configurar Confetti
    function setupConfetti() {
      const confettiSettings = {
        target: 'confetti-canvas',
        max: 150,
        size: 1.5,
        animate: true,
        props: ['circle', 'square', 'triangle', 'line'],
        colors: [[99, 102, 241], [16, 185, 129], [248, 113, 113], [245, 158, 11]],
        clock: 25,
        rotate: true,
        start_from_edge: true,
        respawn: true
      };
      confetti = new ConfettiGenerator(confettiSettings);
    }
  
    // Buscar Memória
    function searchMemory() {
      const code = memoryCode.value.trim();
      
      if (!code) {
        showMessage('Por favor, digite um código válido', 'error');
        memoryCode.focus();
        return;
      }
      
      showMessage('Procurando sua memória especial...', 'loading');
      
      // Simulação de busca (substitua por chamada real à API)
      setTimeout(() => {
        if (isValidCode(code)) {
          showMessage('Memória encontrada! Preparando algo especial...', 'success');
          triggerCelebration();
          // Redirecionamento real seria aqui:
          // window.location.href = `/memoria/${encodeURIComponent(code)}`;
        } else {
          showMessage('Código não encontrado. Verifique e tente novamente.', 'error');
        }
      }, 2000);
    }
  
    function isValidCode(code) {
      // Validação simples (substitua por sua lógica real)
      return code.match(/^AGR-[A-Z0-9]{6}$/i);
    }
  
    function showMessage(text, type) {
      const icon = {
        error: 'exclamation-circle',
        loading: 'spinner fa-pulse',
        success: 'check-circle'
      }[type];
      
      searchResult.innerHTML = `
        <div class="result-message ${type}">
          <i class="fas fa-${icon}"></i>
          <p>${text}</p>
        </div>
      `;
    }
  
    function triggerCelebration() {
      // Mostrar confetti
      document.getElementById('confetti-canvas').style.opacity = '1';
      confetti.render();
      
      // Efeito de pulso no card
      document.querySelector('.search-card').classList.add('celebrate');
      
      // Esconder confetti após 3 segundos
      setTimeout(() => {
        document.getElementById('confetti-canvas').style.opacity = '0';
      }, 3000);
    }
  
    // Event Listeners
    btn.addEventListener('click', searchMemory);
    memoryCode.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') searchMemory();
    });
  
    // Inicialização
    initParticles();
    animateParticles();
    setupConfetti();
  });