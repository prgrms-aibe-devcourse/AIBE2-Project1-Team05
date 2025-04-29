function selectStyle(button) {
    document.querySelectorAll('.style-button').forEach(btn => {
      btn.classList.remove('selected');
    });
    button.classList.add('selected');
  }
  
  function finishStyle() {
    const selected = document.querySelector('.style-button.selected');
    if (!selected) {
      alert("여행 스타일을 선택해주세요!");
      return;
    }
  
    const style = selected.innerText.trim();
    localStorage.setItem('selectedStyle', style);
    location.href = 'ai-result.html'; // 결과 페이지로 이동
  }
  