// js/result.js

// --- 데이터 정의 ---
// localStorage에서 데이터 불러오기 시도, 없으면 더미 데이터 사용
const dummyData = {
  city: "도쿄",
  image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8",
  days: [
      {
          day: 1,
          items: [
              { 
                  name: "나리타 국제 공항", 
                  image: "https://images.unsplash.com/photo-1722946545041-61ca444a40b1",
                  lat: 35.7720, 
                  lng: 140.3929,
                  category: "기타", // 분류 추가
                  reason: "도쿄 여행의 시작점" // 추천 이유 추가
              },
              { 
                  name: "센소지", 
                  image: "https://images.unsplash.com/photo-1580167227251-be70f01b0c51",
                  lat: 35.7148, 
                  lng: 139.7967,
                  category: "관광명소",
                  reason: "도쿄에서 가장 오래된 사찰로, 전통적인 일본 문화를 체험할 수 있는 곳"
              },
              { 
                  name: "스시잔마이", 
                  image: "https://img.japankuru.com/prg_img/thumbnail1/img2019022817253121955500.jpg",
                  lat: 35.7101, 
                  lng: 139.8107,
                  category: "음식점",
                  reason: "신선한 스시를 24시간 즐길 수 있는 유명 스시 체인점"
              }
          ]
      },
      {
          day: 2,
          items: [
              { name: "시부야 스크램블 교차로", image: "https://plus.unsplash.com/premium_photo-1661902398022-762e88ff3f82?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", lat: 35.6595, lng: 139.7005 }, // 시부야 예시
              { name: "메이지 신궁", image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max", lat: 35.6764, lng: 139.6993 } // 메이지 신궁 예시
          ]
      }
      // 필요에 따라 더 많은 날짜 추가 가능
  ]
};

// 실제 데이터 로드 (localStorage 우선)
const planData = JSON.parse(localStorage.getItem('planData')) || dummyData;

// --- 전역 변수 ---
let map; // Google Map 객체
let markers = []; // 현재 표시된 마커 배열
let currentPolyline = null; // 현재 표시된 이동 동선(Polyline) 객체

// --- DOM 요소 참조 ---
const headerImage = document.getElementById('header-image');
const headerTitle = document.getElementById('header-title');
const dayTabsContainer = document.getElementById('day-tabs');
const itineraryContentContainer = document.getElementById('itinerary-content');

// --- 함수 정의 ---

/** 헤더 정보 업데이트 */
function updateHeader() {
  if (headerImage) {
      headerImage.src = planData.image || 'https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img'; // 기본 이미지
      headerImage.alt = `${planData.city} 대표 이미지`;
  }
  if (headerTitle) {
      headerTitle.innerHTML = `${planData.city}, ${planData.days.length}박 ${planData.days.length + 1}일<br><span style="color: #5e9dee;">추천</span>일정 입니다`;
  }
}

/** Day 탭 버튼 동적 생성 */
function createDayTabs() {
  if (!dayTabsContainer) {
      console.error("ID가 'day-tabs'인 요소를 찾을 수 없습니다.");
      return;
  }
  dayTabsContainer.innerHTML = ''; // 기존 탭 초기화
  planData.days.forEach((day, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tab-button' + (idx === 0 ? ' active' : ''); // 첫 탭 활성화
      btn.dataset.tab = `day${day.day}`; // 연결될 컨텐츠 ID
      btn.dataset.dayIndex = idx; // 데이터 접근용 인덱스
      btn.textContent = `DAY ${day.day}`;
      dayTabsContainer.appendChild(btn);
  });
}

/** 일정 내용 동적 생성 */
function createItineraryContent() {
  if (!itineraryContentContainer) {
       console.error("ID가 'itinerary-content'인 요소를 찾을 수 없습니다.");
      return;
  }
  itineraryContentContainer.innerHTML = ''; // 기존 내용 초기화
  planData.days.forEach((day, idx) => {
      const section = document.createElement('section');
      section.id = `day${day.day}`;
      section.className = 'tab-content' + (idx === 0 ? ' active' : ''); // 첫 내용 활성화

      let itemsHtml = '';
      day.items.forEach((item, i) => {
          itemsHtml += `
              <div class="itinerary-item" style="animation-delay: ${0.1 + i * 0.1}s;">
                  <div class="item-number-line">
                      <span class="item-number">${i + 1}</span>
                      <div class="line"></div>
                  </div>
                  <div class="item-card">
                      <img src="${item.image || 'https://placehold.co/35x35/4a5568/e3e6f3?text=?'}" alt="${item.name}" class="item-image">
                      <span>${item.name}</span>
                  </div>
              </div>
          `;
      });
      section.innerHTML = itemsHtml;
      itineraryContentContainer.appendChild(section);
  });
}


/** 기존 마커 및 폴리라인 지도에서 제거 */
function clearMapElements() {
  // 마커 제거
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  // 폴리라인 제거
  if (currentPolyline) {
      currentPolyline.setMap(null);
      currentPolyline = null;
  }
}

/** 특정 날짜의 마커와 이동 동선을 지도에 추가하고 범위 조정 */
function addMarkersAndRouteForDay(dayIndex) {
  if (!map || !planData.days[dayIndex]) {
      console.warn(`지도 객체 또는 ${dayIndex + 1}일차 데이터가 없습니다.`);
      return;
  }

  clearMapElements(); // 이전 마커 및 폴리라인 제거

  const items = planData.days[dayIndex].items;
  const bounds = new google.maps.LatLngBounds();
  let hasValidCoords = false;
  const pathCoordinates = []; // 이동 동선 좌표 배열

  // 마커 추가 및 좌표 추출
  items.forEach((item, i) => {
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
          hasValidCoords = true;
          const position = { lat: item.lat, lng: item.lng };
          const marker = new google.maps.Marker({
              position: position,
              map: map,
              title: item.name,
              label: { text: `${i + 1}`, color: 'white', fontWeight: 'bold' },
          });
          markers.push(marker);
          bounds.extend(position);
          pathCoordinates.push(position); // 폴리라인 경로에 좌표 추가
      } else {
          console.warn(`'${item.name}' 항목에 유효한 위경도 정보(lat, lng)가 없습니다.`);
      }
  });

  // 이동 동선(Polyline) 생성 및 표시
  if (pathCoordinates.length > 1) { // 좌표가 2개 이상일 때만 선 그리기
      currentPolyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true, // 지구 곡률 고려
          strokeColor: '#5e9dee', // 라인 색상 (CSS 활성 탭 색상과 일치)
          strokeOpacity: 0.7,   // 라인 투명도
          strokeWeight: 5     // 라인 두께
      });
      currentPolyline.setMap(map); // 지도에 폴리라인 표시
  }

  // 지도 범위 조정
  if (hasValidCoords) {
      // 마커가 하나만 있을 때 너무 확대되는 것을 방지하기 위해 약간의 패딩 추가
      if (markers.length > 1) {
           map.fitBounds(bounds, 50); // 50px 패딩
      } else {
           map.setCenter(bounds.getCenter());
           map.setZoom(15); // 마커 하나일 때 고정 줌
      }

      // 최대 줌 레벨 제한 (선택 사항)
      google.maps.event.addListenerOnce(map, 'idle', function() {
          const maxZoom = 17;
          if (map.getZoom() > maxZoom) {
              map.setZoom(maxZoom);
          }
      });

  } else if (items.length > 0) {
      // 아이템은 있지만 유효 좌표가 없을 경우 도시 중심으로 이동
      const cityCenter = { lat: 35.6895, lng: 139.6917 }; // 기본값: 도쿄
      console.warn(`${dayIndex + 1}일차 일정에 유효한 좌표가 없어 도시 중심으로 지도를 설정합니다.`);
      map.setCenter(cityCenter);
      map.setZoom(11);
  }
}

/** 탭 클릭 이벤트 처리 */
function handleTabClick(event) {
  // 클릭된 요소가 탭 버튼이 아니면 무시
  if (!event.target.classList.contains('tab-button')) return;

  const selectedTabId = event.target.dataset.tab;
  const selectedDayIndex = parseInt(event.target.dataset.dayIndex);

  // 이미 활성화된 탭이면 아무 작업 안함 (선택 사항)
  if (event.target.classList.contains('active')) return;

  // 탭/컨텐츠 활성화 상태 변경
  if (dayTabsContainer) {
      dayTabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  }
  if (itineraryContentContainer) {
      itineraryContentContainer.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
  }

  event.target.classList.add('active');
  const activeContent = document.getElementById(selectedTabId);
  if (activeContent) {
      activeContent.classList.add('active');
      
      // 활성화된 탭 내용에 애니메이션 다시 적용
      const items = activeContent.querySelectorAll('.itinerary-item');
      items.forEach((item, index) => {
          // 애니메이션 초기화 후 재설정
          item.style.animation = 'none';
          item.offsetHeight; // Reflow 트리거
          item.style.animation = '';
          item.style.animationDelay = `${0.1 + index * 0.1}s`;
      });
  } else {
      console.error(`ID가 ${selectedTabId}인 컨텐츠 영역을 찾을 수 없습니다.`);
  }

  // 해당 날짜의 마커 및 이동 동선 업데이트
  addMarkersAndRouteForDay(selectedDayIndex);
}

// --- Google Maps API 초기화 콜백 함수 (전역 스코프에 정의) ---
// 이 함수는 Google Maps API 스크립트 로드가 완료되면 자동으로 호출됩니다.
function initMap() {
  console.log("Google Maps API 로드 완료, initMap 실행");
  let initialCenter = { lat: 35.6895, lng: 139.6917 }; // 기본값: 도쿄

  // 첫날 첫 장소 좌표가 있으면 그걸로 중심 설정
  if (planData.days.length > 0 && planData.days[0].items.length > 0 && typeof planData.days[0].items[0].lat === 'number') {
      initialCenter = { lat: planData.days[0].items[0].lat, lng: planData.days[0].items[0].lng };
  }

  const mapElement = document.getElementById('google-map');
  if (!mapElement) {
      console.error("ID가 'google-map'인 요소를 찾을 수 없습니다.");
      return;
  }

  try {
      map = new google.maps.Map(mapElement, {
          center: initialCenter,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false, // 전체 화면 버튼 숨김
          zoomControlOptions: { // 줌 컨트롤 위치 변경 (선택 사항)
              position: google.maps.ControlPosition.RIGHT_CENTER
          },
          // 어두운 지도 스타일 적용
          styles: [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
              { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
              { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
              { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
              { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
              { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
              { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
              { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
              { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
              { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
              { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
              { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
          ],
      });

      // 지도 로드 후 안내 텍스트 숨기기
      const mapTextElement = document.querySelector('.map-placeholder .map-text');
      if (mapTextElement) {
          mapTextElement.style.display = 'none';
      }

      // 첫 번째 날짜 마커 및 이동 동선 표시
      addMarkersAndRouteForDay(0); // 첫날(인덱스 0) 마커 및 경로 로드

  } catch (error) {
      console.error("Google Map 초기화 중 오류 발생:", error);
       const mapTextElement = document.querySelector('.map-placeholder .map-text');
       if (mapTextElement) {
           mapTextElement.textContent = '지도 초기화 중 오류가 발생했습니다.';
           mapTextElement.style.display = 'block';
       }
       if(mapElement) mapElement.style.display = 'none';
  }
}

// --- 초기화 및 이벤트 리스너 설정 ---
// DOM 콘텐츠 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM 로드 완료, 초기화 시작");

  // 초기 UI 업데이트
  updateHeader();
  createDayTabs();
  createItineraryContent(); // 초기 컨텐츠 생성 (첫날 활성화)

  // 탭 클릭 이벤트 리스너 추가
  if (dayTabsContainer) {
      dayTabsContainer.addEventListener('click', handleTabClick);
  } else {
      console.error("ID가 'day-tabs'인 요소를 찾을 수 없습니다.");
  }

  // 하단 네비게이션 버튼 이벤트 리스너 (예시)
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
      bottomNav.addEventListener('click', (event) => {
          // 클릭된 요소가 버튼인지 확인
          const clickedButton = event.target.closest('button');
          if (clickedButton) {
              const buttonLabel = clickedButton.getAttribute('aria-label') || clickedButton.textContent;
              console.log(`${buttonLabel} 버튼 클릭됨`);
              // 여기에 각 버튼 클릭 시 실제 동작 추가...
              // 예: alert(`${buttonLabel} 기능은 아직 구현되지 않았습니다.`);
          }
      });
  }

  // Google Maps 스크립트 로드는 HTML 파일의 <script> 태그에서 처리하므로 여기서는 호출 X
  console.log("초기화 완료");
});