// ===== BOOT SEQUENCE =====
(function() {
  var bootScreen = document.getElementById('boot-screen');
  if (!bootScreen) return;

  var lines = bootScreen.querySelectorAll('.boot-line');
  var progressBar = bootScreen.querySelector('.boot-progress-bar');
  var bootComplete = false;
  var bootTimeout;

  // Bass module bar fill
  var bassBar = document.getElementById('bass-bar');
  var bassPct = document.getElementById('bass-pct');
  var bassBarInterval = null;
  var fullBlock = '\u2588';

  function startBassBar() {
    var blocks = 0;
    var totalBlocks = 12;
    bassBarInterval = setInterval(function() {
      if (bootComplete || blocks >= totalBlocks) {
        clearInterval(bassBarInterval);
        if (bassBar) bassBar.textContent = Array(totalBlocks + 1).join(fullBlock);
        if (bassPct) bassPct.textContent = '100';
        return;
      }
      blocks++;
      bassBar.textContent = Array(blocks + 1).join(fullBlock);
      bassPct.textContent = Math.round((blocks / totalBlocks) * 100);
    }, 50);
  }

  // Show lines sequentially
  lines.forEach(function(line, i) {
    var delay = parseInt(line.dataset.delay) || i * 600;
    setTimeout(function() {
      if (bootComplete) return;
      line.classList.add('visible');

      // Start bass bar fill when that line appears
      if (bassBar && line.contains(bassBar)) {
        startBassBar();
      }

      var progress = ((i + 1) / lines.length) * 100;
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }
    }, delay);
  });

  // Auto-advance after boot completes
  var totalBootTime = 5000;
  bootTimeout = setTimeout(function() {
    if (!bootComplete) finishBoot();
  }, totalBootTime);

  // Skip on any key or click
  function skipBoot() {
    if (bootComplete) return;
    finishBoot();
  }

  document.addEventListener('keydown', skipBoot);
  bootScreen.addEventListener('click', skipBoot);

  function finishBoot() {
    bootComplete = true;
    clearTimeout(bootTimeout);
    document.removeEventListener('keydown', skipBoot);
    bootScreen.removeEventListener('click', skipBoot);

    if (progressBar) progressBar.style.width = '100%';
    if (bassBarInterval) clearInterval(bassBarInterval);
    if (bassBar) bassBar.textContent = Array(13).join(fullBlock);
    if (bassPct) bassPct.textContent = '100';
    lines.forEach(function(line) { line.classList.add('visible'); });

    setTimeout(function() {
      bootScreen.style.transition = 'opacity 0.5s, transform 0.5s';
      bootScreen.style.opacity = '0';
      bootScreen.style.transform = 'scale(0.98)';

      setTimeout(function() {
        bootScreen.classList.add('hidden');
        showFileSelect();
      }, 500);
    }, 300);
  }

  function showNameSelect() {
    var nameScreen = document.getElementById('name-select-screen');
    if (nameScreen) nameScreen.classList.remove('hidden');
  }

  function showFileSelect() {
    var fileScreen = document.getElementById('file-select-screen');
    if (fileScreen) {
      if (window.BassmenderSaves) window.BassmenderSaves.renderSlots();
      fileScreen.classList.remove('hidden');
    }
  }

  window.BassmenderBoot = { showNameSelect: showNameSelect, showFileSelect: showFileSelect };
})();
