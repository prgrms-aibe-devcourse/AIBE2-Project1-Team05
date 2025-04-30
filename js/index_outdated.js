// 페이지 로드 시 자동으로 실행
window.onload = function () {
  setTimeout(() => {
    // 1단계: opacity를 0으로 줄이기 (페이드아웃 시작)
    document.body.style.opacity = 0;

    // 2단계: transition이 끝난 후 페이지 이동
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000); // 1초 후 이동 (transition 시간과 맞춰줌)
  }, 2000); // 초기에 2초 기다렸다가 페이드아웃 시작
};
