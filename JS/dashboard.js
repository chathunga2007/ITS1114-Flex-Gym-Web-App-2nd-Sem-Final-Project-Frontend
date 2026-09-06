/* =========================================================
   FLEX GYM - UNIFIED DASHBOARD ROUTER & CONTROLLER
   JS/dashboard.js
========================================================= */

(function () {
  'use strict';

  // State
  const state = {
    currentSection: 'overview',
  };

  /* =========================================================
     ROUTING & VIEW SWITCHING (SPA)
  ========================================================= */
  function switchSection(sectionId, updateHash = true) {
    if (!sectionId) sectionId = 'overview';
    
    // Normalize id
    sectionId = sectionId.replace(/^#/, '').replace(/^view-/, '');

    const targetSection = document.getElementById(`view-${sectionId}`) || document.getElementById(sectionId);
    if (!targetSection) {
      // Fallback to overview if not found
      const defaultSec = document.querySelector('.dash-section');
      if (defaultSec) {
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        defaultSec.classList.add('active');
      }
      return;
    }

    // Hide all sections, show target
    document.querySelectorAll('.dash-section').forEach(sec => {
      sec.classList.remove('active');
    });
    targetSection.classList.add('active');
    state.currentSection = sectionId;

    // Update active nav item
    document.querySelectorAll('.dash-nav-item').forEach(item => {
      const href = item.getAttribute('href') || item.getAttribute('data-section');
      if (!href) return;
      const cleanHref = href.replace(/^#/, '').replace(/^view-/, '');
      if (cleanHref === sectionId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    if (breadcrumbCurrent) {
      const activeNav = document.querySelector(`.dash-nav-item[href="#${sectionId}"], .dash-nav-item[data-section="${sectionId}"]`);
      if (activeNav) {
        const textSpan = activeNav.querySelector('span:not(.nav-icon):not(.nav-badge)');
        breadcrumbCurrent.textContent = textSpan ? textSpan.textContent.trim() : sectionId.toUpperCase();
      } else {
        breadcrumbCurrent.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
      }
    }

    // Update URL hash without jumping
    if (updateHash && window.location.hash !== `#${sectionId}`) {
      window.history.pushState(null, null, `#${sectionId}`);
    }

    // Close mobile menu on switch
    const sidebar = document.querySelector('.dash-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle URL hash changes
  function handleHashChange() {
    const hash = window.location.hash;
    if (hash) {
      switchSection(hash.substring(1), false);
    } else {
      switchSection('overview', false);
    }
  }

  /* =========================================================
     MODAL CONTROLLER
  ========================================================= */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modalOrId) {
    let modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  function setupModals() {
    // Open triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-target]');
      if (trigger) {
        e.preventDefault();
        const targetId = trigger.getAttribute('data-modal-target');
        openModal(targetId);
      }

      // Close triggers
      const closeBtn = e.target.closest('[data-modal-close], .modal-close');
      if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest('.modal-backdrop');
        if (modal) closeModal(modal);
      }

      // Click outside modal-box to close
      if (e.target.classList.contains('modal-backdrop')) {
        closeModal(e.target);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.show').forEach(m => closeModal(m));
      }
    });
  }

  /* =========================================================
     SEARCH & TABLE FILTERS
  ========================================================= */
  function setupSearchAndFilters() {
    document.addEventListener('input', (e) => {
      const searchInput = e.target.closest('[data-table-search]');
      if (searchInput) {
        const tableId = searchInput.getAttribute('data-table-search');
        const query = searchInput.value.toLowerCase().trim();
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      }
    });

    document.addEventListener('change', (e) => {
      const filterSelect = e.target.closest('[data-table-filter]');
      if (filterSelect) {
        const tableId = filterSelect.getAttribute('data-table-filter');
        const colIndex = parseInt(filterSelect.getAttribute('data-col-index') || '2', 10);
        const filterVal = filterSelect.value.toLowerCase().trim();
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
          if (!filterVal || filterVal === 'all') {
            row.style.display = '';
            return;
          }
          const cells = row.querySelectorAll('td');
          if (cells.length > colIndex) {
            const cellText = cells[colIndex].textContent.toLowerCase();
            row.style.display = cellText.includes(filterVal) ? '' : 'none';
          }
        });
      }
    });
  }

  /* =========================================================
     TOAST NOTIFICATIONS
  ========================================================= */
  window.showToast = function (message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  /* =========================================================
     AUTH / LOGOUT / PROFILE SYNC
  ========================================================= */
  function syncUserProfile() {
    const email = localStorage.getItem('flexGymEmail') || sessionStorage.getItem('flexGymEmail') || 'admin@flexgym.com';
    const role = localStorage.getItem('flexGymRole') || sessionStorage.getItem('flexGymRole') || 'Administrator';

    const userEmailEl = document.getElementById('dashUserEmail');
    const userRoleEl = document.getElementById('dashUserRole');
    const userAvatarEl = document.getElementById('dashUserAvatar');

    if (userEmailEl) userEmailEl.textContent = email.split('@')[0];
    if (userRoleEl) userRoleEl.textContent = role.replace('ROLE_', '');
    if (userAvatarEl) {
      const name = email.split('@')[0];
      userAvatarEl.textContent = (name.substring(0, 2) || 'AD').toUpperCase();
    }
  }

  function setupLogout() {
    document.addEventListener('click', (e) => {
      const logoutBtn = e.target.closest('#logoutBtn, .action-logout');
      if (logoutBtn) {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
          localStorage.removeItem('flexGymToken');
          localStorage.removeItem('flexGymUserId');
          localStorage.removeItem('flexGymEmail');
          localStorage.removeItem('flexGymRole');
          sessionStorage.clear();
          window.location.href = 'login.html';
        }
      }
    });
  }

  /* =========================================================
     INITIALIZATION
  ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    // Nav Click Event Delegation
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.dash-nav-item, [data-section-target]');
      if (navItem) {
        const target = navItem.getAttribute('href') || navItem.getAttribute('data-section-target');
        if (target && target.startsWith('#')) {
          e.preventDefault();
          switchSection(target.substring(1));
        }
      }

      // Mobile Menu Toggle
      const mobileToggle = e.target.closest('#mobileMenuToggle, .mobile-menu-toggle');
      if (mobileToggle) {
        e.preventDefault();
        const sidebar = document.querySelector('.dash-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      }
    });

    // Setup helpers
    setupModals();
    setupSearchAndFilters();
    syncUserProfile();
    setupLogout();

    // Initial route
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
  });

  // Export functions globally
  window.FlexDashboard = {
    switchSection,
    openModal,
    closeModal,
  };
})();
