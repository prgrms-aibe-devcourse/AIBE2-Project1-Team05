function saveThemes() {
    const checkboxes = document.querySelectorAll('input[name="theme"]:checked');
    const selectedThemes = Array.from(checkboxes).map(cb => cb.value);
  
    if (selectedThemes.length === 0) {
      alert("하나 이상의 테마를 선택해주세요!");
      return;
    }
  
    localStorage.setItem('selectedThemes', JSON.stringify(selectedThemes));
    location.href = 'calendar.html'; // 다음 화면으로 이동
  }
  