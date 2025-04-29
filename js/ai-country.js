// 도시 선택 토글
function toggleCity(button) {
    button.classList.toggle('selected');
  }
  
  // 선택 완료 → selectedCities 저장
  function finishSelection() {
    const selectedCities = Array.from(document.querySelectorAll('.city-button.selected'))
      .map(btn => btn.innerText.trim());
  
    if (selectedCities.length === 0) {
      alert("도시를 하나 이상 선택해주세요!");
      return;
    }
  
    localStorage.setItem('selectedCities', JSON.stringify(selectedCities));
    location.href = 'ai-period.html'; // 다음 페이지 이동
  }
  