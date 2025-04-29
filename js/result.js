let map;
let markers = [];
let savedPlaces = [];
let totalDays = 0;

function initMap() {
  savedPlaces = JSON.parse(localStorage.getItem('selectedPlaces') || "[]");

  if (savedPlaces.length === 0) {
    alert("선택한 장소가 없습니다. 처음부터 다시 진행해주세요.");
    location.href = 'index.html';
    return;
  }

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 11,
    center: { lat: savedPlaces[0].lat, lng: savedPlaces[0].lng }
  });

  calculateTotalDays();
  generateDayTabs();
  renderDay(1); // 기본 Day1 출력
}

// 출발일, 도착일로 여행 총 일수 계산
function calculateTotalDays() {
  const dateRange = localStorage.getItem('selectedDateRange');
  if (!dateRange) {
    totalDays = 2; // 기본 2일로
    return;
  }

  const dates = dateRange.split(' to ');
  if (dates.length !== 2) {
    totalDays = 2;
    return;
  }

  const startDate = new Date(dates[0]);
  const endDate = new Date(dates[1]);

  const diffTime = endDate - startDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  totalDays = diffDays + 1; // 출발일 포함
}

// Day 버튼 동적 생성
function generateDayTabs() {
  const dayTabs = document.getElementById('day-tabs');
  dayTabs.innerHTML = ""; // 기존 버튼 삭제

  for (let i = 1; i <= totalDays; i++) {
    const button = document.createElement('button');
    button.innerText = `Day ${i}`;
    button.id = `tab-day${i}`;
    button.style.margin = "0 5px";
    button.onclick = () => showDay(i);
    dayTabs.appendChild(button);
  }
}

// 특정 Day만 지도 + 리스트에 출력
function renderDay(dayNumber) {
  // 마커 초기화
  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const dayPlaces = savedPlaces.filter(place => place.day === dayNumber);
  const scheduleList = document.getElementById('schedule-list');
  scheduleList.innerHTML = "";

  if (dayPlaces.length === 0) {
    scheduleList.innerHTML = "<li>선택한 장소가 없습니다.</li>";
    return;
  }

  dayPlaces.forEach((place, idx) => {
    const position = { lat: place.lat, lng: place.lng };

    const marker = new google.maps.Marker({
      position,
      map,
      label: `${idx + 1}`,
      title: place.name
    });
    markers.push(marker);

    const li = document.createElement('li');
    li.innerHTML = `<strong>${idx + 1}. ${place.name}</strong> - ${place.desc}`;
    scheduleList.appendChild(li);
  });

  map.setCenter({ lat: dayPlaces[0].lat, lng: dayPlaces[0].lng });

  drawPath(dayPlaces);
}

// 점선 연결 (Polyline)
function drawPath(dayPlaces) {
  const pathCoordinates = dayPlaces.map(place => ({
    lat: place.lat,
    lng: place.lng
  }));

  const travelPath = new google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeOpacity: 0,
    strokeWeight: 2,
    icons: [{
      icon: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        scale: 4
      },
      offset: '0',
      repeat: '10px'
    }]
  });

  travelPath.setMap(map);
}

// Day 버튼 클릭 시 호출
function showDay(day) {
  renderDay(day);

  for (let i = 1; i <= totalDays; i++) {
    const tab = document.getElementById(`tab-day${i}`);
    if (tab) {
      tab.style.backgroundColor = i === day ? "#22b8cf" : "#ccc";
    }
  }
}

window.onload = initMap;
