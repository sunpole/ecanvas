// scripts/modal-changelog.js

function isModalVisible() {
  const modal = document.querySelector('.modal-changelog');
  return modal && modal.getAttribute('aria-hidden') === 'false';
}

async function showChangelogModal() {
  const container = document.getElementById('modal-changelog-root');
  let modal = container.querySelector('.modal-changelog');

  if (modal && modal.getAttribute('aria-hidden') === 'false') {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    console.log('[MODAL] Закрытие по повторному нажатию DEV');
    return;
  }
  if (!container.innerHTML) {
    console.log('[MODAL] Загружаем changelog-modal.html ...');
    const html = await fetch('changelog-modal.html?v=' + Date.now()).then(r=>r.text());
    container.innerHTML = html;
    if (window.initChangelogModal) window.initChangelogModal();
    else setTimeout(() => window.initChangelogModal && window.initChangelogModal(), 50);
  }
  setTimeout(() => {
    const modal = container.querySelector('.modal-changelog');
    if (modal) {
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modal.focus();
      console.log('[MODAL] Открытие модалки');
    }
  }, 20);
}

document.getElementById('footerDevBtn').addEventListener('click', showChangelogModal);
document.getElementById('footerDevBtn').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    showChangelogModal();
  }
});
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isModalVisible()) {
    const modal = document.querySelector('.modal-changelog');
    if (modal) {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      console.log('[MODAL] Закрытие по Escape (основной уровень)');
    }
  }
});
window.initChangelogModal = function() {
  const modal = document.getElementById('modalChangelog');
  if (!modal || modal.getAttribute('data-inited')) return;
  modal.setAttribute('data-inited', '1');
  console.log('[MODAL] Инициализация слушателей');

  const closeBtn = document.getElementById('closeChangelog');
  function closeModalBy(reason) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    console.log(`[MODAL] Закрытие по: ${reason}`);
  }
  closeBtn.onclick = () => closeModalBy('кнопка СПАСИБО ЗА ВНИМАНИЕ');
  modal.addEventListener('mousedown', function(e){
    if (e.target === modal) closeModalBy('клик по фону');
  });
  modal.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeModalBy('Escape (внутри модалки)');
  });
  modal.querySelectorAll('.changelog-nav-link').forEach(link => {
    link.addEventListener('click', function(e){
      e.preventDefault();
      const tgt = document.querySelector(this.hash);
      if (tgt) tgt.scrollIntoView({behavior:'smooth', block:'start'});
      console.log('[MODAL] Переход по якорю: ' + this.hash);
    });
  });
  setTimeout(() => modal.focus(), 20);
};
