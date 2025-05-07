// js/plan-view.js

let planDataView = null;
let mapView = null;
let markersView = [];
let currentPolylineView = null;
window.mapViewInitialized = false; // 중복 초기화 방지 플래그

// --- DOM 요소 참조 ---
let dayTabsContainerView;
let itineraryContentView;
let headerImageView;
let headerTitleView;
let planViewContainer;
let loadingIndicatorView;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[PlanView] DOMContentLoaded 시작");

    // DOM 요소 초기화
    dayTabsContainerView = document.getElementById('day-tabs-view');
    itineraryContentView = document.getElementById('itinerary-content-view');
    headerImageView = document.getElementById('header-image-view');
    headerTitleView = document.getElementById('header-title-view');
    planViewContainer = document.getElementById('plan-view-container');
    loadingIndicatorView = document.getElementById('loading-indicator-view');

    const editButton = document.getElementById('edit-this-plan-button');
    const myPageButton = document.getElementById('go-to-mypage-button');

    if (editButton) {
        editButton.addEventListener('click', () => {
            // 수정 버튼 클릭 시, 현재 보고 있는 데이터를 aiGeneratedPlanData로 저장하고 plan-edit.html로 이동
            // plan-edit.html은 aiGeneratedPlanData를 우선적으로 불러오도록 수정 필요 (또는 키 이름 통일)
            if (planDataView) {
                localStorage.setItem('aiGeneratedPlanData', JSON.stringify(planDataView)); // plan-edit에서 이 키를 사용
                window.location.href = 'plan-edit.html';
            } else {
                alert('수정할 일정 데이터가 없습니다.');
            }
        });
    }

    if (myPageButton) {
        myPageButton.addEventListener('click', () => {
            window.location.href = 'mypage.html';
        });
    }

    loadAndDisplayPlan();
});

function hideLoadingIndicatorView(isError = false, errorMessage = '일정 로드 실패.') {
    if (loadingIndicatorView) {
        loadingIndicatorView.style.display = 'none';
    }
    if (planViewContainer) {
        if (isError) {
            planViewContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 50px;">${errorMessage}</p>`;
        }
        planViewContainer.classList.remove('hidden');
    }
}

async function loadAndDisplayPlan() {
    const storedPlan = localStorage.getItem('editedPlanData'); // plan-edit.js에서 저장한 키

    if (!storedPlan) {
        console.error("[PlanView] localStorage에 'editedPlanData' 없음.");
        hideLoadingIndicatorView(true, "저장된 일정을 찾을 수 없습니다. 마이페이지에서 다시 선택해주세요.");
        // 마이페이지나 메인으로 리디렉션 고려
        // window.location.href = 'mypage.html';
        return;
    }

    try {
        planDataView = JSON.parse(storedPlan);
        if (!planDataView || !planDataView.days || !Array.isArray(planDataView.days)) {
            throw new Error("저장된 일정 데이터 형식이 올바르지 않습니다.");
        }
        console.log("[PlanView] 불러온 일정 데이터:", planDataView);

        // UI 업데이트
        updateHeaderView();
        createDayTabsView();
        createItineraryContentView(); // 첫 번째 탭 내용 먼저 렌더링

        // 로딩 인디케이터 숨김
        hideLoadingIndicatorView(false);

        // 지도 초기화 (Google Maps API 스크립트가 로드된 후 실행되도록)
        if (window.google && window.google.maps && window.google.maps.Map) {
            if (!window.mapViewInitialized) initMapView();
        } else {
            console.log("[PlanView] Google Maps 스크립트 로드 대기 중, loadGoogleMapsScriptView 호출");
            if (typeof loadGoogleMapsScriptView === 'function') {
                 loadGoogleMapsScriptView();
            } else {
                console.error("loadGoogleMapsScriptView 함수를 찾을 수 없습니다.");
                hideLoadingIndicatorView(true, "지도 초기화 함수를 찾을 수 없습니다.");
            }
        }

    } catch (error) {
        console.error("[PlanView] 일정 데이터 로드 또는 파싱 오류:", error);
        hideLoadingIndicatorView(true, `일정 로드 중 오류: ${error.message}`);
        planDataView = null;
    }
}

function updateHeaderView() {
    if (!planDataView) return;

    headerImageView.src = planDataView.image || 'https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img';
    headerImageView.alt = `${planDataView.city || '도시'} 대표 이미지`;
    headerImageView.onerror = function() {
        this.onerror = null;
        this.src = 'https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img';
    };

    let durationText = '';
    const daysLength = Array.isArray(planDataView.days) ? planDataView.days.length : 0;
    if (planDataView.startDate && planDataView.endDate) {
        try {
            const start = new Date(planDataView.startDate);
            const end = new Date(planDataView.endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diffTime = Math.abs(end.getTime() - start.getTime()); // getTime() 추가
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                durationText = `${diffDays}박 ${diffDays + 1}일`;
            } else {
                durationText = daysLength > 0 ? `${daysLength -1}박 ${daysLength}일 (추정)` : '기간 정보 없음';
            }
        } catch (e) {
            durationText = daysLength > 0 ? `${daysLength -1}박 ${daysLength}일 (추정)` : '기간 정보 없음';
        }
    } else {
         durationText = daysLength > 0 ? `${daysLength -1}박 ${daysLength}일 (추정)` : '기간 정보 없음';
    }
    headerTitleView.innerHTML = `${planDataView.city || '알 수 없는 도시'}, ${durationText}<br><span style="font-size: 0.8em; color: #a0a4b8;">저장된 일정</span>`;
}

function createDayTabsView() {
    if (!planDataView || !Array.isArray(planDataView.days)) return;
    dayTabsContainerView.innerHTML = '';
    planDataView.days.forEach((day, idx) => {
        const dayNumber = day?.day ?? (idx + 1);
        const btn = document.createElement('button');
        btn.className = 'tab-button' + (idx === 0 ? ' active' : '');
        btn.dataset.dayIndex = idx;
        btn.textContent = `DAY ${dayNumber}`;
        dayTabsContainerView.appendChild(btn);
    });

    if (!dayTabsContainerView.listenerAttached) { // 중복 리스너 방지
        dayTabsContainerView.addEventListener('click', handleTabClickView);
        dayTabsContainerView.listenerAttached = true;
    }
}

function createItineraryContentView() {
    if (!planDataView || !Array.isArray(planDataView.days)) return;
    itineraryContentView.innerHTML = ''; // 기존 내용 초기화

    const getCategoryClass = (category) => {
        if (!category) return 'category-default'; const lc = category.toLowerCase();
        if (lc.includes('관광')) return 'category-sightseeing'; if (lc.includes('쇼핑')) return 'category-shopping';
        if (lc.includes('숙소')) return 'category-accommodation'; if (lc.includes('음식')) return 'category-food';
        if (lc.includes('교통')) return 'category-transport'; return 'category-other';
    };
    const getCategoryEmoji = (category) => {
        if (!category) return '📍'; const lc = category.toLowerCase();
        if (lc.includes('관광')) return '🏛️'; if (lc.includes('쇼핑')) return '🛍️';
        if (lc.includes('숙소')) return '🏨'; if (lc.includes('음식')) return '🍽️';
        if (lc.includes('교통')) return '✈️'; return '✨';
    };
    const placeholderImg = 'https://placehold.co/40x40/4a5568/e3e6f3?text=?';

    planDataView.days.forEach((day, dayIdx) => {
        const dayNumber = day?.day ?? (dayIdx + 1);
        const section = document.createElement('section');
        section.id = `day-view-${dayNumber}`;
        section.className = 'tab-content' + (dayIdx === 0 ? ' active' : '');
        let itemsHtml = '';

        if (Array.isArray(day.items)) {
            day.items.forEach((item, itemIndex) => {
                let imageElementHtml = '';
                if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
                    imageElementHtml = `<img src="${item.image}" alt="${item.name || ''}" class="item-image" onerror="this.onerror=null; this.src='${placeholderImg}';">`;
                } else {
                    const emoji = getCategoryEmoji(item.category);
                    imageElementHtml = `<div class="item-emoji-placeholder">${emoji}</div>`;
                }

                const categoryClass = getCategoryClass(item.category);
                const categoryHtml = item.category ? `<span class="item-category">${item.category}</span>` : '';
                const reasonHtml = item.reason ? `<span class="item-reason"><span class="reason-prefix">메모:</span> ${item.reason}</span>` : ''; // '추천' 대신 '메모'로

                itemsHtml += `
                    <div class="itinerary-item">
                        <div class="item-number-line">
                            <span class="item-number ${categoryClass}">${itemIndex + 1}</span>
                            <div class="line"></div>
                        </div>
                        <div class="item-card">
                            ${imageElementHtml}
                            <div class="item-info">
                                <span class="item-name">${item.name || '이름 없음'}</span>
                                <div class="item-details">${categoryHtml}${reasonHtml}</div>
                            </div>
                        </div>
                    </div>`;
            });
        }
        section.innerHTML = itemsHtml || `<p style="padding: 15px; color: #a0a4b8;">해당 날짜에 저장된 장소가 없습니다.</p>`;
        itineraryContentView.appendChild(section);
    });

    // 첫 번째 탭 활성화 및 마커 표시
    if (planDataView.days.length > 0) {
        addMarkersAndRouteForDayView(0);
    }
}

function handleTabClickView(event) {
    if (!event.target.classList.contains('tab-button') || !planDataView?.days) return;

    const selectedDayIndex = parseInt(event.target.dataset.dayIndex);
    if (isNaN(selectedDayIndex) || !planDataView.days[selectedDayIndex]) {
        console.error("[PlanView] 잘못된 탭 인덱스:", event.target.dataset.dayIndex);
        return;
    }
    if (event.target.classList.contains('active')) return; // 이미 활성 탭이면 무시

    // 탭 활성화/비활성화
    dayTabsContainerView.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // 해당 탭 내용 표시
    itineraryContentView.querySelectorAll('.tab-content').forEach(sec => {
        const dayNumberForTab = planDataView.days[selectedDayIndex]?.day ?? (selectedDayIndex + 1);
        sec.classList.toggle('active', sec.id === `day-view-${dayNumberForTab}`);
    });

    addMarkersAndRouteForDayView(selectedDayIndex);
}

// --- Google Maps 관련 함수 (View 전용) ---
function initMapView() {
    if (window.mapViewInitialized || mapView) {
      console.warn("[PlanView] initMapView 중복 호출 시도 또는 이미 초기화됨.");
      return;
    }
    console.log("[PlanView] Google Maps API 준비 완료, 지도 초기화 시도");
    window.mapViewInitialized = true;

    if (!planDataView) {
        console.warn("[PlanView] 지도 초기화 시 planDataView 없음.");
        // 필요시 여기서 다시 loadAndDisplayPlan 호출 고려
        return;
    }

    let initialCenter = { lat: 37.5665, lng: 126.9780 }; // 기본 서울
    if (planDataView.days && planDataView.days.length > 0 && planDataView.days[0].items && planDataView.days[0].items.length > 0) {
        const firstItem = planDataView.days[0].items.find(item => item.lat && item.lng);
        if (firstItem) {
            initialCenter = { lat: firstItem.lat, lng: firstItem.lng };
        }
    } else if (planDataView.city === '도쿄') { // 도시 이름 기반 (result.js 참고)
        initialCenter = { lat: 35.6895, lng: 139.6917 };
    }
    // ... 기타 도시 좌표 추가 가능

    const mapElement = document.getElementById('google-map-view');
    if (!mapElement) {
        console.error("[PlanView] 지도 요소 'google-map-view'를 찾을 수 없습니다.");
        return;
    }

    try {
        mapView = new google.maps.Map(mapElement, {
            center: initialCenter,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            // 스타일은 result.css 또는 plan-view.css 에서 정의된 어두운 테마가 있다면 적용
        });
        const mapTextElement = document.querySelector('#google-map-view + .map-text'); // 형제 요소로 찾기
        if (mapTextElement) mapTextElement.style.display = 'none';

        addMarkersAndRouteForDayView(0); // 첫날 마커 및 폴리라인 표시

        google.maps.event.addListenerOnce(mapView, 'idle', () => {
            console.log("[PlanView] 지도 idle 상태.");
            // 로딩 인디케이터는 이미 데이터 로드 후 숨겨졌을 것임
        });

    } catch (error) {
        console.error("[PlanView] 지도 초기화 중 오류:", error);
        if(mapElement) mapElement.innerHTML = '<p style="color: #ff6b6b;">지도 초기화 오류</p>';
    }
}

function clearMapElementsView() {
    markersView.forEach(marker => marker.setMap(null));
    markersView = [];
    if (currentPolylineView) {
        currentPolylineView.setMap(null);
        currentPolylineView = null;
    }
}

function addMarkersAndRouteForDayView(dayIndex) {
    if (!mapView || !planDataView || !planDataView.days || !planDataView.days[dayIndex] || !planDataView.days[dayIndex].items) {
        console.warn(`[PlanView] 지도 또는 ${dayIndex + 1}일차 데이터 없음 (addMarkersAndRouteForDayView)`);
        return;
    }
    clearMapElementsView();

    const items = planDataView.days[dayIndex].items;
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    const pathCoordinates = [];

    items.forEach((item, i) => {
        if (item && typeof item.lat === 'number' && typeof item.lng === 'number' &&
            item.lat >= -90 && item.lat <= 90 && item.lng >= -180 && item.lng <= 180) {
            hasValidCoords = true;
            const position = { lat: item.lat, lng: item.lng };
            const marker = new google.maps.Marker({
                position: position,
                map: mapView,
                title: item.name || '',
                label: { text: `${i + 1}`, color: 'white', fontWeight: 'bold' }
            });
            markersView.push(marker);
            bounds.extend(position);
            pathCoordinates.push(position);

            const infoContent = `
                <div style="max-width: 200px; font-family: 'Inter', sans-serif; color: #333;">
                    <strong>${item.name || '이름 없음'}</strong><br>
                    <small style="color: #555;">${item.category || '카테고리 없음'}</small><br>
                    <small style="color: #777;">${item.reason || '메모 없음'}</small>
                    ${item.image ? `<br><img src="${item.image}" alt="${item.name}" style="width:100px; margin-top:5px; border-radius: 4px;" onerror="this.style.display='none'"/>` : ''}
                </div>`;
            const infowindow = new google.maps.InfoWindow({ content: infoContent });
            marker.addListener('click', () => { infowindow.open(mapView, marker); });
        } else {
            console.warn(`[PlanView] '${item?.name}'의 위경도(${item?.lat}, ${item?.lng})가 유효하지 않습니다.`);
        }
    });

    if (pathCoordinates.length > 1) {
        currentPolylineView = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#5e9dee', // result.js와 동일한 색상
            strokeOpacity: 0.7,
            strokeWeight: 5
        });
        currentPolylineView.setMap(mapView);
    }

    if (hasValidCoords && markersView.length > 0) {
        if (markersView.length > 1) {
            mapView.fitBounds(bounds, 50); // 패딩 50
        } else {
            mapView.setCenter(bounds.getCenter());
            mapView.setZoom(15);
        }
        google.maps.event.addListenerOnce(mapView, 'idle', function() {
            const maxZoom = 17;
            if (mapView.getZoom() > maxZoom) {
                mapView.setZoom(maxZoom);
            }
        });
    } else if (items.length > 0 || planDataView.city) { // 유효 좌표 없어도 도시 중심으로 이동
        let cityCenter = { lat: 37.5665, lng: 126.9780 }; // 서울 기본
        if (planDataView.city === '도쿄') cityCenter = { lat: 35.6895, lng: 139.6917 };
        // ... 다른 도시 중심 좌표 추가 ...
        mapView.setCenter(cityCenter);
        mapView.setZoom(11);
    }
}