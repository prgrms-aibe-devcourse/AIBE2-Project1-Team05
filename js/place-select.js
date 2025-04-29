let map;
let markers = [];
let pathCoordinates = [];
let places = []; // 추천 장소들 저장

// 나라별 추천 장소 데이터
const recommendedPlaces = {
  "한국": {
    "자연": [
      { day: 1, name: "설악산", lat: 38.119444, lng: 128.465556, desc: "자연 속 힐링 산책" },
      { day: 2, name: "제주 협재해변", lat: 33.3945, lng: 126.2395, desc: "에메랄드 빛 바다" }
    ],
    "도시": [
      { day: 1, name: "서울 광화문", lat: 37.5714, lng: 126.9769, desc: "대한민국 중심" },
      { day: 2, name: "부산 해운대", lat: 35.1587, lng: 129.1604, desc: "부산 대표 해변" }
    ],
    "액티비티": [
      { day: 1, name: "가평 레저파크", lat: 37.8314, lng: 127.5091, desc: "수상 레저 액티비티" }
    ]
  },
  "일본": {
    "자연": [
      { day: 1, name: "후지산", lat: 35.3606, lng: 138.7274, desc: "일본 최고봉 자연" }
    ],
    "도시": [
      { day: 1, name: "도쿄 신주쿠", lat: 35.6938, lng: 139.7036, desc: "도쿄 중심지" },
      { day: 2, name: "오사카 도톤보리", lat: 34.6687, lng: 135.5011, desc: "오사카 번화가" }
    ],
    "액티비티": [
      { day: 1, name: "후지큐 하이랜드", lat: 35.4875, lng: 138.7809, desc: "후지산 근처 테마파크" }
    ]
  }
};

function initMap() {
  const selectedCountry = localStorage.getItem('selectedCountry') || "한국";
  const selectedThemes = JSON.parse(localStorage.getItem('selectedThemes') || '["자연"]');

  selectedThemes.forEach(theme => {
    const themePlaces = recommendedPlaces[selectedCountry]?.[theme];
    if (themePlaces) {
      places.push(...themePlaces);
    }
  });

  if (places.length === 0) {
    alert("추천할 장소가 없습니다. 처음부터 다시 진행해주세요.");
    location.href = 'index.html';
    return;
  }

  const center = places[0];
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: { lat: center.lat, lng: center.lng }
  });

  renderPlaceList();
}

function renderPlaceList() {
  const form = document.getElementById('places-form');
  form.innerHTML = "";

  places.forEach((place, idx) => {
    const div = document.createElement('div');
    div.style.marginBottom = "1rem";
    div.innerHTML = `
      <label style="display:flex; align-items:center;">
        <input type="checkbox" name="place" value="${idx}" style="margin-right: 0.5rem;">
        <div>
          <strong>${idx + 1}. ${place.name}</strong><br/>
          <span style="color:gray;">${place.desc}</span>
        </div>
      </label>
    `;
    form.appendChild(div);

    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      label: `${idx + 1}`,
      title: place.name
    });
    markers.push(marker);
    pathCoordinates.push({ lat: place.lat, lng: place.lng });
  });

  drawPath();
}

function drawPath() {
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

function saveSelectedPlaces() {
  const selectedIndexes = Array.from(document.querySelectorAll('input[name="place"]:checked')).map(cb => parseInt(cb.value));

  if (selectedIndexes.length === 0) {
    alert("하나 이상의 장소를 선택해주세요!");
    return;
  }

  const selectedPlaces = selectedIndexes.map(idx => places[idx]);

  localStorage.setItem('selectedPlaces', JSON.stringify(selectedPlaces));
  alert("내 일정으로 담았습니다!");
  location.href = 'result.html';
}

window.onload = initMap;
