// flatpickr 초기화
flatpickr("#date-range", {
  mode: "range",
  dateFormat: "Y-m-d",
  locale: "ko"
});

function saveDates() {
  const selectedRange = document.getElementById("date-range").value;

  if (!selectedRange) {
    alert("출발일과 도착일을 선택해주세요!");
    return;
  }

  localStorage.setItem('selectedDateRange', selectedRange);
  location.href = 'people.html'; // 다음 화면으로 이동
}
