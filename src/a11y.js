let scheduled = false;
const observer = new MutationObserver(() => queueMicrotask(enhanceAccessibility));

function ensureSkipLink() {
  if (!document.querySelector('.v6-skip-link')) {
    document.body.insertAdjacentHTML('afterbegin', '<a class="v6-skip-link" href="#mainContent">Bỏ qua tới nội dung chính</a>');
  }
  const main = document.querySelector('.main');
  if (main) {
    main.id = 'mainContent';
    main.tabIndex = -1;
  }
}

function enhanceNavigation() {
  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.setAttribute('aria-current', button.classList.contains('active') ? 'page' : 'false');
  });
}

function enhanceDialog(anchorSelector, closeSelector, titleId) {
  const anchor = document.querySelector(anchorSelector);
  if (!anchor) return;
  const card = anchor.closest('.card');
  if (!card || card.dataset.a11yDialog === '1') return;
  card.dataset.a11yDialog = '1';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.tabIndex = -1;
  const heading = card.querySelector('h2');
  if (heading) {
    heading.id = heading.id || titleId;
    card.setAttribute('aria-labelledby', heading.id);
  }
  const form = anchor.matches('form') ? anchor : anchor.closest('form');
  const focusTarget = form?.querySelector('input:not([type="hidden"]),select,textarea,button:not([disabled])')
    || card.querySelector('button:not([disabled]),input:not([type="hidden"]),select,textarea');
  const moveFocusInside = () => focusTarget?.focus({ preventScroll: true });
  moveFocusInside();
  setTimeout(moveFocusInside, 0);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    document.querySelector(closeSelector)?.click();
  });
}

function enhanceDialogs() {
  enhanceDialog('#childForm', '#closeDialog', 'growup-child-dialog-title');
  enhanceDialog('#importBackup', '#closeBackup', 'growup-backup-dialog-title');
}

export function enhanceAccessibility() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    ensureSkipLink();
    enhanceNavigation();
    enhanceDialogs();
  });
}

observer.observe(document.body, { childList: true, subtree: true });
enhanceAccessibility();
