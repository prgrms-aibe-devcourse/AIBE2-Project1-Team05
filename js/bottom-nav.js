let isNavVisible = false;

function loadBottomNav() {
  fetch("/components/bottom-nav.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("bottom-nav-container").innerHTML = data;
      initBottomNav();
    })
    .catch((error) => console.error("하단 네비게이션 바 로드 실패:", error));
}

function initBottomNav() {
  const bottomNav = document.querySelector('.bottom-nav');
  const indicator = document.querySelector('.swipe-indicator');
  let startY = 0;
  let currentY = 0;
  let isHidden = false;

  // 스크롤 위치 체크 (맨 하단 도달 시 bottom-nav 보이기)
  function checkScrollPosition() {
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 2;
    if (isAtBottom && isHidden) {
      bottomNav.classList.remove('hidden');
      isHidden = false;
    }
  }

  // 전체 문서에 터치 이벤트 추가
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    currentY = startY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    const absDiff = Math.abs(diff);

    // 스와이프가 30px 이상일 때만 동작
    if (absDiff > 30) {
      if (diff < 0 && isHidden) { // 위로 스와이프
        bottomNav.classList.remove('hidden');
        isHidden = false;
      } else if (diff > 0 && !isHidden) { // 아래로 스와이프
        bottomNav.classList.add('hidden');
        isHidden = true;
      }
    }
  }, { passive: true });

  // 스와이프 힌트 영역 클릭 이벤트
  if (indicator) {
    indicator.addEventListener('click', () => {
      if (isHidden) {
        bottomNav.classList.remove('hidden');
        isHidden = false;
      }
    });
  }

  // 스크롤 이벤트
  window.addEventListener('scroll', checkScrollPosition, { passive: true });

  // 초기 상태 설정
  checkScrollPosition();
}
