/* ==========================================================================
   CLUBSYNC SHELL — Shared Interactive Components
   Sidebar, Command Palette, Toasts, Modals, Counters, Confetti, Theme
   ========================================================================== */

const ClubSyncShell = (() => {
  'use strict';

  // ── STATE ──
  let sidebarCollapsed = false;
  let cmdPaletteOpen = false;
  let activeDropdown = null;
  let notifPanelOpen = false;
  let activityFeedOpen = false;
  let toastQueue = [];
  let cmdHighlightIndex = 0;

  // ==========================================================================
  // 1. SIDEBAR
  // ==========================================================================
  function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.sidebar-toggle');
    if (!sidebar || !toggle) return;

    // Restore from localStorage
    const saved = localStorage.getItem('cs-sidebar-collapsed');
    if (saved === 'true') {
      sidebar.classList.add('collapsed');
      sidebarCollapsed = true;
    }

    toggle.addEventListener('click', () => {
      sidebarCollapsed = !sidebarCollapsed;
      sidebar.classList.toggle('collapsed', sidebarCollapsed);
      localStorage.setItem('cs-sidebar-collapsed', sidebarCollapsed);

      // Update toggle icon
      const icon = toggle.querySelector('i');
      if (icon) {
        icon.className = sidebarCollapsed ? 'ti ti-chevron-right' : 'ti ti-chevron-left';
      }
    });

    // Mobile sidebar
    const mobileToggle = document.querySelector('.sidebar-mobile-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Nav item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', function(e) {
        if (this.dataset.section) {
          e.preventDefault();
          switchSection(this.dataset.section);
          // Update active
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          this.classList.add('active');
        }
      });
    });
  }

  function switchSection(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(s => {
      s.classList.remove('active-section');
      s.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active-section');
      // Re-trigger animations
      target.querySelectorAll('.slide-up, .fade-in').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; // trigger reflow
        el.style.animation = '';
      });
    }
  }

  // ==========================================================================
  // 2. COMMAND PALETTE (Ctrl+K / ⌘K)
  // ==========================================================================
  function initCommandPalette() {
    const overlay = document.querySelector('.cmd-palette-overlay');
    if (!overlay) return;
    const input = overlay.querySelector('.cmd-palette-input');
    const results = overlay.querySelector('.cmd-palette-results');

    // Open with Ctrl+K / ⌘K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === 'Escape' && cmdPaletteOpen) {
        closeCommandPalette();
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCommandPalette();
    });

    // Search filtering
    if (input) {
      input.addEventListener('input', (e) => {
        filterCmdItems(e.target.value.toLowerCase());
      });

      // Keyboard navigation
      input.addEventListener('keydown', (e) => {
        const items = results.querySelectorAll('.cmd-palette-item:not([style*="display: none"])');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cmdHighlightIndex = Math.min(cmdHighlightIndex + 1, items.length - 1);
          updateCmdHighlight(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          cmdHighlightIndex = Math.max(cmdHighlightIndex - 1, 0);
          updateCmdHighlight(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items[cmdHighlightIndex]) items[cmdHighlightIndex].click();
        }
      });
    }
  }

  function toggleCommandPalette() {
    cmdPaletteOpen ? closeCommandPalette() : openCommandPalette();
  }

  function openCommandPalette() {
    const overlay = document.querySelector('.cmd-palette-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    cmdPaletteOpen = true;
    cmdHighlightIndex = 0;
    const input = overlay.querySelector('.cmd-palette-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
    filterCmdItems('');
  }

  function closeCommandPalette() {
    const overlay = document.querySelector('.cmd-palette-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    cmdPaletteOpen = false;
  }

  function filterCmdItems(query) {
    const items = document.querySelectorAll('.cmd-palette-item');
    const sections = document.querySelectorAll('.cmd-palette-section');
    let visibleBySection = {};

    items.forEach(item => {
      const text = (item.textContent || '').toLowerCase();
      const match = !query || text.includes(query);
      item.style.display = match ? '' : 'none';
      const section = item.dataset.section || 'default';
      if (!visibleBySection[section]) visibleBySection[section] = 0;
      if (match) visibleBySection[section]++;
    });

    sections.forEach(s => {
      const section = s.dataset.section || s.textContent.trim().toLowerCase();
      s.style.display = visibleBySection[section] > 0 || !query ? '' : 'none';
    });

    cmdHighlightIndex = 0;
    updateCmdHighlight(document.querySelectorAll('.cmd-palette-item:not([style*="display: none"])'));
  }

  function updateCmdHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === cmdHighlightIndex);
    });
    if (items[cmdHighlightIndex]) {
      items[cmdHighlightIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  // ==========================================================================
  // 3. TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(title, message, type = 'info', duration = 4000) {
    const container = getOrCreateToastContainer();

    const icons = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
  }

  function getOrCreateToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // ==========================================================================
  // 4. MODAL SYSTEM
  // ==========================================================================
  function initModals() {
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) overlay.classList.remove('active');
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal && !cmdPaletteOpen) {
          activeModal.classList.remove('active');
        }
      }
    });
  }

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('active');
  }

  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
  }

  // ==========================================================================
  // 5. ANIMATED NUMBER COUNTERS
  // ==========================================================================
  function animateCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
      const target = parseInt(el.dataset.counter, 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const duration = parseInt(el.dataset.duration, 10) || 1500;
      animateCounter(el, target, duration, prefix, suffix);
    });
  }

  function animateCounter(element, target, duration = 1500, prefix = '', suffix = '') {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);

      element.textContent = prefix + current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // ==========================================================================
  // 6. SKELETON LOADERS
  // ==========================================================================
  function showSkeletons() {
    document.querySelectorAll('.skeleton-wrapper').forEach(w => {
      w.style.display = 'block';
    });
    document.querySelectorAll('.content-loaded').forEach(c => {
      c.style.display = 'none';
    });
  }

  function hideSkeletons() {
    document.querySelectorAll('.skeleton-wrapper').forEach(w => {
      w.style.display = 'none';
    });
    document.querySelectorAll('.content-loaded').forEach(c => {
      c.style.display = '';
    });
  }

  function simulateLoading(delay = 800) {
    showSkeletons();
    setTimeout(() => {
      hideSkeletons();
      animateCounters();
    }, delay);
  }

  // ==========================================================================
  // 7. CONFETTI
  // ==========================================================================
  function fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        ticks: 200,
        gravity: 0.8,
        scalar: 1.1,
        drift: 0,
      });
    }
  }

  // Mini confetti from a button
  function fireConfettiFrom(element) {
    if (typeof confetti !== 'function') return;
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 60,
      spread: 55,
      origin: { x, y },
      colors: ['#7C3AED', '#3B82F6', '#22C55E'],
      ticks: 150,
    });
  }

  // ==========================================================================
  // 8. THEME TOGGLE (Dark / Light)
  // ==========================================================================
  function initTheme() {
    const saved = localStorage.getItem('cs-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cs-theme', next);
    updateThemeIcon(next);
    showToast('Theme Changed', `Switched to ${next} mode`, 'info', 2000);
  }

  function updateThemeIcon(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
      }
    }
  }

  // ==========================================================================
  // 9. DROPDOWN MANAGEMENT
  // ==========================================================================
  function initDropdowns() {
    // Toggle dropdowns
    document.querySelectorAll('[data-dropdown]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = trigger.dataset.dropdown;
        const menu = document.getElementById(targetId);
        if (!menu) return;

        const isActive = menu.classList.contains('active');

        // Close all dropdowns first
        closeAllDropdowns();

        if (!isActive) {
          menu.classList.add('active');
          activeDropdown = menu;
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', () => {
      closeAllDropdowns();
    });

    // Prevent dropdown content from closing dropdown
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.active').forEach(m => m.classList.remove('active'));
    activeDropdown = null;
  }

  // ==========================================================================
  // 10. NOTIFICATIONS PANEL
  // ==========================================================================
  function initNotifications() {
    const btn = document.querySelector('.notif-toggle');
    const panel = document.querySelector('.notif-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanelOpen = !notifPanelOpen;
      panel.classList.toggle('active', notifPanelOpen);
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('active');
        notifPanelOpen = false;
      }
    });

    // Mark all as read
    const markAll = panel.querySelector('.mark-all-read');
    if (markAll) {
      markAll.addEventListener('click', () => {
        panel.querySelectorAll('.notif-unread').forEach(n => n.classList.remove('notif-unread'));
        const dot = btn.querySelector('.notif-dot');
        if (dot) dot.style.display = 'none';
        showToast('Notifications', 'All marked as read', 'success', 2000);
      });
    }
  }

  // ==========================================================================
  // 11. SPARKLINE MINI CHARTS
  // ==========================================================================
  function drawSparkline(canvas, data, color = '#7C3AED') {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    ctx.clearRect(0, 0, w, h);

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * (h - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // ==========================================================================
  // 12. PROGRESS RINGS
  // ==========================================================================
  function setProgressRing(svgElement, percentage) {
    const circle = svgElement.querySelector('.progress-ring-fill');
    if (!circle) return;
    const radius = circle.getAttribute('r');
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (percentage / 100) * circumference;
  }

  // ==========================================================================
  // 13. TAB SWITCHING
  // ==========================================================================
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const group = this.closest('.tab-group');
        if (!group) return;

        // Deactivate all tabs in group
        group.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Show target panel
        const targetId = this.dataset.tab;
        const container = group.closest('.tab-container') || group.parentElement;
        container.querySelectorAll('.tab-panel').forEach(p => {
          p.style.display = p.id === targetId ? 'block' : 'none';
        });
      });
    });
  }

  // ==========================================================================
  // 14. QUICK ACTIONS
  // ==========================================================================
  function initQuickActions() {
    const btn = document.querySelector('.quick-action-btn');
    const menu = document.querySelector('.quick-action-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) menu.classList.remove('active');
    });
  }

  // ==========================================================================
  // 15. DATE / TIME HELPERS
  // ==========================================================================
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function getCountdown(targetDate) {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return 'Event started';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }

  // ==========================================================================
  // 16. WIZARD STEPS
  // ==========================================================================
  let currentWizardStep = 1;

  function initWizard(totalSteps) {
    currentWizardStep = 1;
    updateWizardUI(totalSteps);
  }

  function nextWizardStep(totalSteps) {
    if (currentWizardStep < totalSteps) {
      currentWizardStep++;
      updateWizardUI(totalSteps);
    }
  }

  function prevWizardStep(totalSteps) {
    if (currentWizardStep > 1) {
      currentWizardStep--;
      updateWizardUI(totalSteps);
    }
  }

  function updateWizardUI(totalSteps) {
    // Update step indicators
    for (let i = 1; i <= totalSteps; i++) {
      const step = document.querySelector(`.wizard-step[data-step="${i}"]`);
      if (!step) continue;
      step.classList.remove('active', 'completed');
      if (i === currentWizardStep) step.classList.add('active');
      else if (i < currentWizardStep) step.classList.add('completed');
    }

    // Update panels
    for (let i = 1; i <= totalSteps; i++) {
      const panel = document.getElementById(`wizard-panel-${i}`);
      if (panel) panel.style.display = i === currentWizardStep ? 'block' : 'none';
    }

    // Update buttons
    const prevBtn = document.querySelector('.wizard-prev');
    const nextBtn = document.querySelector('.wizard-next');
    const submitBtn = document.querySelector('.wizard-submit');

    if (prevBtn) prevBtn.style.display = currentWizardStep > 1 ? '' : 'none';
    if (nextBtn) nextBtn.style.display = currentWizardStep < totalSteps ? '' : 'none';
    if (submitBtn) submitBtn.style.display = currentWizardStep === totalSteps ? '' : 'none';
  }

  // ==========================================================================
  // 17. FILTER CHIPS
  // ==========================================================================
  function initFilterChips() {
    document.querySelectorAll('.filter-bar').forEach(bar => {
      bar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
          if (bar.dataset.multiSelect === 'true') {
            this.classList.toggle('active');
          } else {
            bar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
          }
          // Trigger custom event
          bar.dispatchEvent(new CustomEvent('filter-change', {
            detail: {
              active: Array.from(bar.querySelectorAll('.filter-chip.active')).map(c => c.dataset.value || c.textContent.trim())
            }
          }));
        });
      });
    });
  }

  // ==========================================================================
  // 18. CHECKBOX & BATCH ACTIONS
  // ==========================================================================
  function initCheckboxes() {
    document.querySelectorAll('.checkbox').forEach(cb => {
      cb.addEventListener('click', function() {
        this.classList.toggle('checked');
        updateBatchActions();
      });
    });

    // Select all
    document.querySelectorAll('.select-all-checkbox').forEach(cb => {
      cb.addEventListener('click', function() {
        const isChecked = this.classList.toggle('checked');
        const group = this.dataset.group;
        document.querySelectorAll(`.checkbox[data-group="${group}"]`).forEach(c => {
          c.classList.toggle('checked', isChecked);
        });
        updateBatchActions();
      });
    });
  }

  function updateBatchActions() {
    const checked = document.querySelectorAll('.checkbox.checked:not(.select-all-checkbox)');
    const batchBar = document.querySelector('.batch-actions');
    if (batchBar) {
      batchBar.style.display = checked.length > 0 ? 'flex' : 'none';
      const count = batchBar.querySelector('.batch-count');
      if (count) count.textContent = checked.length;
    }
  }

  // ==========================================================================
  // 19. ACTIVITY FEED TOGGLE
  // ==========================================================================
  function initActivityFeed() {
    const toggle = document.querySelector('.activity-feed-toggle');
    const feed = document.querySelector('.activity-feed-sidebar');
    if (!toggle || !feed) return;

    toggle.addEventListener('click', () => {
      activityFeedOpen = !activityFeedOpen;
      feed.classList.toggle('active', activityFeedOpen);
    });
  }

  // ==========================================================================
  // 20. GLOBAL KEYBOARD SHORTCUTS
  // ==========================================================================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      // Custom shortcuts per page can be added here
      const shortcuts = {
        'g+d': () => switchSection('section-overview'),
        'g+e': () => switchSection('section-events'),
        'g+t': () => switchSection('section-team'),
        'g+r': () => switchSection('section-reports'),
        'g+s': () => switchSection('section-settings'),
      };
    });
  }

  // ==========================================================================
  // INIT — Call on DOMContentLoaded
  // ==========================================================================
  function init() {
    initTheme();
    initSidebar();
    initCommandPalette();
    initModals();
    initDropdowns();
    initNotifications();
    initQuickActions();
    initTabs();
    initFilterChips();
    initCheckboxes();
    initActivityFeed();
    initKeyboardShortcuts();

    // Simulate initial loading
    simulateLoading(800);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── PUBLIC API ──
  return {
    init,
    showToast,
    openModal,
    closeModal,
    fireConfetti,
    fireConfettiFrom,
    toggleTheme,
    switchSection,
    animateCounter,
    animateCounters,
    drawSparkline,
    setProgressRing,
    simulateLoading,
    showSkeletons,
    hideSkeletons,
    getGreeting,
    formatRelativeTime,
    getCountdown,
    initWizard,
    nextWizardStep,
    prevWizardStep,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
  };
})();
