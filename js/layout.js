// 공통 레이아웃 적용 함수
function applyCommonLayout() {
  // 하단 네비게이션 바 컨테이너 추가
  const bottomNavContainer = document.createElement("div");
  bottomNavContainer.id = "bottom-nav-container";
  document.body.appendChild(bottomNavContainer);

  // bottom-nav.js 스크립트 추가
  const bottomNavScript = document.createElement("script");
  bottomNavScript.src = "/js/bottom-nav.js";
  document.body.appendChild(bottomNavScript);

  // bottom-nav.css 스타일 추가
  if (!document.querySelector('link[href="/css/bottom-nav.css"]')) {
    const bottomNavStyle = document.createElement("link");
    bottomNavStyle.rel = "stylesheet";
    bottomNavStyle.href = "/css/bottom-nav.css";
    document.head.appendChild(bottomNavStyle);
  }

  // 하단 네비게이션 바 로드
  bottomNavScript.onload = () => {
    loadBottomNav();
    // bottom-nav가 항상 보이도록 하단 여백만 조정
    setTimeout(adjustBottomNavSpace, 0);
  };

  // 스크롤이 생기는 경우에만 하단 여백 추가
  function adjustBottomNavSpace() {
    const container = document.querySelector('.container');
    const footer = document.querySelector('footer');
    const isScrollable = document.body.scrollHeight > window.innerHeight;
    if (container) {
      container.style.paddingBottom = isScrollable ? '48px' : '';
    }
    if (footer) {
      footer.style.marginBottom = isScrollable ? '48px' : '';
    }
  }
  window.addEventListener('DOMContentLoaded', adjustBottomNavSpace);
  window.addEventListener('resize', adjustBottomNavSpace);
  const observer = new MutationObserver(adjustBottomNavSpace);
  observer.observe(document.body, { childList: true, subtree: true });
}
