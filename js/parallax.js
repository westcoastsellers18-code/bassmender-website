// ===== PARALLAX DEPTH LAYERS =====
(function() {
  var layers = document.querySelectorAll('.parallax-layer');
  if (!layers.length) return;

  // Disable on mobile to avoid iOS scroll jank
  if (window.matchMedia('(max-width: 768px)').matches) return;

  var ticking = false;

  function updateParallax() {
    var scrollY = window.scrollY;
    layers.forEach(function(layer) {
      var speed = parseFloat(layer.dataset.speed) || 0.05;
      layer.style.transform = 'translate3d(0,' + (-scrollY * speed) + 'px,0)';
    });
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();
