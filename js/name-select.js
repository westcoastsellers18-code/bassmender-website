// ===== NAME SELECT & FILE SELECT =====
(function() {
  var MAX_NAME_LENGTH = 20;
  var playerName = '';

  // === NAME SELECT ===
  var nameScreen = document.getElementById('name-select-screen');
  var nameDisplay = document.getElementById('player-name');
  var charGrid = document.getElementById('char-grid');
  var backspaceBtn = document.getElementById('backspace-btn');
  var endBtn = document.getElementById('end-btn');

  if (!nameScreen) return;

  function updateNameDisplay() {
    if (nameDisplay) nameDisplay.textContent = playerName;
  }

  function addChar(char) {
    if (playerName.length >= MAX_NAME_LENGTH) return;
    playerName += char;
    updateNameDisplay();
  }

  function removeChar() {
    playerName = playerName.slice(0, -1);
    updateNameDisplay();
  }

  // Character grid click
  if (charGrid) {
    charGrid.addEventListener('click', function(e) {
      var btn = e.target.closest('.char-btn');
      if (!btn) return;
      var char = btn.dataset.char;
      if (char) {
        addChar(char);
        btn.classList.add('flash');
        setTimeout(function() { btn.classList.remove('flash'); }, 150);
      }
    });
  }

  if (backspaceBtn) {
    backspaceBtn.addEventListener('click', removeChar);
  }

  if (endBtn) {
    endBtn.addEventListener('click', confirmName);
  }

  // Keyboard input
  document.addEventListener('keydown', function(e) {
    if (nameScreen.classList.contains('hidden')) return;

    if (e.key === 'Enter') {
      confirmName();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      removeChar();
    } else if (e.key.length === 1 && /[a-zA-Z0-9._\- ]/.test(e.key)) {
      addChar(e.key);
      var matchBtn = charGrid.querySelector('[data-char="' + e.key + '"]');
      if (matchBtn) {
        matchBtn.classList.add('flash');
        setTimeout(function() { matchBtn.classList.remove('flash'); }, 150);
      }
    }
  });

  function confirmName() {
    if (playerName.trim().length === 0) {
      playerName = 'TRAVELER';
    }

    var existingName = localStorage.getItem('bassmender_player_name');
    if (existingName && window.BassmenderAchievements) {
      window.BassmenderAchievements.nameChanged();
    }

    nameScreen.classList.add('screen-transition');
    setTimeout(function() {
      nameScreen.classList.add('hidden');
      nameScreen.classList.remove('screen-transition');
      playerName = playerName.trim();

      // Route through save system
      if (window.BassmenderSaves) {
        window.BassmenderSaves.onNameConfirmed(playerName);
      } else {
        localStorage.setItem('bassmender_player_name', playerName);
        enterMainSite('home');
      }

      // Reset for next use
      playerName = '';
      updateNameDisplay();
    }, 600);
  }

  // === ENTER MAIN SITE ===
  function getTimeGreeting() {
    var hour = new Date().getHours();
    if (hour < 5) return 'LATE NIGHT SESSION, ';
    if (hour < 12) return 'GOOD MORNING, ';
    if (hour < 17) return 'GOOD AFTERNOON, ';
    return 'GOOD EVENING, ';
  }

  function enterMainSite(scrollTo) {
    var fileScreen = document.getElementById('file-select-screen');
    if (fileScreen && !fileScreen.classList.contains('hidden')) {
      fileScreen.classList.add('screen-transition');
      setTimeout(function() {
        fileScreen.classList.add('hidden');
        fileScreen.classList.remove('screen-transition');
        revealMainSite(scrollTo);
      }, 600);
    } else {
      revealMainSite(scrollTo);
    }
  }

  function revealMainSite(scrollTo) {
    var mainNav = document.getElementById('main-nav');
    var mainContent = document.getElementById('main-content');
    if (mainNav) mainNav.classList.remove('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

    var savedName = localStorage.getItem('bassmender_player_name') || 'TRAVELER';
    var greeting = document.getElementById('hero-greeting');
    if (greeting) {
      greeting.textContent = getTimeGreeting() + savedName.toUpperCase();
    }

    var navName = document.getElementById('nav-player-name');
    if (navName) navName.textContent = savedName.toUpperCase();

    if (scrollTo) {
      setTimeout(function() {
        var target = document.getElementById(scrollTo);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    setTimeout(function() {
      if (window.BassmenderMain && window.BassmenderMain.initScrollAnimations) {
        window.BassmenderMain.initScrollAnimations();
      }
      if (window.BassmenderAchievements) {
        window.BassmenderAchievements.init();
      }
    }, 200);
  }

  window.BassmenderNameSelect = {
    enterMainSite: enterMainSite
  };
})();
