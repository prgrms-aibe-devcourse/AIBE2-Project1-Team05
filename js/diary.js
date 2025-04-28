let map;
let clickedLatLng = null;
let markers = [];
let diaryPhotos = []; // 업로드된 사진 데이터 저장용

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 중심 (초기 위치)
    zoom: 11
  });

  // 지도 클릭 시 사진 업로드
  map.addListener('click', function(event) {
    clickedLatLng = event.latLng;
    document.getElementById('photo-upload').click(); // 파일 업로드 창 열기
  });

  loadSavedPhotos(); // 페이지 로드시 저장된 사진 불러오기
}

// 파일 선택 시 호출
document.getElementById('photo-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file || !clickedLatLng) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const photoData = {
      lat: clickedLatLng.lat(),
      lng: clickedLatLng.lng(),
      imageUrl: e.target.result
    };

    diaryPhotos.push(photoData);
    localStorage.setItem('diaryPhotos', JSON.stringify(diaryPhotos));

    addPhotoMarker(photoData);
  };

  reader.readAsDataURL(file); // base64로 변환
});

// 사진 마커 추가 함수
function addPhotoMarker(photo) {
  const marker = new google.maps.Marker({
    position: { lat: photo.lat, lng: photo.lng },
    map: map,
    icon: {
      url: photo.imageUrl,
      scaledSize: new google.maps.Size(50, 50), // 썸네일 크기
    }
  });
  markers.push(marker);

  // 마커 클릭 시 큰 사진 보기
  marker.addListener('click', () => {
    const win = window.open();
    win.document.write(`<img src="${photo.imageUrl}" style="width:100%;">`);
  });
}

// 저장된 사진 불러오기
function loadSavedPhotos() {
  const saved = JSON.parse(localStorage.getItem('diaryPhotos') || "[]");
  diaryPhotos = saved;

  diaryPhotos.forEach(photo => {
    addPhotoMarker(photo);
  });
}

window.onload = initMap;
