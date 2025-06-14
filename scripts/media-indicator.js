// scripts/media-indicator.js
function updateMediaIndicator() {
  const wid = window.innerWidth;
  const hei = window.innerHeight;
  let txt = '';
  if(wid <= 650) {
    txt = (wid < hei) ? 'Мобильник: книжный' : 'Мобильник: альбомный';
  } else if(wid <= 1024 && hei <= 900) {
    txt = 'Планшет/ноут: альбомный';
  } else if(wid <= 1024) {
    txt = 'Планшет/ноут: книжный';
  } else {
    txt = (wid > hei) ? 'ПК: альбомный' : 'ПК: книжный';
  }
  document.getElementById('media-indicator').textContent = txt;
}
// Первый вызов при загрузке
updateMediaIndicator();
// При каждом ресайзе/перевороте
window.addEventListener('resize', updateMediaIndicator);
window.addEventListener('orientationchange', updateMediaIndicator);
