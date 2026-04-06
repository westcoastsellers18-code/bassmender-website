// ===== ACHIEVEMENT SYSTEM =====
(function() {
  var STORAGE_KEY = 'bassmender_achievements';
  var VISIT_KEY = 'bassmender_visit_count';

  var ACHIEVEMENTS = {
    first_signal:     { id: 'first_signal',     name: 'FIRST SIGNAL',     icon: '\u25C9', desc: 'First visit to the void' },
    frequency_hunter: { id: 'frequency_hunter', name: 'FREQ HUNTER',      icon: '\u2669', desc: 'Tuned all 5 frequencies' },
    void_walker:      { id: 'void_walker',      name: 'VOID WALKER',      icon: '\u2604', desc: 'Reached the end of space' },
    night_owl:        { id: 'night_owl',         name: 'NIGHT OWL',        icon: '\u263D', desc: 'Late night session (12-5am)' },
    name_changer:     { id: 'name_changer',      name: 'NAME CHANGER',     icon: '\u270E', desc: 'Changed your identity' }
  };

  var toastQueue = [];
  var toastShowing = false;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function isUnlocked(id) {
    var state = loadState();
    return state[id] && state[id].unlocked;
  }

  function unlock(id) {
    if (isUnlocked(id)) return;
    var state = loadState();
    state[id] = { unlocked: true, date: new Date().toISOString() };
    saveState(state);
    queueToast(ACHIEVEMENTS[id]);
    renderBadgeTray();
    // Sync back to save slot
    if (window.BassmenderSaves) window.BassmenderSaves.syncAchievements();
  }

  // === TOAST NOTIFICATIONS ===
  function queueToast(achievement) {
    toastQueue.push(achievement);
    if (!toastShowing) showNextToast();
  }

  function showNextToast() {
    if (toastQueue.length === 0) { toastShowing = false; return; }
    toastShowing = true;
    var achievement = toastQueue.shift();
    var toast = document.getElementById('achievement-toast');
    if (!toast) { toastShowing = false; return; }

    toast.innerHTML =
      '<div class="toast-label">ACHIEVEMENT UNLOCKED</div>' +
      '<div class="toast-name">' +
      '<span class="toast-icon">' + achievement.icon + '</span> ' +
      achievement.name +
      '</div>';
    toast.classList.remove('hidden', 'hiding');

    setTimeout(function() {
      toast.classList.add('hiding');
      setTimeout(function() {
        toast.classList.add('hidden');
        toast.classList.remove('hiding');
        showNextToast();
      }, 400);
    }, 3000);
  }

  // === BADGE TRAY ===
  function renderBadgeTray() {
    var list = document.getElementById('badge-list');
    var countEl = document.getElementById('badge-count');
    if (!list) return;

    var state = loadState();
    var unlockedCount = 0;
    var html = '';

    Object.keys(ACHIEVEMENTS).forEach(function(key) {
      var a = ACHIEVEMENTS[key];
      var unlocked = state[key] && state[key].unlocked;
      if (unlocked) unlockedCount++;
      html += '<div class="badge-item' + (unlocked ? '' : ' locked') + '">' +
        '<div class="badge-icon">' + a.icon + '</div>' +
        '<div><div class="badge-name">' + a.name + '</div>' +
        '<div class="badge-desc">' + (unlocked ? a.desc : '???') + '</div></div>' +
        '</div>';
    });

    list.innerHTML = html;
    if (countEl) countEl.textContent = unlockedCount;
  }

  function initBadgeTray() {
    var toggle = document.getElementById('badge-tray-toggle');
    var panel = document.getElementById('badge-tray-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', function() {
        panel.classList.toggle('hidden');
      });
    }
  }

  // === ACHIEVEMENT CHECKS ===
  function checkFirstSignal() {
    var visits = parseInt(localStorage.getItem(VISIT_KEY)) || 0;
    visits++;
    localStorage.setItem(VISIT_KEY, visits);
    if (visits === 1) unlock('first_signal');
  }

  function checkNightOwl() {
    var hour = new Date().getHours();
    if (hour < 5) unlock('night_owl');
  }

  function checkFrequencyHunter(trackIndex) {
    var state = loadState();
    if (!state.frequency_hunter) state.frequency_hunter = { unlocked: false, tracks: [] };
    if (state.frequency_hunter.unlocked) return;

    var tracks = state.frequency_hunter.tracks || [];
    if (tracks.indexOf(trackIndex) === -1) tracks.push(trackIndex);
    state.frequency_hunter.tracks = tracks;
    saveState(state);

    if (tracks.length >= 5) unlock('frequency_hunter');
  }

  function checkVoidWalker() {
    unlock('void_walker');
  }

  function checkNameChanger() {
    unlock('name_changer');
  }

  // === PUBLIC API ===
  window.BassmenderAchievements = {
    init: function() {
      checkFirstSignal();
      checkNightOwl();
      initBadgeTray();
      renderBadgeTray();
    },
    trackClicked: function(trackIndex) { checkFrequencyHunter(trackIndex); },
    reachedFooter: function() { checkVoidWalker(); },
    nameChanged: function() { checkNameChanger(); }
  };
})();
