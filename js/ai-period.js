let selectedQuick = null;
let selectedRange = null;

// 빠른 기간 선택
function selectQuickPeriod(index) {
  document.querySelectorAll('.period-button').forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === index);
  });
  document.getElementById('directPeriod').classList.remove('selected');
  selectedQuick = index;
  selectedRange = null;
}

// 직접 기간 선택 (flatpickr)
function openCalendar() {
  document.querySelectorAll('.period-button').forEach(btn => btn.classList.remove('selected'));
  const calendar = flatpickr("#directPeriod", {
    mode: "range",
    dateFormat: "Y.m.d",
    onClose: function(selectedDates, dateStr) {
      if (selectedDates.length === 2) {
        document.getElementById('directPeriod').innerText = `${dateStr}`;
        document.getElementById('directPeriod').classList.add('selected');
        selectedRange = selectedDates;
        selectedQuick = null;
      }
    }
  });
  calendar.open();
}

// 선택 완료 → selectedDateRange 저장
function finishPeriod() {
  if (selectedQuick === null && selectedRange === null) {
    alert("기간을 선택해주세요!");
    return;
  }

  if (selectedQuick !== null) {
    const days = [0, 1, 2, 3]; // 당일, 1박2일, 2박3일, 3박4일
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const end = new Date(today.getTime() + days[selectedQuick] * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    localStorage.setItem('selectedDateRange', `${start} to ${end}`);
  } else if (selectedRange !== null) {
    const start = selectedRange[0].toISOString().split('T')[0];
    const end = selectedRange[1].toISOString().split('T')[0];
    localStorage.setItem('selectedDateRange', `${start} to ${end}`);
  }

  location.href = 'ai-theme.html'; // 다음 페이지 이동
}
