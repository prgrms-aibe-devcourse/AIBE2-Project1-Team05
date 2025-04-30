// js/result.js

// --- 전역 변수 ---
let planData = null; // AI로부터 받은 일정 데이터 저장
let map;             // Google 지도 객체
let markers = [];      // 현재 지도에 표시된 마커 배열
let currentPolyline = null; // 현재 지도에 표시된 경로

// --- DOM 요소 참조 ---
let dayTabsContainer;
let itineraryContentContainer;
let headerImage, headerTitle;
let resultContainer;

// ============================================================
// ===== Gemini API 호출 함수 (수정됨) ========================
// ============================================================
async function fetchItineraryFromAI(promptObject) {
    console.log("AI에게 보낼 프롬프트 객체:", promptObject);
    const apiKey = window.GEMINI_API_KEY; // config.js에서 로드
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        throw new Error("Gemini API 키가 설정되지 않았습니다. config.js 파일을 확인하세요.");
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const promptString = `다음 조건에 맞는 여행 일정을 추천해줘. **응답은 반드시 요청한 JSON 형식의 문자열 '만' 포함.** 다른 텍스트, 설명, 마크다운('\`\`\`json' 등)을 절대 추가하지 마.
[조건]
도시: ${promptObject.cities.join(', ')}
기간: ${promptObject.dateRange || '2박 3일 기준'}
테마: ${promptObject.themes.join(', ')}
스타일: ${promptObject.style}
[요청사항]
날짜별(day) 활동/식사 포함. 테마/스타일 반영하여 각 날짜별로 2~3곳의 장소 추천.
각 장소의 이름(name), 위도(lat:숫자/null), 경도(lng:숫자/null), 카테고리('관광명소'|'음식점'|'쇼핑'|'숙소'|'교통'|'기타'), 추천 이유(reason) 포함.
**이미지(image) 필드는 항상 "" 또는 null.**
[출력 JSON 형식 명세]
${promptObject.outputFormat?.replace('"image": "string (URL or empty or null)"', '"image": ""') || '{ /* 기본 형식 명시 */ }'}
**다시 강조: 응답은 다른 설명 없이 순수한 JSON 문자열 그 자체여야 함.**`;

    console.log("Gemini API 요청 시작...");
    let rawJsonString = "", cleanedJsonString = "";

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{ "parts": [{"text": promptString}] }],
                "generationConfig": {
                  "temperature": 0.7,
                  "topK": 40,
                  "topP": 0.95,
                  "maxOutputTokens": 8192,
                },
                "safetySettings": [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
                ] // 필요시 안전 설정 유지
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Gemini API 오류 (${response.status}): ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("Gemini API 응답 데이터:", data);

        if (data.candidates?.length > 0) {
            const candidate = data.candidates[0];

            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                 // 안전 문제로 차단된 경우 사용자에게 알림
                 if (candidate.finishReason === 'SAFETY') {
                     throw new Error(`AI 응답이 안전 기준에 따라 차단되었습니다.`);
                 }
                 throw new Error(`AI 응답 생성 중 문제 발생: ${candidate.finishReason}`);
            }

            if (candidate.content?.parts?.length > 0) {
                rawJsonString = candidate.content.parts[0].text;

                try {
                    // 1. 마크다운 제거 및 앞뒤 공백 제거
                    cleanedJsonString = rawJsonString.replace(/^```json\s*|```$/g, '').trim();

                    // ★★★★★★★★★★★★★★★★★★★★
                    // ★★★ JSON 파싱 오류 수정 ★★★
                    // ★★★★★★★★★★★★★★★★★★★★
                    // 2. 줄 바꿈 없는 공백(U+00A0)을 일반 공백(U+0020)으로 치환
                    cleanedJsonString = cleanedJsonString.replace(/\u00A0/g, ' ');
                    // ★★★★★★★★★★★★★★★★★★★★
                    // ★★★ 수정 끝 ★★★★★★★★★★
                    // ★★★★★★★★★★★★★★★★★★★★

                    // 3. JSON 객체 패턴 확인 (시작/끝 중괄호 확인)
                    if (!cleanedJsonString.startsWith('{') || !cleanedJsonString.endsWith('}')) {
                        console.warn("정리된 문자열이 '{'로 시작하거나 '}'로 끝나지 않습니다.");
                        throw new Error("AI 응답 형식이 예상된 JSON 객체가 아닙니다.");
                    }

                    // 4. JSON 파싱 시도
                    const parsedItinerary = JSON.parse(cleanedJsonString);

                    if (!parsedItinerary || typeof parsedItinerary !== 'object' || !Array.isArray(parsedItinerary.days)) {
                        throw new Error("파싱된 데이터 구조가 잘못되었습니다. 'days' 배열이 필요합니다.");
                    }

                    console.log("Gemini 일정 데이터 파싱 성공");
                    return parsedItinerary;

                } catch (e) {
                    console.error("JSON 파싱 실패:", e.message);
                    console.error("Raw JSON String:", rawJsonString);
                    console.error("Cleaned JSON String (after replacement):", cleanedJsonString); // 수정 후 문자열 확인
                    throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다 (JSON 파싱 실패).");
                }
            } else {
                throw new Error("AI 응답 내용이 비어있습니다.");
            }
        } else if (data.promptFeedback?.blockReason) {
            console.error(`프롬프트 차단됨: ${data.promptFeedback.blockReason}`, data.promptFeedback.safetyRatings);
            throw new Error(`요청 내용이 안전 기준에 따라 차단되었습니다 (${data.promptFeedback.blockReason}).`);
        } else {
            throw new Error("AI로부터 유효한 일정 데이터를 받지 못했습니다.");
        }
    } catch (error) {
        console.error("Gemini API 호출 또는 처리 중 오류 발생:", error);
        if (error instanceof TypeError) {
             throw new Error("AI 서버와 통신 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
        }
        throw error;
    }
}
// ============================================================
// ===== Gemini API 호출 함수 끝 =============================
// ============================================================


// ============================================================
// ===== Google Custom Search API 호출 함수 ===================
// ============================================================
async function fetchImageFromGoogleSearch(query) {
    console.log(`[Google Search] "${query}" 이미지 검색 시작`);
    const apiKey = window.GOOGLE_CUSTOM_SEARCH_API_KEY; // config.js
    const cx = window.GOOGLE_CUSTOM_SEARCH_CX;         // config.js

    if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY' || !cx || cx === 'YOUR_CUSTOM_SEARCH_ENGINE_ID') {
        console.error("Google Custom Search API 키 또는 CX ID가 설정되지 않았습니다. config.js 파일을 확인하세요.");
        return null;
    }

    const searchParams = new URLSearchParams({
        key: apiKey,
        cx: cx,
        q: query,
        searchType: 'image',
        num: 1
    });
    const apiUrl = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃

        const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`[Google Search] API 오류 (${response.status}): ${errorData?.error?.message || response.statusText} (쿼리: "${query}")`);
            return null;
        }

        const data = await response.json();

        if (data.items?.length > 0 && data.items[0].link) {
            const imageUrl = data.items[0].link;
            console.log(`[Google Search] "${query}" 검색 결과 URL: ${imageUrl}`);
            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                return imageUrl;
            } else {
                console.warn(`[Google Search] "${query}" 검색 결과 URL이 유효하지 않음: ${imageUrl}`);
                return null;
            }
        } else {
            console.warn(`[Google Search] "${query}" 검색 결과 없음.`);
            return null;
        }
    } catch (error) {
        console.error(`[Google Search] API 호출 오류 (쿼리: "${query}"):`, error);
        if (error.name === 'AbortError') {
            console.error("[Google Search] 요청 시간 초과.");
        } else if (error instanceof TypeError) {
            console.error("[Google Search] 네트워크 연결 실패 가능성.");
        }
        return null;
    }
}
// ============================================================
// ===== Google Custom Search API 호출 함수 끝 ===============
// ============================================================


/**
 * 헤더 정보(대표 이미지, 도시/기간 텍스트) 업데이트
 */
function updateHeader() {
    if (!planData) {
        console.error("[updateHeader] 표시할 planData가 없습니다.");
        return;
    }
    headerImage = headerImage || document.getElementById('header-image');
    headerTitle = headerTitle || document.getElementById('header-title');

    if (!headerImage || !headerTitle) {
        console.error("헤더 이미지 또는 타이틀 요소를 찾을 수 없습니다.");
        return;
    }

    const imageUrl = planData.image || 'https://placehold.co/80x80/2d3748/e3e6f3?text=City';
    console.log("[updateHeader] 설정할 헤더 이미지 URL:", imageUrl);
    headerImage.src = imageUrl;
    headerImage.alt = `${planData.city || '선택 도시'} 대표 이미지`;
    headerImage.onerror = function() {
        console.warn(`헤더 이미지 로드 실패: ${this.src}. 기본 이미지로 대체합니다.`);
        this.onerror = null;
        this.src = 'https://placehold.co/80x80/2d3748/e3e6f3?text=No+Img';
    }

    let durationText = '';
    const daysLength = Array.isArray(planData.days) ? planData.days.length : 0;
    if (planData.startDate && planData.endDate) {
         try {
             const start = new Date(planData.startDate + "T00:00:00");
             const end = new Date(planData.endDate + "T00:00:00");
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                 const diffTime = Math.abs(end - start);
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 durationText = `${diffDays}박 ${diffDays + 1}일`;
             } else {
                 durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`;
             }
         } catch (e) {
             durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`;
         }
    } else {
        durationText = `${daysLength > 0 ? daysLength - 1 : 0}박 ${daysLength || 1}일 (추정)`;
    }

    headerTitle.innerHTML = `${planData.city || '도시 정보 없음'}, ${durationText}<br><span style="color: #5e9dee;">AI 추천</span> 일정 입니다`;
    console.log("[updateHeader] 헤더 업데이트 완료:", headerTitle.innerText);
}

/**
 * Day 탭 버튼 동적 생성 및 이벤트 리스너 연결
 */
function createDayTabs() {
    if (!planData || !Array.isArray(planData.days)) {
        console.error("[createDayTabs] planData 또는 planData.days가 유효하지 않습니다.");
        return;
    }
    dayTabsContainer = dayTabsContainer || document.getElementById('day-tabs');
    if (!dayTabsContainer) {
        console.error("ID 'day-tabs' 요소를 찾을 수 없습니다.");
        return;
    }
    dayTabsContainer.innerHTML = '';

    planData.days.forEach((day, idx) => {
        const dayNumber = day?.day ?? (idx + 1);
        const btn = document.createElement('button');
        btn.className = 'tab-button';
        if (idx === 0) {
            btn.classList.add('active');
        }
        btn.dataset.tab = `day${dayNumber}`;
        btn.dataset.dayIndex = idx;
        btn.textContent = `DAY ${dayNumber}`;
        dayTabsContainer.appendChild(btn);
    });

    if (!dayTabsContainer.listenerAttached) {
        dayTabsContainer.addEventListener('click', handleTabClick);
        dayTabsContainer.listenerAttached = true;
        console.log("[createDayTabs] Day 탭 이벤트 리스너 추가됨.");
    }
     console.log(`[createDayTabs] ${planData.days.length}개 Day 탭 생성 완료.`);
}

/**
 * 일정 내용(날짜별 섹션과 항목) 동적 생성
 */
function createItineraryContent() {
    if (!planData || !Array.isArray(planData.days)) {
        console.error("[createItineraryContent] planData 또는 planData.days가 유효하지 않습니다.");
        return;
    }
    itineraryContentContainer = itineraryContentContainer || document.getElementById('itinerary-content');
    if (!itineraryContentContainer) {
        console.error("ID 'itinerary-content' 요소를 찾을 수 없습니다.");
        return;
    }
    itineraryContentContainer.innerHTML = '';

    const getCategoryClass = (category) => {
        if (!category) return 'category-default';
        const lc = category.toLowerCase();
        if (lc.includes('관광')) return 'category-sightseeing';
        if (lc.includes('쇼핑')) return 'category-shopping';
        if (lc.includes('숙소')) return 'category-accommodation';
        if (lc.includes('음식') || lc.includes('식당') || lc.includes('카페')) return 'category-food';
        if (lc.includes('교통')) return 'category-transport';
        return 'category-other';
    };

    const getCategoryEmoji = (category) => {
        if (!category) return '📍';
        const lc = category.toLowerCase();
        if (lc.includes('관광')) return '🏛️';
        if (lc.includes('쇼핑')) return '🛍️';
        if (lc.includes('숙소')) return '🏨';
        if (lc.includes('음식') || lc.includes('식당')) return '🍽️';
        if (lc.includes('카페')) return '☕';
        if (lc.includes('교통')) return '✈️';
        return '✨';
    };

    const placeholderImg = 'https://placehold.co/40x40/4a5568/e3e6f3?text=?';

    planData.days.forEach((day, idx) => {
        if (!day) {
            console.warn(`planData.days 배열의 ${idx}번째 요소가 유효하지 않습니다.`);
            return;
        }
        const dayNumber = day.day ?? (idx + 1);
        const section = document.createElement('section');
        section.id = `day${dayNumber}`;
        section.className = 'tab-content';
        if (idx === 0) {
            section.classList.add('active');
        }

        let itemsHtml = '';

        if (Array.isArray(day.items)) {
            day.items.forEach((item, i) => {
                if (!item) {
                    console.warn(`Day ${dayNumber}의 ${i}번째 item이 유효하지 않습니다.`);
                    return;
                }

                let imageElementHtml = '';
                let imageUrl = item.image;

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
                        <div class="item-number-line">
                            <span class="item-number ${categoryClass}">${i + 1}</span>
                            <div class="line"></div>
                        </div>
                        <div class="item-card">
                            ${imageElementHtml}
                            <div class="item-info">
                                <span class="item-name">${item.name || '이름 없음'}</span>
                                <div class="item-details">
                                    ${categoryHtml}
                                    ${reasonHtml}
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            console.warn(`Day ${dayNumber}의 items 속성이 배열이 아닙니다.`);
            itemsHtml = `<p style="padding: 15px; color: #a0a4b8;">추가된 장소가 없습니다.</p>`;
        }

        section.innerHTML = itemsHtml;
        itineraryContentContainer.appendChild(section);
    });
    console.log("[createItineraryContent] 일정 내용 생성 완료.");
}

/**
 * 지도에서 기존 마커 및 폴리라인 제거
 */
function clearMapElements() {
     console.log("[clearMapElements] 기존 마커 및 경로 제거 시도");
     markers.forEach(marker => marker.setMap(null));
     markers = [];
     if (currentPolyline) {
         currentPolyline.setMap(null);
         currentPolyline = null;
     }
     console.log("[clearMapElements] 기존 마커 및 경로 제거 완료");
}

/**
 * 특정 날짜(dayIndex)의 마커와 이동 동선을 지도에 추가하고 범위 조정
 * @param {number} dayIndex - 표시할 날짜의 인덱스 (planData.days 배열 기준)
 */
function addMarkersAndRouteForDay(dayIndex) {
    if (!map) { console.warn(`[addMarkersAndRouteForDay] 지도 객체가 초기화되지 않았습니다.`); return; }
    if (!planData || !Array.isArray(planData.days) || !planData.days[dayIndex] || !Array.isArray(planData.days[dayIndex].items)) {
        console.warn(`[addMarkersAndRouteForDay] 지도에 표시할 Day ${dayIndex + 1} 데이터가 유효하지 않습니다.`);
        clearMapElements();
        const mapElement = document.getElementById('google-map');
        if (mapElement) { mapElement.innerHTML = '<p style="color: #a0a4b8; padding: 20px; text-align: center;">이 날짜의 지도 정보를 표시할 수 없습니다.</p>'; }
        return;
    }

    console.log(`[addMarkersAndRouteForDay] Day ${dayIndex + 1} 마커 및 경로 표시 시작`);
    clearMapElements();

    const items = planData.days[dayIndex].items;
    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;
    const pathCoordinates = [];

    items.forEach((item, i) => {
        if (item && typeof item.lat === 'number' && typeof item.lng === 'number' &&
            item.lat >= -90 && item.lat <= 90 && item.lng >= -180 && item.lng <= 180)
        {
            hasValidCoords = true;
            const position = { lat: item.lat, lng: item.lng };
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: item.name || `장소 ${i + 1}`,
                label: { text: `${i + 1}`, color: 'white', fontWeight: 'bold' }
            });
            markers.push(marker);
            bounds.extend(position);
            pathCoordinates.push(position);

            const infoContent = `
                <div style="max-width: 200px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.4;">
                    <strong style="font-size: 14px; color: #333;">${item.name || '이름 없음'}</strong><br>
                    ${item.category ? `<small style="color: #555;">카테고리: ${item.category}</small><br>` : ''}
                    ${item.reason ? `<small style="color: #777;">추천: ${item.reason}</small>` : ''}
                </div>`;
            const infowindow = new google.maps.InfoWindow({ content: infoContent });

            marker.addListener('click', () => {
                 markers.forEach(m => m.infowindow?.close());
                 infowindow.open(map, marker);
                 marker.infowindow = infowindow;
            });

        } else {
            console.warn(`'${item?.name}'의 위도/경도(${item?.lat}, ${item?.lng}) 값이 유효하지 않아 지도에 표시할 수 없습니다.`);
        }
    });

    if (pathCoordinates.length > 1) {
        if (currentPolyline) {
            currentPolyline.setMap(null);
        }
        currentPolyline = new google.maps.Polyline({
            path: pathCoordinates,
            geodesic: true,
            strokeColor: '#5e9dee',
            strokeOpacity: 0.7,
            strokeWeight: 5
        });
        currentPolyline.setMap(map);
        console.log(`[addMarkersAndRouteForDay] Day ${dayIndex + 1} 경로 Polyline 생성됨 (${pathCoordinates.length}개 지점).`);
    } else {
        if (currentPolyline) { currentPolyline.setMap(null); }
        console.log(`[addMarkersAndRouteForDay] Day ${dayIndex + 1} 경로 Polyline 생성 안 함 (좌표 부족: ${pathCoordinates.length}개).`);
    }

    if (hasValidCoords && markers.length > 0) {
        if (markers.length > 1) {
            map.fitBounds(bounds, 50);
        } else {
            map.setCenter(bounds.getCenter());
            map.setZoom(15);
        }
        google.maps.event.addListenerOnce(map, 'idle', function() {
            const maxZoom = 17;
            if (map.getZoom() > maxZoom) {
                map.setZoom(maxZoom);
            }
        });
        console.log(`[addMarkersAndRouteForDay] Day ${dayIndex + 1} 지도 범위 조정 완료.`);
    } else if (items.length > 0 && planData.city) {
        let cityCenter = { lat: 37.5665, lng: 126.9780 };
        if (planData.city.includes('도쿄')) cityCenter = { lat: 35.6895, lng: 139.6917 };
        if (planData.city.includes('오사카')) cityCenter = { lat: 34.6937, lng: 135.5023 };
        // ... 다른 도시 추가 ...
        map.setCenter(cityCenter);
        map.setZoom(11);
        console.warn(`[addMarkersAndRouteForDay] Day ${dayIndex + 1}에 유효한 좌표가 없어 도시(${planData.city}) 중심으로 이동합니다.`);
    } else {
        console.warn(`[addMarkersAndRouteForDay] Day ${dayIndex + 1} 일정이 비어있거나 도시 정보가 없어 지도 범위를 조정하지 않습니다.`);
    }
}

/**
 * Day 탭 클릭 이벤트 처리 함수
 * @param {Event} event - 클릭 이벤트 객체
 */
function handleTabClick(event) {
    if (!event.target.classList.contains('tab-button') || !planData?.days) return;

    const selectedButton = event.target;
    if (selectedButton.classList.contains('active')) return;

    const selectedDayIndex = parseInt(selectedButton.dataset.dayIndex);
    if (isNaN(selectedDayIndex) || !planData.days[selectedDayIndex]) {
        console.error("클릭된 탭의 날짜 인덱스가 유효하지 않습니다.");
        return;
    }

    if (dayTabsContainer) {
        dayTabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    }
    selectedButton.classList.add('active');

    if (itineraryContentContainer) {
        itineraryContentContainer.querySelectorAll('.tab-content').forEach(sec => {
            sec.classList.remove('active');
        });
        const dayNumber = planData.days[selectedDayIndex]?.day ?? (selectedDayIndex + 1);
        const activeSection = itineraryContentContainer.querySelector(`#day${dayNumber}`);
        if (activeSection) {
            activeSection.classList.add('active');
        } else {
             console.error(`ID 'day${dayNumber}' 섹션을 찾을 수 없습니다.`);
        }
    }

    addMarkersAndRouteForDay(selectedDayIndex);
    console.log(`[handleTabClick] Day ${selectedDayIndex + 1} 탭 활성화 및 지도 업데이트 완료.`);
}

/**
 * Google Maps API 초기화 콜백 함수 (API 스크립트 로드 완료 시 호출됨)
 */
function initMap() {
    console.log("[initMap] Google Maps API 준비 완료, 지도 초기화 시도");
    if (!planData) {
        console.warn("[initMap] planData가 아직 로드되지 않아 지도 초기화를 연기합니다.");
        const mapElement = document.getElementById('google-map');
        if (mapElement) { mapElement.innerHTML = '<p style="color: #a0a4b8; padding: 20px; text-align: center;">일정 데이터를 먼저 로드해야 지도를 표시할 수 있습니다.</p>'; }
        return;
    }
    if (map) {
        console.warn("[initMap] 지도가 이미 초기화되었습니다.");
        return;
    }

    let initialCenter = { lat: 37.5665, lng: 126.9780 };
    try {
        if (planData.days?.length > 0 && planData.days[0].items?.length > 0) {
            const firstItem = planData.days[0].items.find(item => typeof item?.lat === 'number' && typeof item?.lng === 'number');
            if (firstItem) {
                initialCenter = { lat: firstItem.lat, lng: firstItem.lng };
            } else if (planData.city) {
                if (planData.city.includes('도쿄')) initialCenter = { lat: 35.6895, lng: 139.6917 };
                if (planData.city.includes('오사카')) initialCenter = { lat: 34.6937, lng: 135.5023 };
                 // ... 다른 도시 추가 ...
            }
        } else if (planData.city) {
            if (planData.city.includes('도쿄')) initialCenter = { lat: 35.6895, lng: 139.6917 };
            if (planData.city.includes('오사카')) initialCenter = { lat: 34.6937, lng: 135.5023 };
             // ... 다른 도시 추가 ...
        }
        console.log("[initMap] 지도 초기 중심:", initialCenter);
    } catch (e) {
        console.error("[initMap] 초기 중심 좌표 설정 중 오류:", e);
    }

    const mapElement = document.getElementById('google-map');
    if (!mapElement) {
        console.error("ID 'google-map' 요소를 찾을 수 없습니다.");
         if (typeof hideLoadingIndicator === 'function') hideLoadingIndicator(true, '지도 표시 영역을 찾을 수 없습니다.');
        return;
    }

    try {
        map = new google.maps.Map(mapElement, {
            center: initialCenter,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [ { "featureType": "all", "elementType": "geometry", "stylers": [ { "color": "#202B3B" } ] }, { "featureType": "all", "elementType": "labels.text.fill", "stylers": [ { "gamma": 0.01 }, { "lightness": 20 } ] }, { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [ { "saturation": -31 }, { "lightness": -33 }, { "weight": 2 }, { "gamma": 0.8 } ] }, { "featureType": "all", "elementType": "labels.icon", "stylers": [ { "visibility": "off" } ] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [ { "lightness": 30 }, { "saturation": 30 } ] }, { "featureType": "poi", "elementType": "geometry", "stylers": [ { "saturation": 20 } ] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [ { "lightness": 20 }, { "saturation": -20 } ] }, { "featureType": "road", "elementType": "geometry", "stylers": [ { "lightness": 10 }, { "saturation": -30 } ] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [ { "saturation": 25 }, { "lightness": 25 } ] }, { "featureType": "water", "elementType": "all", "stylers": [ { "lightness": -20 } ] } ]
        });
        console.log("[initMap] Google 지도 객체 생성 완료.");

        const mapTextElement = document.querySelector('.map-placeholder .map-text');
        if (mapTextElement) {
            mapTextElement.style.display = 'none';
        }

        addMarkersAndRouteForDay(0);

        google.maps.event.addListenerOnce(map, 'idle', () => {
             console.log("[initMap] 지도 idle 상태 감지, 로딩 인디케이터 숨기기 시도.");
             if (typeof hideLoadingIndicator === 'function') {
                 hideLoadingIndicator(false);
             }
        });

    } catch (error) {
        console.error("[initMap] 지도 초기화 중 오류 발생:", error);
        mapElement.innerHTML = '<p style="color: #ff6b6b; padding: 20px; text-align: center;">지도를 초기화하는 중 오류가 발생했습니다.</p>';
         if (typeof hideLoadingIndicator === 'function') hideLoadingIndicator(true, '지도 초기화 중 오류 발생.');
    }
}

/**
 * "내 일정으로 담기" 버튼 이벤트 리스너 설정 (수정됨)
 */
function setupSaveButtonListener() {
    const saveButton = document.getElementById('save-to-my-plan');
    if (saveButton) {
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);

        newSaveButton.addEventListener('click', function() {
            if (planData) {
                try {
                    // 1. localStorage에 'aiRecommendedPlan' 키로 planData 저장
                    localStorage.setItem('aiRecommendedPlan', JSON.stringify(planData));
                    console.log("일정 데이터 저장 완료 (Key: aiRecommendedPlan):", planData);

                    // 2. 사용자에게 저장 완료 알림
                    alert('AI 추천 일정이 내 일정에 저장되었습니다!'); // 피드백 메시지

                    // 3. schedule.html 페이지로 이동
                    window.location.href = 'schedule.html';
                } catch (error) {
                    console.error("일정 저장 또는 이동 중 오류 발생:", error);
                    alert('일정을 저장하는 중 오류가 발생했습니다.');
                    if (error.name === 'QuotaExceededError') {
                         alert('브라우저 저장 공간이 부족하여 일정을 저장할 수 없습니다.');
                    }
                }
            } else {
                console.error("저장할 planData가 없습니다. AI 일정 생성이 완료되지 않았을 수 있습니다.");
                alert('저장할 일정 데이터가 없습니다. 페이지를 새로고침하거나 다시 시도해주세요.');
            }
        });
        console.log("[setupSaveButtonListener] '내 일정으로 담기' 버튼 리스너 설정 완료.");
    } else {
        console.error("ID 'save-to-my-plan' 버튼을 찾을 수 없습니다.");
    }
}


// --- 페이지 로드 시 실행되는 메인 로직 ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[DOMContentLoaded] 시작, AI 일정 생성 프로세스 시작");

    resultContainer = document.getElementById('result-container');

    // 필수 UI 함수 존재 확인
    if (typeof hideLoadingIndicator !== 'function' || typeof loadGoogleMapsScript !== 'function') {
        console.error("필수 UI 제어 함수(hideLoadingIndicator 또는 loadGoogleMapsScript)가 정의되지 않았습니다!");
        alert("페이지 초기화 중 오류가 발생했습니다. 필요한 스크립트 파일을 확인하세요.");
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (resultContainer) resultContainer.innerHTML = '<p style="color: #ff6b6b; text-align: center; padding: 50px;">페이지 초기화 오류</p>';
        resultContainer?.classList.remove('hidden');
        return;
    }
    console.log("[DOMContentLoaded] 필수 함수 확인 완료.");

    try {
        // --- 1. 사용자 선택 정보 로드 ---
        console.log("[DOMContentLoaded] 사용자 선택 정보 로드 시작");
        const selectedCities = JSON.parse(localStorage.getItem('selectedCities') || '["도쿄"]');
        const selectedDateRange = localStorage.getItem('selectedDateRange') || '';
        const selectedThemes = JSON.parse(localStorage.getItem('selectedThemes') || '["SNS 핫플"]');
        const selectedStyle = localStorage.getItem('selectedStyle') || '밸런스 있는 일정';
        console.log("[DOMContentLoaded] 사용자 선택 정보:", { selectedCities, selectedDateRange, selectedThemes, selectedStyle });

        // --- 2. AI 요청 프롬프트 객체 생성 ---
        console.log("[DOMContentLoaded] AI 요청 프롬프트 객체 생성");
        const promptObject = {
            cities: selectedCities,
            dateRange: selectedDateRange,
            themes: selectedThemes,
            style: selectedStyle,
            outputFormat: `{
                "city": "string (도시 이름)",
                "image": "string (도시 대표 이미지 URL - AI가 직접 찾지 않음, "" 또는 null)",
                "startDate": "YYYY-MM-DD (여행 시작일, dateRange 기반 추정 또는 null)",
                "endDate": "YYYY-MM-DD (여행 종료일, dateRange 기반 추정 또는 null)",
                "days": [
                    {
                        "day": number (1부터 시작하는 날짜 번호),
                        "items": [
                            {
                                "name": "string (장소 이름)",
                                "image": "string (장소 이미지 URL - AI가 직접 찾지 않음, "" 또는 null)",
                                "lat": number (위도, 모르면 null),
                                "lng": number (경도, 모르면 null),
                                "category": "관광명소|음식점|쇼핑|숙소|교통|기타",
                                "reason": "string (추천 이유)"
                            }
                        ]
                    }
                ]
            }`
        };

        // --- 3. Gemini API 호출 ---
        console.log("[DOMContentLoaded] fetchItineraryFromAI 호출 시작");
        let itineraryData = await fetchItineraryFromAI(promptObject);
        console.log("[DOMContentLoaded] fetchItineraryFromAI 완료, AI 생성 기본 데이터:", JSON.stringify(itineraryData));
        if (!itineraryData || typeof itineraryData !== 'object' || !Array.isArray(itineraryData.days)) {
            throw new Error("AI로부터 받은 일정 데이터의 구조가 예상과 다릅니다.");
        }

        // --- 4. 대표 도시 이미지 검색 ---
        console.log("[DOMContentLoaded] 대표 도시 이미지 검색 시작 (Google Search)");
        const cityQuery = `${itineraryData.city || selectedCities[0] || 'travel'} landmark`;
        const headerImageUrl = await fetchImageFromGoogleSearch(cityQuery);
        itineraryData.image = headerImageUrl;
        console.log("[DOMContentLoaded] 대표 도시 이미지 검색 완료, URL:", headerImageUrl);

        // --- 5. 기본 UI 렌더링 ---
        planData = itineraryData;
        console.log("[DOMContentLoaded] 기본 UI 업데이트 시작 (헤더, 탭, 내용)");
        updateHeader();
        createDayTabs();
        createItineraryContent();
        console.log("[DOMContentLoaded] 기본 UI 업데이트 완료.");

        // --- 6. 저장 버튼 리스너 설정 ---
        console.log("[DOMContentLoaded] '내 일정으로 담기' 버튼 리스너 설정 시도");
        setupSaveButtonListener(); // 이제 planData가 있으므로 호출 가능

        // --- 7. 지도 초기화 시도 ---
        console.log("[DOMContentLoaded] Google 지도 초기화 시도");
        if (window.google?.maps?.Map) {
            console.log("[DOMContentLoaded] Google Maps API 이미 로드됨. initMap() 직접 호출 시도.");
            initMap();
        } else {
            console.log("[DOMContentLoaded] Google Maps API 로드 필요. loadGoogleMapsScript() 호출.");
            loadGoogleMapsScript();
        }
        // 지도 로딩 완료 및 로딩 인디케이터 숨기기는 initMap 내부 idle 이벤트에서 처리됨

        // --- 8. 장소별 이미지 비동기 검색 및 UI 업데이트 ---
        console.log("[DOMContentLoaded] 장소별 이미지 비동기 로드 시작 (Google Search)");
        const imageFetchPromises = [];
        if (Array.isArray(planData.days)) {
            planData.days.forEach((day, dayIdx) => {
                if (day?.items) {
                    day.items.forEach((item, itemIndex) => {
                        if (item?.name && !item.image) {
                            const searchQuery = `${item.name}, ${planData.city || selectedCities[0] || ''}`;
                            imageFetchPromises.push(
                                fetchImageFromGoogleSearch(searchQuery)
                                    .then(imageUrl => {
                                        if (imageUrl) {
                                            item.image = imageUrl;
                                            // UI 업데이트 로직
                                            const dayNumber = day.day ?? (dayIdx + 1);
                                            const sectionId = `day${dayNumber}`;
                                            const itemElement = document.querySelector(`#${sectionId} .itinerary-item:nth-child(${itemIndex + 1})`);
                                            if (itemElement) {
                                                const imgOrPlaceholder = itemElement.querySelector('img, .item-emoji-placeholder');
                                                if (imgOrPlaceholder?.classList.contains('item-emoji-placeholder')) {
                                                    const newImg = document.createElement('img');
                                                    newImg.src = imageUrl;
                                                    newImg.alt = item.name || '';
                                                    newImg.className = 'item-image';
                                                    const placeholderImg = 'https://placehold.co/40x40/4a5568/e3e6f3?text=?';
                                                    newImg.onerror = function() { this.onerror=null; this.src=placeholderImg; };
                                                    imgOrPlaceholder.replaceWith(newImg);
                                                    console.log(`[Image Update] Day ${dayNumber}-${itemIndex + 1} (${item.name}) 이미지 업데이트 완료.`);
                                                } else if (imgOrPlaceholder?.tagName === 'IMG') {
                                                    imgOrPlaceholder.src = imageUrl;
                                                }
                                            }
                                        } else {
                                            if(item) item.image = null;
                                        }
                                    })
                                    .catch(err => {
                                        console.error(`'${searchQuery}' 이미지 검색 중 오류:`, err);
                                        if(item) item.image = null;
                                    })
                            );
                        }
                    });
                }
            });
        }
        await Promise.allSettled(imageFetchPromises);
        console.log("[DOMContentLoaded] 장소별 이미지 비동기 로드 및 처리 완료.");

    } catch (error) {
        // 전체 프로세스 에러 처리
        console.error("[DOMContentLoaded] AI 일정 생성 또는 처리 중 최종 오류 발생:", error);
         if (typeof hideLoadingIndicator === 'function') {
             const displayError = (error.message.includes("API 키") || error.message.includes("API 오류") || error.message.includes("차단") || error.message.includes("JSON"))
                                ? error.message
                                : "AI 일정 생성 중 예상치 못한 문제가 발생했습니다.";
             hideLoadingIndicator(true, displayError);
         } else {
             alert("오류 발생: " + error.message);
             const loadingIndicator = document.getElementById('loading-indicator');
             if (loadingIndicator) loadingIndicator.classList.add('hidden');
             if (resultContainer) resultContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center; padding: 50px;">${error.message}</p>`;
             resultContainer?.classList.remove('hidden');
         }
        planData = null;
    } finally {
        // 최종 로딩 인디케이터 숨김 보장
        setTimeout(() => {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator && !loadingIndicator.classList.contains('hidden')) {
                console.warn("[DOMContentLoaded] finally 블록에서 로딩 인디케이터 강제 숨김 처리.");
                 loadingIndicator.classList.add('hidden');
                 if (resultContainer?.classList.contains('hidden') && !resultContainer?.innerHTML.includes('오류')) {
                     resultContainer.classList.remove('hidden');
                 }
            }
        }, 3000); // 3초 지연
    }

    console.log("[DOMContentLoaded] 모든 초기화 로직 완료.");

}); // DOMContentLoaded 끝