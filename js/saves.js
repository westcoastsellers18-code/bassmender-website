// ===== SAVE FILE SYSTEM =====
(function() {
  var SAVES_KEY = 'bassmender_saves';
  var ACTIVE_KEY = 'bassmender_active_slot';
  var TOTAL_ACHIEVEMENTS = 5;
  var SLOT_ICONS = ['\u2460', '\u2461', '\u2462']; // ①②③

  function loadSaves() {
    try {
      var raw = localStorage.getItem(SAVES_KEY);
      return raw ? JSON.parse(raw) : { '1': null, '2': null, '3': null };
    } catch (e) { return { '1': null, '2': null, '3': null }; }
  }

  function saveSaves(saves) {
    try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves)); } catch (e) {}
  }

  function getActiveSlot() {
    return localStorage.getItem(ACTIVE_KEY) || null;
  }

  function setActiveSlot(slotId) {
    localStorage.setItem(ACTIVE_KEY, slotId);
  }

  function getSlotData(slotId) {
    var saves = loadSaves();
    return saves[slotId] || null;
  }

  function saveSlotData(slotId, data) {
    var saves = loadSaves();
    saves[slotId] = data;
    saveSaves(saves);
  }

  // Migrate old single-profile data into slot 1
  function migrateOldData() {
    var saves = loadSaves();
    if (saves['1'] || saves['2'] || saves['3']) return; // already migrated

    var oldName = localStorage.getItem('bassmender_player_name');
    if (!oldName) return;

    var oldAchievements = null;
    try {
      var raw = localStorage.getItem('bassmender_achievements');
      if (raw) oldAchievements = JSON.parse(raw);
    } catch (e) {}

    var oldVisits = parseInt(localStorage.getItem('bassmender_visit_count')) || 0;

    saves['1'] = {
      name: oldName,
      achievements: oldAchievements || {},
      visits: oldVisits
    };
    saveSaves(saves);
    setActiveSlot('1');
  }

  function countUnlocked(achievements) {
    if (!achievements) return 0;
    var count = 0;
    Object.keys(achievements).forEach(function(key) {
      if (achievements[key] && achievements[key].unlocked) count++;
    });
    return count;
  }

  function renderHearts(unlocked) {
    var html = '';
    for (var i = 0; i < TOTAL_ACHIEVEMENTS; i++) {
      if (i < unlocked) {
        html += '<span class="heart full">&hearts;</span>';
      } else {
        html += '<span class="heart">&hearts;</span>';
      }
    }
    return html;
  }

  function renderSlots() {
    var container = document.getElementById('save-slots');
    if (!container) return;

    var saves = loadSaves();
    var html = '';

    for (var i = 1; i <= 3; i++) {
      var slot = saves[i.toString()];
      var isEmpty = !slot;
      var slotClass = 'save-slot' + (isEmpty ? ' empty-slot' : '') + (i === 1 ? ' active-slot' : '');

      if (isEmpty) {
        html += '<div class="' + slotClass + '" data-slot="' + i + '">' +
          '<div class="slot-number">' + SLOT_ICONS[i - 1] + '</div>' +
          '<div class="slot-content">' +
            '<div class="slot-name empty-slot-name">- NEW FILE -</div>' +
            '<div class="slot-meta"><span class="slot-tag">EMPTY</span></div>' +
          '</div>' +
          '<div class="slot-hearts">' + renderHearts(0) + '</div>' +
        '</div>';
      } else {
        var unlocked = countUnlocked(slot.achievements);
        html += '<div class="' + slotClass + '" data-slot="' + i + '">' +
          '<div class="slot-number">' + SLOT_ICONS[i - 1] + '</div>' +
          '<div class="slot-content">' +
            '<div class="slot-name">' + slot.name.toUpperCase() + '</div>' +
            '<div class="slot-meta"><span class="slot-tag">' + unlocked + '/' + TOTAL_ACHIEVEMENTS + ' ACHIEVEMENTS</span></div>' +
          '</div>' +
          '<div class="slot-hearts">' + renderHearts(unlocked) + '</div>' +
        '</div>';
      }
    }

    container.innerHTML = html;

    // Bind click handlers
    var slots = container.querySelectorAll('.save-slot');
    slots.forEach(function(slotEl) {
      var slotId = slotEl.dataset.slot;

      slotEl.addEventListener('click', function() {
        var data = getSlotData(slotId);
        setActiveSlot(slotId);

        if (data) {
          // Existing save — load profile and enter site
          activateProfile(slotId, data);
        } else {
          // New file — go to name select, then come back
          pendingSlot = slotId;
          var fileScreen = document.getElementById('file-select-screen');
          if (fileScreen) fileScreen.classList.add('hidden');
          var nameScreen = document.getElementById('name-select-screen');
          if (nameScreen) nameScreen.classList.remove('hidden');
        }
      });

      // Hover states
      slotEl.addEventListener('mouseenter', function() {
        slots.forEach(function(s) { s.classList.remove('active-slot'); });
        slotEl.classList.add('active-slot');
      });
    });
  }

  var pendingSlot = null;

  function activateProfile(slotId, data) {
    // Set legacy keys so the rest of the site reads them
    localStorage.setItem('bassmender_player_name', data.name);
    localStorage.setItem('bassmender_achievements', JSON.stringify(data.achievements || {}));
    localStorage.setItem('bassmender_visit_count', data.visits || 0);

    if (window.BassmenderNameSelect) {
      window.BassmenderNameSelect.enterMainSite('home');
    }
  }

  function onNameConfirmed(name) {
    var slotId = pendingSlot || getActiveSlot() || '1';
    var data = {
      name: name,
      achievements: {},
      visits: 0
    };
    saveSlotData(slotId, data);
    setActiveSlot(slotId);
    activateProfile(slotId, data);
    pendingSlot = null;
  }

  // Sync achievements back to the active slot
  function syncAchievements() {
    var slotId = getActiveSlot();
    if (!slotId) return;
    var data = getSlotData(slotId);
    if (!data) return;

    try {
      var raw = localStorage.getItem('bassmender_achievements');
      if (raw) data.achievements = JSON.parse(raw);
    } catch (e) {}

    var visits = parseInt(localStorage.getItem('bassmender_visit_count')) || 0;
    data.visits = visits;

    var name = localStorage.getItem('bassmender_player_name');
    if (name) data.name = name;

    saveSlotData(slotId, data);
  }

  // Migrate on load
  migrateOldData();

  window.BassmenderSaves = {
    renderSlots: renderSlots,
    onNameConfirmed: onNameConfirmed,
    syncAchievements: syncAchievements,
    getActiveSlot: getActiveSlot,
    getPendingSlot: function() { return pendingSlot; }
  };
})();
