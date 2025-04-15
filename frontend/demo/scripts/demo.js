document.addEventListener('DOMContentLoaded', function() {
    // Dados do cartão (pode ser substituído por dados dinâmicos)
    const cardData = {
      title: "Nossa Jornada",
      message: "Desde o primeiro dia, cada momento foi especial.\n\nEsta é nossa história através do tempo...\n\nCom amor,\n<Seu Nome>",
      images: [
        "https://source.unsplash.com/random/800x600/?couple,love",
        "https://source.unsplash.com/random/800x600/?romantic",
        "https://source.unsplash.com/random/800x600/?together"
      ],
      music: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
    };
  
    // Elementos DOM
    const titleElement = document.getElementById('card-title');
    const messageElement = document.getElementById('card-message');
    const sliderTrack = document.getElementById('slider-track');
    const musicPlayer = document.getElementById('music-player');
  
    // Carrega os dados
    function loadCardData() {
      // Título e mensagem
      titleElement.textContent = cardData.title;
      messageElement.innerHTML = cardData.message.replace(/\n/g, '<br>');
  
      // Imagens
      if (cardData.images.length > 0) {
        sliderTrack.innerHTML = '';
        cardData.images.forEach(imgUrl => {
          const slide = document.createElement('div');
          slide.className = 'slide';
          slide.innerHTML = `<img src="${imgUrl}" alt="Memória especial">`;
          sliderTrack.appendChild(slide);
        });
      }
  
      // Música
      if (cardData.music) {
        const isSpotify = cardData.music.includes('spotify');
        const isYouTube = cardData.music.includes('youtube') || cardData.music.includes('youtu.be');
        
        if (isSpotify) {
          const trackId = extractSpotifyId(cardData.music);
          musicPlayer.innerHTML = `
            <iframe src="https://open.spotify.com/embed/track/${trackId}" 
                    frameborder="0" 
                    allowtransparency="true" 
                    allow="encrypted-media">
            </iframe>`;
        } else if (isYouTube) {
          const videoId = extractYouTubeId(cardData.music);
          musicPlayer.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>`;
        }
      }
    }
  
    // Funções auxiliares para extrair IDs
    function extractYouTubeId(url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }
  
    function extractSpotifyId(url) {
      const regExp = /spotify:track:([a-zA-Z0-9]+)|https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;
      const match = url.match(regExp);
      return match ? (match[1] || match[2]) : null;
    }
  
    // Inicialização
    loadCardData();
  
    // Slider automático (se tiver múltiplas imagens)
    if (cardData.images.length > 1) {
      let currentIndex = 0;
      setInterval(() => {
        currentIndex = (currentIndex + 1) % cardData.images.length;
        sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      }, 5000);
    }
  });