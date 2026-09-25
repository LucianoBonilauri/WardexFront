document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');

  const updateHeader = () => {
    // 1vh de scroll antes de activar el fondo difuminado
    header.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.01);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((item) => {
        item.classList.remove('is-active');
        item.removeAttribute('aria-current');
      });

      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    });
  });
});

// La ruta es relativa a Inicio/index.html, por eso sube una carpeta con ../
function cambiarCredenciales() {
    window.location.href = "../credenciales/credenciales.html";
}
