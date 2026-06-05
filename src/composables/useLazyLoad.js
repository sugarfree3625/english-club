export function useLazyLoad() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });

  return {
    observe: (el) => observer.observe(el),
    unobserve: (el) => observer.unobserve(el)
  };
}
