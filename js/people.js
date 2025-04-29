function selectPeople(count) {
    localStorage.setItem('selectedPeople', count);
    location.href = 'place-select.html'; // 다음 화면으로 이동
  }
  