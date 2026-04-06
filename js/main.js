// ===== MAIN SITE LOGIC =====
(function() {
  var nav = document.getElementById('main-nav');
  var hamburger = document.getElementById('nav-hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  var navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  var navPlayerName = document.getElementById('nav-player-name');
  var lastScroll = 0;

  // Idle detection for logo dot
  var logoDot = document.querySelector('.logo-dot');
  var idleTimer = null;
  var IDLE_TIMEOUT = 120000; // 2 minutes

  function goIdle() {
    if (logoDot) logoDot.classList.add('idle');
  }

  function resetIdle() {
    if (logoDot) logoDot.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goIdle, IDLE_TIMEOUT);
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function(evt) {
    window.addEventListener(evt, resetIdle, { passive: true });
  });
  idleTimer = setTimeout(goIdle, IDLE_TIMEOUT);

  // Change name: click player name in nav to go back to file select
  if (navPlayerName) {
    navPlayerName.addEventListener('click', function() {
      // Sync achievements before leaving
      if (window.BassmenderSaves) window.BassmenderSaves.syncAchievements();

      var mainContent = document.getElementById('main-content');
      var fileScreen = document.getElementById('file-select-screen');
      if (mainContent) mainContent.classList.add('hidden');
      if (nav) nav.classList.add('hidden');
      if (fileScreen) {
        if (window.BassmenderSaves) window.BassmenderSaves.renderSlots();
        fileScreen.classList.remove('hidden');
      }
    });
  }

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('hidden');
    });
  }

  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      if (hamburger) hamburger.classList.remove('open');
      if (mobileNav) mobileNav.classList.add('hidden');
      document.querySelectorAll('.nav-link').forEach(function(l) { l.classList.remove('active'); });
      var section = link.dataset.section;
      var match = document.querySelector('.nav-link[data-section="' + section + '"]');
      if (match) match.classList.add('active');
    });
  });

  window.addEventListener('scroll', function() {
    var currentScroll = window.scrollY;
    if (nav && !nav.classList.contains('hidden')) {
      if (currentScroll > lastScroll && currentScroll > 100) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
    }
    lastScroll = currentScroll;
    updateActiveSection();
  });

  function updateActiveSection() {
    var sections = document.querySelectorAll('.section');
    var currentSection = 'home';
    sections.forEach(function(section) {
      if (section.getBoundingClientRect().top <= 150) currentSection = section.id;
    });
    document.querySelectorAll('.nav-link').forEach(function(link) {
      link.classList.remove('active');
      if (link.dataset.section === currentSection) link.classList.add('active');
    });
  }

  function initScrollAnimations() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section-header, .tour-item, .merch-card, .gear-item, .about-content')
      .forEach(function(el) { observer.observe(el); });

    // Footer observer for Void Walker achievement
    var footerObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && window.BassmenderAchievements) {
          window.BassmenderAchievements.reachedFooter();
          footerObs.disconnect();
        }
      });
    }, { threshold: 0.5 });
    var footer = document.querySelector('.site-footer');
    if (footer) footerObs.observe(footer);
  }

  function initOrbitalPlayer() {
    var nodes = document.querySelectorAll('.track-node');
    var nowPlayingTitle = document.getElementById('now-playing-title');
    var nowPlayingArtist = document.getElementById('now-playing-artist');
    var waveformVis = document.getElementById('waveform-vis');
    var playBtn = document.getElementById('player-play-btn');
    var playIcon = document.getElementById('play-icon');
    var progressWrap = document.getElementById('player-progress-wrap');
    var progressBar = document.getElementById('player-progress-bar');
    var playerTime = document.getElementById('player-time');
    var volumeSlider = document.getElementById('volume-slider');
    var playerControls = document.getElementById('player-controls');
    var celestialBody = document.getElementById('celestial-body');
    var celestialToggle = document.getElementById('celestial-toggle');
    var activeNode = null;
    var audio = new Audio();
    audio.volume = 0.8;

    // Web Audio API for frequency analysis
    var audioCtx = null;
    var analyser = null;
    var source = null;
    var freqData = null;
    var audioConnected = false;

    function connectAudioAnalyser() {
      if (audioConnected) return;
      // Skip analyser on file:// protocol — CORS blocks MediaElementSource
      if (window.location.protocol === 'file:') return;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        audioConnected = true;
      } catch (e) {
        audioConnected = false;
      }
    }

    var celestialCore = celestialBody ? celestialBody.querySelector('.celestial-core') : null;
    var celestialDisk = celestialBody ? celestialBody.querySelector('.accretion-disk') : null;
    var celestialRings = celestialBody ? celestialBody.querySelectorAll('.celestial-ring') : [];
    var waveformBars = waveformVis ? waveformVis.querySelectorAll('span') : [];

    // Color gradient for waveform bars (left to right: purple → pink → blue → green)
    var barColors = [];
    (function() {
      var colors = [
        [93,63,211],   // purple
        [255,92,167],  // pink
        [77,157,224],  // blue
        [50,255,126]   // green
      ];
      for (var i = 0; i < 20; i++) {
        var t = i / 19;
        var seg = t * (colors.length - 1);
        var idx = Math.floor(seg);
        var frac = seg - idx;
        if (idx >= colors.length - 1) { idx = colors.length - 2; frac = 1; }
        var r = Math.round(colors[idx][0] + (colors[idx+1][0] - colors[idx][0]) * frac);
        var g = Math.round(colors[idx][1] + (colors[idx+1][1] - colors[idx][1]) * frac);
        var b = Math.round(colors[idx][2] + (colors[idx+1][2] - colors[idx][2]) * frac);
        barColors.push('rgb(' + r + ',' + g + ',' + b + ')');
      }
    })();

    function updateAudioReactivity() {
      if (!analyser || !isPlaying) {
        // Reset bars when not playing
        if (!isPlaying && waveformBars.length) {
          waveformBars.forEach(function(bar) {
            bar.style.height = '3px';
          });
        }
        requestAnimationFrame(updateAudioReactivity);
        return;
      }

      analyser.getByteFrequencyData(freqData);

      // === Waveform bars: map frequency bins to 20 bars ===
      var binCount = analyser.frequencyBinCount; // 128
      var binsPerBar = Math.floor(binCount / 20);
      for (var i = 0; i < waveformBars.length; i++) {
        var sum = 0;
        var start = i * binsPerBar;
        for (var j = start; j < start + binsPerBar && j < binCount; j++) {
          sum += freqData[j];
        }
        var avg = sum / binsPerBar / 255; // 0-1
        var height = 3 + avg * 25; // 3px min, 28px max
        waveformBars[i].style.height = height + 'px';
        waveformBars[i].style.background = barColors[i];
      }

      // === Celestial body reactivity ===
      if (celestialBody) {
        // Bass (bins 0-8), mids (bins 8-32), highs (bins 32-64)
        var bass = 0, mids = 0, highs = 0;
        for (var i = 0; i < 8; i++) bass += freqData[i];
        for (var i = 8; i < 32; i++) mids += freqData[i];
        for (var i = 32; i < 64; i++) highs += freqData[i];
        bass = bass / (8 * 255);
        mids = mids / (24 * 255);
        highs = highs / (32 * 255);

        var coreScale = 1 + bass * 0.5;
        var glowSize = 15 + bass * 30;
        var glowOpacity = 0.3 + bass * 0.7;

        if (celestialCore) {
          celestialCore.style.transform = 'scale(' + coreScale + ')';
          if (celestialBody.classList.contains('sun-mode')) {
            celestialCore.style.boxShadow = '0 0 ' + glowSize + 'px rgba(255,200,50,' + glowOpacity + '), 0 0 ' + (glowSize * 2) + 'px rgba(255,150,0,' + (glowOpacity * 0.5) + ')';
          } else {
            celestialCore.style.boxShadow = '0 0 ' + glowSize + 'px rgba(93,63,211,' + (glowOpacity * 0.6) + '), inset 0 0 10px rgba(0,0,0,0.9)';
          }
        }

        var diskScale = 1 + mids * 0.3;
        if (celestialDisk) {
          celestialDisk.style.transform = 'rotateX(75deg) scale(' + diskScale + ')';
        }

        var ringGlow = 0.2 + highs * 0.8;
        celestialRings.forEach(function(ring) {
          ring.style.opacity = ringGlow;
        });

        celestialBody.style.transform = 'scale(' + (1 + bass * 0.1) + ')';
      }

      requestAnimationFrame(updateAudioReactivity);
    }

    requestAnimationFrame(updateAudioReactivity);

    // Celestial toggle (blackhole/sun)
    if (celestialToggle && celestialBody) {
      celestialToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        celestialBody.classList.toggle('sun-mode');
        celestialToggle.innerHTML = celestialBody.classList.contains('sun-mode') ? '&#9679;' : '&#9788;';
      });
    }
    var isPlaying = false;

    if (volumeSlider) {
      volumeSlider.addEventListener('input', function() {
        audio.volume = volumeSlider.value / 100;
      });
    }

    function formatTime(sec) {
      if (isNaN(sec)) return '0:00';
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateProgress() {
      if (audio.duration) {
        var pct = (audio.currentTime / audio.duration) * 100;
        if (progressBar) progressBar.style.width = pct + '%';
        if (playerTime) playerTime.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
      }
      if (isPlaying) requestAnimationFrame(updateProgress);
    }

    function playTrack() {
      connectAudioAnalyser();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      audio.play();
      isPlaying = true;
      if (playIcon) playIcon.innerHTML = '&#10074;&#10074;';
      if (waveformVis) {
        waveformVis.classList.add('active');
        if (!audioConnected) waveformVis.classList.add('no-analyser');
        else waveformVis.classList.remove('no-analyser');
      }
      if (celestialBody) celestialBody.classList.add('playing');
      updateProgress();
    }

    function pauseTrack() {
      audio.pause();
      isPlaying = false;
      if (playIcon) playIcon.innerHTML = '&#9654;';
      if (waveformVis) waveformVis.classList.remove('active');
      if (celestialBody) celestialBody.classList.remove('playing');
    }

    function loadAndPlay(node) {
      var src = node.dataset.src;
      if (!src) return;

      audio.src = src;
      audio.load();
      if (nowPlayingTitle) nowPlayingTitle.textContent = node.dataset.title;
      if (nowPlayingArtist) nowPlayingArtist.textContent = node.dataset.artist || 'BASSMENDER';
      if (playerControls) playerControls.classList.add('fixed-bar');
      document.body.classList.add('player-active');
      playTrack();
    }

    audio.addEventListener('ended', function() {
      pauseTrack();
      if (progressBar) progressBar.style.width = '0%';
      if (playerTime) playerTime.textContent = '0:00 / ' + formatTime(audio.duration);
    });

    // Click progress bar to seek
    if (progressWrap) {
      progressWrap.addEventListener('click', function(e) {
        if (!audio.duration) return;
        var rect = progressWrap.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
      });
    }

    // Play/pause button
    if (playBtn) {
      playBtn.addEventListener('click', function() {
        if (!audio.src) return;
        if (isPlaying) { pauseTrack(); } else { playTrack(); }
      });
    }

    function positionNodes() {
      var container = document.getElementById('orbital-player');
      if (!container) return;
      var centerX = container.offsetWidth / 2;
      var centerY = container.offsetHeight / 2;

      nodes.forEach(function(node) {
        var ring = parseInt(node.style.getPropertyValue('--ring')) || 1;
        var radius;
        var ringEl = container.querySelector('.ring-' + ring);
        if (ringEl) { radius = ringEl.offsetWidth / 2; }
        else { radius = ring === 1 ? 175 : 240; }

        var allNodes = Array.from(nodes);
        var ringNodes = allNodes.filter(function(n) {
          return (parseInt(n.style.getPropertyValue('--ring')) || 1) === ring;
        });
        var indexInRing = ringNodes.indexOf(node);
        var angleStep = (Math.PI * 2) / ringNodes.length;
        var angle = angleStep * indexInRing - Math.PI / 2;
        var halfW = node.offsetWidth / 2;
        var halfH = node.offsetHeight / 2;
        node.style.left = (centerX + Math.cos(angle) * radius - halfW) + 'px';
        node.style.top = (centerY + Math.sin(angle) * radius - halfH) + 'px';
        node.style.margin = '0';
      });
    }

    nodes.forEach(function(node) {
      node.addEventListener('click', function() {
        var isMystery = node.classList.contains('mystery');

        if (!isMystery && activeNode === node && isPlaying) {
          pauseTrack();
          return;
        }

        if (activeNode) activeNode.classList.remove('active');
        node.classList.add('active');
        activeNode = node;

        if (isMystery) {
          // Mystery node — no audio
          pauseTrack();
          if (nowPlayingTitle) nowPlayingTitle.textContent = '???';
          if (nowPlayingArtist) nowPlayingArtist.textContent = 'INCOMING SIGNAL';
          if (waveformVis) waveformVis.classList.remove('active');
        } else {
          loadAndPlay(node);
        }

        if (window.BassmenderAchievements) window.BassmenderAchievements.trackClicked(parseInt(node.dataset.track));
      });
    });

    positionNodes();
    window.addEventListener('resize', positionNodes);
  }

  function initGlitchEffects() {
    // Periodic glitch on section titles every 30 seconds
    setInterval(function() {
      var titles = document.querySelectorAll('.section-title[data-text]');
      titles.forEach(function(title) {
        title.classList.add('glitching');
        setTimeout(function() { title.classList.remove('glitching'); }, 800);
      });
    }, 30000);
  }

  window.BassmenderMain = {
    initScrollAnimations: function() {
      initScrollAnimations();
      initOrbitalPlayer();
      initGlitchEffects();
    }
  };

  var mainContent = document.getElementById('main-content');
  if (mainContent && !mainContent.classList.contains('hidden')) {
    initScrollAnimations();
    initOrbitalPlayer();
    initGlitchEffects();
  }
})();
