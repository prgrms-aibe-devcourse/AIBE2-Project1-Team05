// 테마 선택 (다중 선택)
function selectTheme(button) {
  button.classList.toggle('selected');
}

// 선택 완료 → selectedThemes 저장
function finishTheme() {
  const selectedButtons = document.querySelectorAll('.theme-button.selected');
  
  if (selectedButtons.length === 0) {
    alert("여행 테마를 하나 이상 선택해주세요!");
    return;
  }

  // 선택한 모든 테마를 배열로 저장
  const themes = Array.from(selectedButtons).map(btn => btn.innerText.trim());

  localStorage.setItem('selectedThemes', JSON.stringify(themes));
  location.href = 'ai-style.html'; // 다음 페이지 이동
}
