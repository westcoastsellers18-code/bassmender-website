// ===== SPACE PARTICLE SYSTEM =====
(function() {
  var canvas = document.getElementById('space-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var width, height;
  var stars = [];
  var nebulaClouds = [];
  var mouseX = 0, mouseY = 0;

  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var STAR_COUNT = isMobile ? 120 : 200;
  var NEBULA_COUNT = 5;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color: getStarColor()
    };
  }

  function getStarColor() {
    var colors = ['#EDEDED', '#5D3FD3', '#FF5CA7', '#4D9DE0', '#32FF7E'];
    var weights = [0.5, 0.15, 0.1, 0.15, 0.1];
    var r = Math.random();
    var sum = 0;
    for (var i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (r <= sum) return colors[i];
    }
    return colors[0];
  }

  function createNebula() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 200 + 100,
      color: Math.random() > 0.5 ? '93, 63, 211' : '255, 92, 167',
      opacity: Math.random() * 0.03 + 0.01,
      driftX: (Math.random() - 0.5) * 0.1,
      driftY: (Math.random() - 0.5) * 0.1
    };
  }

  function init() {
    resize();
    stars = [];
    nebulaClouds = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }
    for (var j = 0; j < NEBULA_COUNT; j++) {
      nebulaClouds.push(createNebula());
    }
  }

  function drawStar(star, time) {
    var twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
    var alpha = star.opacity * twinkle;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.globalAlpha = alpha;
    ctx.fill();

    if (star.size > 1.2) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      var grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
      grad.addColorStop(0, star.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = alpha * 0.3;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function drawNebula(nebula) {
    var grad = ctx.createRadialGradient(
      nebula.x, nebula.y, 0,
      nebula.x, nebula.y, nebula.radius
    );
    grad.addColorStop(0, 'rgba(' + nebula.color + ', ' + nebula.opacity + ')');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(nebula.x - nebula.radius, nebula.y - nebula.radius, nebula.radius * 2, nebula.radius * 2);
  }

  function update() {
    var parallaxX = (mouseX - width / 2) * 0.01;
    var parallaxY = (mouseY - height / 2) * 0.01;

    stars.forEach(function(star) {
      star.y += star.speed;
      star.x += parallaxX * star.speed;
      star.y += parallaxY * star.speed * 0.5;

      if (star.y > height + 10) {
        star.y = -10;
        star.x = Math.random() * width;
      }
      if (star.x > width + 10) star.x = -10;
      if (star.x < -10) star.x = width + 10;
    });

    nebulaClouds.forEach(function(nebula) {
      nebula.x += nebula.driftX;
      nebula.y += nebula.driftY;
      if (nebula.x > width + nebula.radius) nebula.x = -nebula.radius;
      if (nebula.x < -nebula.radius) nebula.x = width + nebula.radius;
      if (nebula.y > height + nebula.radius) nebula.y = -nebula.radius;
      if (nebula.y < -nebula.radius) nebula.y = height + nebula.radius;
    });
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    nebulaClouds.forEach(function(n) { drawNebula(n); });
    stars.forEach(function(star) { drawStar(star, time); });
  }

  function loop(time) {
    update();
    draw(time);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', function() {
    resize();
    stars.forEach(function(star) {
      if (star.x > width) star.x = Math.random() * width;
      if (star.y > height) star.y = Math.random() * height;
    });
  });

  window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  init();
  requestAnimationFrame(loop);
})();
