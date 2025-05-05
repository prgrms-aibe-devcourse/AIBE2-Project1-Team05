// js/plan-edit.js

let planData = null;
let map;
let markers = [];
let currentPolyline = null;
let sortable = null;

document.addEventListener("DOMContentLoaded", () => {
  const headerTitle = document.getElementById("header-title");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const dayTabsContainer = document.getElementById("day-tabs");
  const itineraryContentContainer = document.getElementById("itinerary-content");
  const addItemButton = document.getElementById("add-item-button");

  // 🟢 데이터 불러오기
  const storedData = localStorage.getItem('aiGeneratedPlanData');
  if (!storedData) {
    alert("불러올 일정 데이터가 없습니다.");
    return;
  }
  planData = JSON.parse(storedData);

  // 🟢 헤더 초기화
  if (planData.city) headerTitle.textContent = planData.city + " 여행";
  if (planData.startDate) startDateInput.value = planData.startDate;
  if (planData.endDate) endDateInput.value = planData.endDate;
  const headerImg = document.getElementById("header-image");
  headerImg.src = planData.image || "https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img";

  // 🟢 Day 탭 생성
  dayTabsContainer.innerHTML = "";
  planData.days.forEach((day, idx) => {
    const btn = document.createElement("button");
    btn.className = "tab-button" + (idx === 0 ? " active" : "");
    btn.dataset.dayIndex = idx;
    btn.textContent = `DAY ${day.day}`;
    dayTabsContainer.appendChild(btn);
  });

  dayTabsContainer.addEventListener("click", (e) => {
    if (!e.target.classList.contains("tab-button")) return;
    const selectedIdx = parseInt(e.target.dataset.dayIndex);
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");
    renderDay(selectedIdx);
  });

  // 🟢 일정 렌더링
  function renderDay(dayIndex) {
    itineraryContentContainer.innerHTML = "";
    const dayData = planData.days[dayIndex];
    if (!dayData) return;

    dayData.items.forEach((item, idx) => {
      const categoryClass = getCategoryClass(item.category);
      const emoji = getCategoryEmoji(item.category);

      const itemDiv = document.createElement("div");
      itemDiv.className = "itinerary-item";

      const imageHtml = item.image
        ? `<img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.onerror=null; this.src='https://placehold.co/40x40/4a5568/e3e6f3?text=?';" />`
        : `<div class="item-emoji-placeholder">${emoji}</div>`;

      itemDiv.innerHTML = `
        <div class="item-number-line">
          <span class="item-number ${categoryClass}">${idx + 1}</span>
          <div class="line"></div>
        </div>
        <div class="item-card">
          ${imageHtml}
          <div class="item-info">
            <input type="text" class="item-name" value="${item.name || ""}" />
            <div class="item-details">
              <input type="text" class="item-category" value="${item.category || ""}" />
              <textarea class="item-reason">${item.reason || ""}</textarea>
            </div>
          </div>
          <div class="edit-buttons">
            <button class="remove-item" data-day="${dayIndex}" data-index="${idx}">-</button>
          </div>
        </div>
      `;
      itineraryContentContainer.appendChild(itemDiv);
    });

    addMarkersAndRoute(dayIndex);
    initSortable(dayIndex);
  }

  // 🟢 SortableJS 드래그 정렬 초기화
  function initSortable(dayIndex) {
    if (sortable) sortable.destroy(); // 기존 인스턴스 제거

    sortable = new Sortable(itineraryContentContainer, {
      animation: 150,
      handle: ".item-card",
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex !== newIndex) {
          const movedItem = planData.days[dayIndex].items.splice(oldIndex, 1)[0];
          planData.days[dayIndex].items.splice(newIndex, 0, movedItem);
          refreshItemNumbers();
          addMarkersAndRoute(dayIndex);
        }
      }
    });
  }

  // 🟢 일정 추가 버튼
  addItemButton.addEventListener("click", () => {
    const activeTab = document.querySelector(".tab-button.active");
    const dayIdx = activeTab ? parseInt(activeTab.dataset.dayIndex) : 0;
    const newItem = { name: "새 장소", category: "기타", reason: "", lat: null, lng: null, image: null };
    planData.days[dayIdx].items.push(newItem);
    renderDay(dayIdx);
  });

  // 🟢 삭제 버튼
  itineraryContentContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-item")) {
      const dayIdx = parseInt(e.target.dataset.day);
      const itemIdx = parseInt(e.target.dataset.index);
      planData.days[dayIdx].items.splice(itemIdx, 1);
      renderDay(dayIdx);
    }
  });

  // 🟢 저장 버튼
  document.getElementById("save-edited-plan").addEventListener("click", () => {
    planData.city = headerTitle.textContent.trim();
    planData.startDate = startDateInput.value;
    planData.endDate = endDateInput.value;

    const dayIndex = parseInt(document.querySelector(".tab-button.active")?.dataset.dayIndex || 0);
    const inputs = itineraryContentContainer.querySelectorAll(".itinerary-item");
    inputs.forEach((div, idx) => {
      planData.days[dayIndex].items[idx].name = div.querySelector(".item-name").value.trim();
      planData.days[dayIndex].items[idx].category = div.querySelector(".item-category").value.trim();
      planData.days[dayIndex].items[idx].reason = div.querySelector(".item-reason").value.trim();
    });

    localStorage.setItem("editedPlanData", JSON.stringify(planData));
    alert("일정이 저장되었습니다!");
    location.href = "plan-view.html";
  });

  // 🟢 첫 Day 렌더링
  renderDay(0);

  // 🟢 지도
  if (window.google && google.maps.Map) initMap();
  else loadGoogleMapsScript();
});

// 🟢 카테고리 클래스
function getCategoryClass(category) {
  const lc = category?.toLowerCase();
  if (lc?.includes("관광")) return "category-sightseeing";
  if (lc?.includes("쇼핑")) return "category-shopping";
  if (lc?.includes("숙소")) return "category-accommodation";
  if (lc?.includes("음식")) return "category-food";
  if (lc?.includes("교통")) return "category-transport";
  return "category-other";
}

// 🟢 카테고리 이모티콘
function getCategoryEmoji(category) {
  const lc = category?.toLowerCase();
  if (lc?.includes("관광")) return "🏛️";
  if (lc?.includes("쇼핑")) return "🛍️";
  if (lc?.includes("숙소")) return "🏨";
  if (lc?.includes("음식")) return "🍽️";
  if (lc?.includes("교통")) return "✈️";
  return "✨";
}

// 🟢 item-number 번호 새로고침
function refreshItemNumbers() {
  document.querySelectorAll('.item-number').forEach((el, idx) => {
    el.textContent = idx + 1;
  });
}

// 🟢 지도
function initMap() {
  const mapElement = document.getElementById("google-map");
  map = new google.maps.Map(mapElement, { center: { lat: 35.6895, lng: 139.6917 }, zoom: 11 });
  addMarkersAndRoute(0);
}

function addMarkersAndRoute(dayIndex) {
  if (!map) return;
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  if (currentPolyline) currentPolyline.setMap(null);

  const day = planData.days[dayIndex];
  const path = [];
  const bounds = new google.maps.LatLngBounds();

  day.items.forEach((item, idx) => {
    if (item.lat && item.lng) {
      const pos = { lat: item.lat, lng: item.lng };
      const marker = new google.maps.Marker({
        position: pos,
        map,
        label: { text: `${idx + 1}`, color: "white", fontWeight: "bold" }
      });
      markers.push(marker);
      bounds.extend(pos);
      path.push(pos);
    }
  });

  if (path.length > 1) {
    currentPolyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: "#5e9dee",
      strokeOpacity: 0.7,
      strokeWeight: 4
    });
    currentPolyline.setMap(map);
  }

  if (path.length) map.fitBounds(bounds);
  else map.setCenter({ lat: 35.6895, lng: 139.6917 });
}

function loadGoogleMapsScript() {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAP_API_KEY}&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
}
