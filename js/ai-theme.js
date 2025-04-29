// 테마 선택 (단일 선택)
function selectTheme(button) {
    document.querySelectorAll('.theme-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    button.classList.add('selected');
  }
  
  // 선택 완료 → selectedTheme 저장
  function finishTheme() {
    const selected = document.querySelector('.theme-button.selected');
    if (!selected) {
      alert("여행 테마를 선택해주세요!");
      return;
    }
  
    const theme = selected.innerText.trim();
    localStorage.setItem('selectedTheme', theme);
    location.href = 'ai-style.html'; // 다음 페이지 이동
  }
  