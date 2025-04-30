// js/result.js

// --- 전역 변수 ---
let planData = null;
let map;
let markers = [];
let currentPolyline = null;

// --- DOM 요소 참조 ---
let dayTabsContainer;
let itineraryContentContainer;
let headerImage, headerTitle;
let resultContainer;

// ============================================================
// ===== Gemini API 호출 함수 =================================
// ============================================================
async function fetchItineraryFromAI(promptObject) {
    console.log("AI에게 보낼 프롬프트 객체:", promptObject);
    const apiKey = window.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') { throw new Error("Gemini API 키 미설정"); }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const promptString = `다음 조건에 맞는 여행 일정을 추천해줘. **응답은 반드시 요청한 JSON 형식의 문자열 '만' 포함.** 다른 텍스트/설명/마크다운 추가하지 마. [조건] 도시: ${promptObject.cities.join(', ')}, 기간: ${promptObject.dateRange || '2박 3일 기준'}, 테마: ${promptObject.themes.join(', ')}, 스타일: ${promptObject.style}. [요청사항] 날짜별 활동/식사 포함, 테마/스타일 반영 장소 2-3곳 추천. 각 장소의 이름(name), 위도(lat:숫자/null), 경도(lng:숫자/null), 카테고리('관광명소'|'음식점'|'쇼핑'|'숙소'|'교통'|'기타'), 추천 이유(reason) 포함. **이미지(image) 필드는 "" 또는 null.** [출력 JSON 형식 명세] ${promptObject.outputFormat?.replace('"image": "string (URL or empty or null)"', '"image": ""') || '{ /* 기본 형식 */ }'}. 응답은 JSON 문자열 그 자체여야 해.`;
    console.log("Gemini API 요청 시작");
    let rawJsonString = "", cleanedJsonString = "";
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ "contents": [{ "parts": [{"text": promptString}] }], "generationConfig": { "temperature": 0.7, "topK": 40, "topP": 0.95, "maxOutputTokens": 8192, }, "safetySettings": [ /* ... safety settings ... */ ] }) });
        if (!response.ok) { const errorBody = await response.json().catch(() => ({})); throw new Error(`API 오류 (${response.status}): ${errorBody.error?.message || response.statusText}`); }
        const data = await response.json();
        if (data.candidates?.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.finishReason && candidate.finishReason !== 'STOP') { throw new Error(`AI 응답 중단: ${candidate.finishReason}`); }
            if (candidate.content?.parts?.length > 0) {
                rawJsonString = candidate.content.parts[0].text;
                try {
                    cleanedJsonString = rawJsonString.replace(/^```json\s*|```$/g, '').trim();
                    const jsonMatch = cleanedJsonString.match(/^(\{.*\})/s);
                    if (jsonMatch) { cleanedJsonString = jsonMatch[0]; } else { console.warn("JSON 패턴 못찾음"); }
                    const parsedItinerary = JSON.parse(cleanedJsonString);
                    if (!parsedItinerary || !Array.isArray(parsedItinerary.days)) { throw new Error("파싱된 데이터에 'days' 배열 없음"); }
                    console.log("Gemini 일정 데이터 파싱 성공");
                    return parsedItinerary;
                } catch (e) { console.error("JSON 파싱 실패:", e.message, "\nRaw:", rawJsonString, "\nCleaned:", cleanedJsonString); throw new Error("AI 응답 형식 오류."); }
            } else { throw new Error("AI 응답 내용 없음."); }
        } else { throw new Error("AI 응답 후보 없음."); }
    } catch (error) { console.error("Gemini API 호출/처리 오류:", error); throw error; }
}
// ============================================================
// ===== Gemini API 호출 함수 끝 =============================
// ============================================================


// ============================================================
// ===== Google Custom Search API 호출 함수 ===================
// ============================================================
async function fetchImageFromGoogleSearch(query) {
    console.log(`[Google Search] "${query}" 이미지 검색 시작`);
    const apiKey = window.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cx = window.GOOGLE_CUSTOM_SEARCH_CX;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY' || !cx || cx === 'YOUR_CUSTOM_SEARCH_ENGINE_ID') {
        console.error("Google Custom Search Key/CX 미설정"); return null;
    }
    const searchParams = new URLSearchParams({ key: apiKey, cx: cx, q: query, searchType: 'image', num: 1 });
    const apiUrl = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) { const errorData = await response.json().catch(() => ({})); console.error(`[Google Search] API 오류 (${response.status}): ${errorData?.error?.message || response.statusText} for query "${query}"`); return null; }
        const data = await response.json();
        if (data.items?.length > 0 && data.items[0].link) {
            const imageUrl = data.items[0].link;
            console.log(`[Google Search] "${query}" 검색 결과 URL: ${imageUrl}`);
            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) { return imageUrl; }
            else { console.warn(`[Google Search] "${query}" URL 유효하지 않음: ${imageUrl}`); return null; }
        } else { console.warn(`[Google Search] "${query}" 검색 결과 없음.`); return null; }
    } catch (error) {
        console.error(`[Google Search] API 호출 오류 for query "${query}":`, error);
        if (error.name === 'AbortError') { console.error("[Google Search] 요청 시간 초과."); }
        else if (error instanceof TypeError) { console.error("[Google Search] 네트워크 연결 실패."); }
        return null;
    }
}

// ============================================================
// ===== Google Custom Search API 호출 함수 끝 ===============
// ============================================================


/** 헤더 정보 업데이트 */
function updateHeader() {
    if (!planData) { console.error("[updateHeader] planData 없음"); return; }
    headerImage = headerImage || document.getElementById('header-image');
    headerTitle = headerTitle || document.getElementById('header-title');
    if (!headerImage || !headerTitle) { console.error("헤더 요소를 찾을 수 없습니다."); return; }

    const imageUrl = planData.image || 'https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img';
    console.log("[updateHeader] 설정할 헤더 이미지 URL:", imageUrl);
    headerImage.src = imageUrl;
    headerImage.alt = `${planData.city || '도시'} 대표 이미지`;
    headerImage.onerror = function() {
        console.warn(`헤더 이미지 로드 실패: ${this.src}. 플레이스홀더 표시.`);
        this.onerror=null; this.src='https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img';
    }

    let durationText = '';
    const daysLength = Array.isArray(planData.days) ? planData.days.length : 0;
    if (planData.startDate && planData.endDate) {
         try {
            const start = new Date(planData.startDate); const end = new Date(planData.endDate);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                durationText = `${diffDays}박 ${diffDays + 1}일`;
            } else { durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`; }
         } catch (e) { durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`; }
    } else { durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`; }
    headerTitle.innerHTML = `${planData.city || '도시 정보 없음'}, ${durationText}<br><span style="color: #5e9dee;">AI 추천</span> 일정 입니다`;
}

/** Day 탭 버튼 동적 생성 */
function createDayTabs() {
    if (!planData || !Array.isArray(planData.days)) { console.error("[createDayTabs] planData.days 유효하지 않음"); return; }
    dayTabsContainer = dayTabsContainer || document.getElementById('day-tabs');
    if (!dayTabsContainer) { return; }
    dayTabsContainer.innerHTML = '';
    planData.days.forEach((day, idx) => {
        const dayNumber = day?.day ?? (idx + 1);
        const btn = document.createElement('button');
        btn.className = 'tab-button' + (idx === 0 ? ' active' : '');
        btn.dataset.tab = `day${dayNumber}`; btn.dataset.dayIndex = idx; btn.textContent = `DAY ${dayNumber}`;
        dayTabsContainer.appendChild(btn);
    });
    if (!dayTabsContainer.listenerAttached) {
        dayTabsContainer.addEventListener('click', handleTabClick); dayTabsContainer.listenerAttached = true;
    }
}

/** 일정 내용 동적 생성 - 이모티콘 대체 포함 */
function createItineraryContent() {
    if (!planData || !Array.isArray(planData.days)) { console.error("[createItineraryContent] planData.days 유효하지 않음"); return; }
    itineraryContentContainer = itineraryContentContainer || document.getElementById('itinerary-content');
    if (!itineraryContentContainer) { return; }
    itineraryContentContainer.innerHTML = '';

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

    planData.days.forEach((day, idx) => {
        if (!day) { console.warn(`days 배열 ${idx}번째 요소 없음`); return; }
        const dayNumber = day.day ?? (idx + 1);
        const section = document.createElement('section');
        section.id = `day${dayNumber}`; section.className = 'tab-content' + (idx === 0 ? ' active' : '');
        let itemsHtml = '';

        if (Array.isArray(day.items)) {
            day.items.forEach((item, i) => {
                if (!item) { console.warn(`Day ${dayNumber}의 ${i}번째 item 없음`); return; }
                let imageElementHtml = '';
                let imageUrl = item.image; // Google Search 결과 또는 null

                if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                    imageElementHtml = `<img src="${imageUrl}" alt="${item.name || ''}" class="item-image" onerror="this.onerror=null; this.src='${placeholderImg}';">`;
                } else {
                    const emoji = getCategoryEmoji(item.category);
                    imageElementHtml = `<div class="item-emoji-placeholder">${emoji}</div>`;
                }
                const categoryClass = getCategoryClass(item.category);
                const categoryHtml = item.category ? `<span class="item-category">${item.category}</span>` : '';
                const reasonHtml = item.reason ? `<span class="item-reason"><span class="reason-prefix">추천</span> ${item.reason}</span>` : '';
                itemsHtml += `
                    <div class="itinerary-item" style="animation-delay: ${0.1 + i * 0.1}s;">
                        <div class="item-number-line"> <span class="item-number ${categoryClass}">${i + 1}</span> <div class="line"></div> </div>
                        <div class="item-card">
                            ${imageElementHtml}
                            <div class="item-info">
                                <span class="item-name">${item.name || '이름 없음'}</span>
                                <div class="item-details"> ${categoryHtml} ${reasonHtml} </div>
                            </div>
                        </div>
                    </div>`;
            });
        } else { console.warn(`Day ${dayNumber}의 items가 배열 아님`); }
        section.innerHTML = itemsHtml || `<p style="padding: 15px; color: #a0a4b8;">추천 장소 없음.</p>`;
        itineraryContentContainer.appendChild(section);
    });
}

/** 기존 마커 및 폴리라인 지도에서 제거 */
function clearMapElements() {
     markers.forEach(marker => marker.setMap(null)); markers = [];
     if (currentPolyline) { currentPolyline.setMap(null); currentPolyline = null; }
}

/** 특정 날짜의 마커와 이동 동선을 지도에 추가하고 범위 조정 */
function addMarkersAndRouteForDay(dayIndex) {
    if (!map || !planData || !Array.isArray(planData.days) || !planData.days[dayIndex] || !Array.isArray(planData.days[dayIndex].items)) { console.warn(`[addMarkers] 지도 또는 ${dayIndex + 1}일차 데이터 없음`); return; }
    clearMapElements();
    const items = planData.days[dayIndex].items;
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    const pathCoordinates = [];

    items.forEach((item, i) => {
        if (item && typeof item.lat === 'number' && typeof item.lng === 'number' && item.lat >= -90 && item.lat <= 90 && item.lng >= -180 && item.lng <= 180) {
            hasValidCoords = true;
            const position = { lat: item.lat, lng: item.lng };
            const marker = new google.maps.Marker({ position: position, map: map, title: item.name || '', label: { text: `${i + 1}`, color: 'white', fontWeight: 'bold' }});
            markers.push(marker); bounds.extend(position); pathCoordinates.push(position);
            const infoContent = `<div style="max-width: 200px;"><strong>${item.name || ''}</strong><br><small>${item.category || ''}</small><br><small>${item.reason || ''}</small></div>`;
            const infowindow = new google.maps.InfoWindow({ content: infoContent });
            marker.addListener('click', () => { infowindow.open(map, marker); });
        } else { console.warn(`'${item?.name}' 위경도(${item?.lat}, ${item?.lng}) 유효하지 않음`); }
    });

    // 폴리라인 그리기 (좌표 2개 이상일 때만)
    if (pathCoordinates.length > 1) {
        if (currentPolyline) currentPolyline.setMap(null);
        currentPolyline = new google.maps.Polyline({ path: pathCoordinates, geodesic: true, strokeColor: '#5e9dee', strokeOpacity: 0.7, strokeWeight: 5 });
        currentPolyline.setMap(map);
        console.log(`[addMarkers] Day ${dayIndex + 1} 경로 Polyline 생성됨`);
    } else {
        if (currentPolyline) currentPolyline.setMap(null);
        console.log(`[addMarkers] Day ${dayIndex + 1} 경로 Polyline 생성 안함 (좌표 부족)`);
    }

    // 지도 범위 조정
    if (hasValidCoords && markers.length > 0) { if (markers.length > 1) { map.fitBounds(bounds, 50); } else { map.setCenter(bounds.getCenter()); map.setZoom(15); } google.maps.event.addListenerOnce(map, 'idle', function() { const maxZoom = 17; if (map.getZoom() > maxZoom) { map.setZoom(maxZoom); } }); }
    else if (items.length > 0) { let cityCenter = { lat: 35.6895, lng: 139.6917 }; if (planData.city === '서울') cityCenter = { lat: 37.5665, lng: 126.9780 }; map.setCenter(cityCenter); map.setZoom(11); }
    else { console.warn(`${dayIndex + 1}일차 일정 비어 있음`); }
}

/** 탭 클릭 이벤트 처리 */
function handleTabClick(event) {
    if (!event.target.classList.contains('tab-button') || !planData?.days) return;
    const selectedDayIndex = parseInt(event.target.dataset.dayIndex);
    if (isNaN(selectedDayIndex) || !planData.days[selectedDayIndex]) { return; }
    if (event.target.classList.contains('active')) return;
    /* 탭 활성화/비활성화 */
    if (dayTabsContainer) { dayTabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); }
    event.target.classList.add('active');
    if (itineraryContentContainer) { itineraryContentContainer.querySelectorAll('.tab-content').forEach(sec => { const dayNumber = planData.days[selectedDayIndex]?.day ?? (selectedDayIndex + 1); sec.classList.toggle('active', sec.id === `day${dayNumber}`); }); }
    addMarkersAndRouteForDay(selectedDayIndex);
}

/** Google Maps API 초기화 콜백 함수 */
function initMap() {
    console.log("[initMap] Google Maps API 준비 완료, 지도 초기화 시도");
    if (!planData) { console.warn("[initMap] planData 없음."); return; }
    if (map) { console.warn("[initMap] 지도 이미 초기화됨."); return; }
    let initialCenter = { lat: 35.6895, lng: 139.6917 };
    try { /* 초기 중심 계산 */ } catch (e) { /* 오류 */ }
    const mapElement = document.getElementById('google-map');
    if (!mapElement) { return; }
    try {
        map = new google.maps.Map(mapElement, { center: initialCenter, zoom: 12, /* 옵션 */ });
        const mapTextElement = document.querySelector('.map-placeholder .map-text');
        if (mapTextElement) { mapTextElement.style.display = 'none'; }
        addMarkersAndRouteForDay(0); // 첫날 마커 및 폴리라인 표시
        google.maps.event.addListenerOnce(map, 'idle', () => {
             console.log("[initMap] 지도 idle 상태, 로딩 숨김.");
             if (typeof hideLoadingIndicator === 'function') hideLoadingIndicator(false);
        });
    } catch (error) { /* 지도 초기화 오류 */ }
}

/** "내 일정으로 담기" 버튼 리스너 설정 */
function setupSaveButtonListener() {
    const saveButton = document.getElementById('save-to-my-plan');
    if (saveButton) {
         saveButton.replaceWith(saveButton.cloneNode(true));
         document.getElementById('save-to-my-plan').addEventListener('click', function() {
            if (planData) { try { /* 저장 */ } catch (error) { /* 오류 */ } }
            else { alert('저장할 일정 데이터가 없습니다.'); }
        });
    } else { console.error("저장 버튼 못 찾음"); }
}

// --- 페이지 로드 시 실행되는 메인 로직 (Google Custom Search 연동) ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DOMContentLoaded] 시작, AI 일정 생성 시작");
    // DOM 요소 참조 초기화
    resultContainer = document.getElementById('result-container');
    dayTabsContainer = document.getElementById('day-tabs');
    itineraryContentContainer = document.getElementById('itinerary-content');
    headerImage = document.getElementById('header-image');
    headerTitle = document.getElementById('header-title');

    // 필수 함수 존재 확인
    if (typeof hideLoadingIndicator !== 'function' || typeof loadGoogleMapsScript !== 'function') { console.error("필수 함수(hideLoadingIndicator 또는 loadGoogleMapsScript) 없음!"); alert("페이지 초기화 오류"); return; }

    try {
        console.log("[DOMContentLoaded] 사용자 선택 정보 로드");
        const selectedCities = JSON.parse(localStorage.getItem('selectedCities') || '["도쿄"]');
        const selectedDateRange = localStorage.getItem('selectedDateRange') || '';
        const selectedThemes = JSON.parse(localStorage.getItem('selectedThemes') || '["SNS 핫플"]');
        const selectedStyle = localStorage.getItem('selectedStyle') || '밸런스 있는 일정';

        console.log("[DOMContentLoaded] 프롬프트 객체 생성");
        const promptObject = {
            cities: selectedCities, dateRange: selectedDateRange, themes: selectedThemes, style: selectedStyle,
            outputFormat: `{ "city": "string", "image": "", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "days": [ { "day": number, "items": [ { "name": "string", "image": "", "lat": number (or null), "lng": number (or null), "category": "관광명소|음식점|쇼핑|숙소|교통|기타", "reason": "string" } ] } ] }`
        };

        console.log("[DOMContentLoaded] fetchItineraryFromAI 호출 시작");
        let itineraryData = await fetchItineraryFromAI(promptObject);
        console.log("[DOMContentLoaded] fetchItineraryFromAI 완료, 기본 데이터:", itineraryData);
        if (!itineraryData || !Array.isArray(itineraryData.days)) { throw new Error("AI 일정 데이터 구조 오류."); }

        // --- 헤더 이미지 검색 ---
        console.log("[DOMContentLoaded] 대표 도시 이미지 검색 시작");
        const cityQuery = `${itineraryData.city || selectedCities[0] || 'travel'} landmark`;
        const headerImageUrl = await fetchImageFromGoogleSearch(cityQuery);
        itineraryData.image = headerImageUrl; // 검색 결과를 itineraryData에 반영
        console.log("[DOMContentLoaded] 대표 도시 이미지 검색 완료:", headerImageUrl);
        // --- 헤더 이미지 검색 끝 ---

        // --- 기본 UI 먼저 렌더링 ---
        planData = itineraryData;
        console.log("[DOMContentLoaded] 기본 UI 업데이트 시작");
        updateHeader(); createDayTabs(); createItineraryContent();
        console.log("[DOMContentLoaded] 기본 UI 업데이트 완료");
        console.log("[DOMContentLoaded] 저장 버튼 리스너 설정");
        setupSaveButtonListener();

        // --- 로딩 숨기기 (지도 로드 전) ---
        console.log("!!! 로딩 인디케이터 숨기기 시도 (기본 UI 렌더링 후) !!!");
        hideLoadingIndicator(false);
        // --- 로딩 숨기기 완료 ---

        // --- 지도 초기화 시도 ---
        console.log("[DOMContentLoaded] 지도 초기화 시도");
        if (window.google && window.google.maps && google.maps.Map) { initMap(); }
        else { loadGoogleMapsScript(); }
        // --- 지도 초기화 끝 ---

        // --- Google Search 이미지 비동기 로드 및 UI 업데이트 ---
        console.log("[DOMContentLoaded] Google Search 이미지 비동기 로드 시작");
        const imageFetchPromises = [];
        if (Array.isArray(planData.days)) {
            planData.days.forEach(day => {
                if (day && Array.isArray(day.items)) {
                    day.items.forEach((item, itemIndex) => {
                        if (item && item.name && !item.image) {
                            const searchQuery = `${item.name}, ${planData.city || selectedCities[0] || ''}`;
                            imageFetchPromises.push(
                                fetchImageFromGoogleSearch(searchQuery).then(imageUrl => {
                                    if (imageUrl && typeof imageUrl === 'string') {
                                        item.image = imageUrl;
                                        // UI 업데이트 (이모티콘 -> 이미지 교체)
                                        const dayNumber = day.day ?? (planData.days.indexOf(day) + 1);
                                        const sectionId = `day${dayNumber}`;
                                        const itemElement = document.querySelector(`#${sectionId} .itinerary-item:nth-child(${itemIndex + 1})`);
                                        if (itemElement) {
                                            const imgOrPlaceholder = itemElement.querySelector('img, .item-emoji-placeholder');
                                            if (imgOrPlaceholder?.classList.contains('item-emoji-placeholder')) {
                                                const newImg = document.createElement('img');
                                                newImg.src = imageUrl; newImg.alt = item.name || ''; newImg.className = 'item-image';
                                                const placeholderImg = 'https://placehold.co/40x40/4a5568/e3e6f3?text=?';
                                                newImg.onerror = function() { this.onerror=null; this.src=placeholderImg; };
                                                imgOrPlaceholder.replaceWith(newImg);
                                            } else if (imgOrPlaceholder?.tagName === 'IMG') {
                                                imgOrPlaceholder.src = imageUrl;
                                            }
                                        }
                                    }
                                }).catch(err => { if(item) item.image = null; })
                            );
                        }
                    });
                }
            });
        }
        await Promise.allSettled(imageFetchPromises);
        console.log("[DOMContentLoaded] Google Search 이미지 비동기 로드 처리 완료");
        if (planData) { localStorage.setItem('aiGeneratedPlanData', JSON.stringify(planData)); }
        // --- Google Search 끝 ---

    } catch (error) {
        console.error("[DOMContentLoaded] 최종 처리 중 오류:", error);
         if (typeof hideLoadingIndicator === 'function') {
             const displayError = error.message.includes("API 키") || error.message.includes("API 오류") ? error.message : "AI 일정 생성 중 문제가 발생했습니다.";
             hideLoadingIndicator(true, displayError);
         }
        planData = null;
    }
    console.log("[DOMContentLoaded] 모든 초기화 로직 완료");
}); // DOMContentLoaded 끝