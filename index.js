document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');

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
