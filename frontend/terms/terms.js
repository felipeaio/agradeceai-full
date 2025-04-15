document.addEventListener('DOMContentLoaded', () => {
    // Efeito de highlight ao rolar
    const sections = document.querySelectorAll('.legal-section');
    
    const highlightSection = () => {
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          section.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
          section.style.transition = 'background-color 0.3s ease';
        } else {
          section.style.backgroundColor = 'transparent';
        }
      });
    };
    
    window.addEventListener('scroll', highlightSection);
    highlightSection(); // Executa uma vez ao carregar
  });