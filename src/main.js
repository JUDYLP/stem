// T00 only: announce that the page module loaded. No practice state or API calls.
const pageStatus = document.querySelector('#page-status');

if (pageStatus) {
  pageStatus.textContent = '首屏已加载 · 功能开发中';
}
