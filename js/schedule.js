// js/schedule.js

let scheduleMap; // 지도 객체
let scheduleMarkers = []; // 지도 마커 배열
let schedulePolyline; // 경로 표시 Polyline

// DOMContentLoaded 이벤트 리스너는 페이지 로드 시 한 번만 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    console.log("schedule.js 로드됨, DOMContentLoaded 발생");
    loadScheduleData(); // 저장된 일정 데이터 로드 및 표시

    // 편집 버튼 이벤트 리스너 설정
    setupEditButtons();

    // 필터 버튼 등 다른 UI 요소 이벤트 리스너 추가 가능
    // 예: setupFilterButtons();

    // Google Maps API 스크립트는 HTML에서 loadScheduleMapScript() 호출로 로드됩니다.
});

// 편집 버튼 이벤트 리스너 설정 함수
function setupEditButtons() {
    const editButtons = document.querySelectorAll(".edit, .edit-link");
    editButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            // TODO: 편집 기능 구현 또는 편집 페이지 이동
            alert("편집 기능은 아직 구현되지 않았습니다.");
            // location.href = "edit_schedule.html";
        });
    });
}

// 저장된 일정 데이터 로드 및 표시 함수
function loadScheduleData() {
    console.log("loadScheduleData 함수 실행");
    const savedDataString = localStorage.getItem('aiRecommendedPlan');
    if (!savedDataString) {
        console.warn("저장된 AI 추천 일정이 localStorage에 없습니다.");
        displayDefaultScheduleMessage(); // 기본 메시지 표시 함수 호출
        return;
    }

    try {
        const planData = JSON.parse(savedDataString);
        console.log("localStorage에서 로드된 일정 데이터:", planData);

        // 데이터 유효성 검사 (최소한의 검사)
        if (!planData || !planData.days || !Array.isArray(planData.days)) {
             console.error("로드된 데이터 형식이 잘못되었습니다.");
             displayDefaultScheduleMessage("잘못된 형식의 일정 데이터입니다.");
             return;
        }

        // 1. 헤더 정보 업데이트
        updateScheduleHeader(planData);

        // 2. 일정 섹션 동적 생성
        createScheduleSections(planData);

        // 3. 지도 관련 데이터 준비 (initScheduleMap 함수에서 사용)
        // 로드된 planData를 initScheduleMap에서 사용할 수 있도록 전역 변수나 다른 방식으로 전달
        window.loadedPlanData = planData; // 전역 변수로 전달 (간단한 예시)
        console.log("window.loadedPlanData 설정 완료:", window.loadedPlanData);

        // 지도가 이미 초기화되었다면 마커를 다시 그림
        if (scheduleMap && window.google) {
             console.log("지도가 이미 초기화됨. 마커 업데이트 시도.");
             addMarkersAndRouteToScheduleMap(planData);
        } else {
            console.log("지도가 아직 초기화되지 않음. initScheduleMap 콜백 대기.");
        }

    } catch (error) {
        console.error("저장된 일정 데이터를 파싱하거나 표시하는 중 오류 발생:", error);
        displayDefaultScheduleMessage("일정 로딩 중 오류가 발생했습니다.");
    }
}

// 기본 메시지 표시 함수
function displayDefaultScheduleMessage(message = "저장된 일정이 없습니다.") {
    const titleElement = document.getElementById('schedule-title');
    const datesElement = document.getElementById('schedule-dates');
    const metaElement = document.getElementById('schedule-meta');
    const sectionsContainer = document.getElementById('schedule-sections-container');

    if (titleElement) titleElement.firstChild.textContent = message + ' ';
    if (datesElement) datesElement.textContent = "";
    if (metaElement) metaElement.textContent = "AI 추천 메뉴에서 일정을 저장해보세요.";
    if (sectionsContainer) sectionsContainer.innerHTML = `<p style="text-align: center; color: #a0a4b8; margin-top: 20px;">${message}</p>`;
}

// 스케줄 헤더 업데이트 함수
function updateScheduleHeader(planData) {
    const titleElement = document.getElementById('schedule-title');
    const datesElement = document.getElementById('schedule-dates');
    const metaElement = document.getElementById('schedule-meta');

    if (titleElement) {
        const titleText = `${planData.city || '알 수 없는 도시'} 여행`;
        // 편집 버튼을 유지하면서 텍스트만 업데이트
        if (titleElement.firstChild && titleElement.firstChild.nodeType === Node.TEXT_NODE) {
             titleElement.firstChild.textContent = titleText + ' ';
        } else {
            // 텍스트 노드가 없거나 다른 구조일 경우 안전하게 처리
            const editSpan = titleElement.querySelector('.edit');
            titleElement.textContent = titleText + ' ';
            if (editSpan) titleElement.appendChild(editSpan);
        }
    }

    if (datesElement) {
        let dateRangeText = "날짜 정보 없음";
        if (planData.selections && planData.selections.dateRange) {
            const [startDateStr, endDateStr] = planData.selections.dateRange.split(' to ');
             if (startDateStr && endDateStr) {
                 try {
                     const startDate = new Date(startDateStr + "T00:00:00"); // 시간 정보 추가하여 정확성 확보
                     const endDate = new Date(endDateStr + "T00:00:00");
                     if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                         const formatDate = (date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}.${month}.${day}`;
                         }
                         dateRangeText = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
                     } else {
                         console.warn("날짜 형식이 잘못되었습니다(Date Range):", planData.selections.dateRange);
                         dateRangeText = planData.selections.dateRange; // 원래 형식으로 표시
                     }
                 } catch(e) {
                     console.error("날짜 처리 중 오류:", e);
                     dateRangeText = planData.selections.dateRange;
                 }
             } else {
                dateRangeText = planData.selections.dateRange; // 분리 실패 시 그대로 표시
             }
        } else if (planData.startDate && planData.endDate) { // AI 데이터에 날짜가 있을 경우
             // startDate, endDate 처리 (위와 유사하게)
              try {
                  const startDate = new Date(planData.startDate + "T00:00:00");
                  const endDate = new Date(planData.endDate + "T00:00:00");
                  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                       // formatDate 함수 재사용
                       const formatDate = (date) => {/* ... */} // 위에 정의된 formatDate 사용
                       dateRangeText = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
                  } else {
                       dateRangeText = `${planData.startDate} ~ ${planData.endDate} (형식?)`;
                  }
              } catch (e) { dateRangeText = "날짜 처리 오류"; }
        } else {
            // planData.days 길이를 기반으로 추정
            dateRangeText = `${planData.days.length - 1}박 ${planData.days.length}일 (추정)`;
        }
        datesElement.textContent = dateRangeText;
    }

    if (metaElement) {
         let metaText = "";
         if (planData.selections) {
             const themes = planData.selections.themes && planData.selections.themes.length > 0
                             ? planData.selections.themes.join(', ')
                             : '';
             const style = planData.selections.style || '';
             if (themes) metaText += `테마: ${themes}`;
             if (style) metaText += (metaText ? ' | ' : '') + `스타일: ${style}`;
             // TODO: 인원수 정보가 있다면 추가
         }
         metaElement.textContent = metaText || '부가 정보 없음';
    }
}

// 스케줄 섹션 생성 함수
function createScheduleSections(planData) {
    const sectionsContainer = document.getElementById('schedule-sections-container');
    if (!sectionsContainer) {
        console.error("ID가 'schedule-sections-container'인 요소를 찾을 수 없습니다.");
        return;
    }
    sectionsContainer.innerHTML = ''; // 기존 내용 초기화

    planData.days.forEach((dayData, dayIndex) => {
        const section = document.createElement('section');
        section.className = 'schedule-section';

        // 현재 날짜 계산
        let currentDate = '날짜 정보 없음';
        let baseDateStr = null;
        if (planData.selections && planData.selections.dateRange) {
             baseDateStr = planData.selections.dateRange.split(' to ')[0];
        } else if (planData.startDate) {
             baseDateStr = planData.startDate;
        }

        if (baseDateStr) {
             try {
                 const baseDate = new Date(baseDateStr + "T00:00:00");
                 if (!isNaN(baseDate.getTime())) {
                     baseDate.setDate(baseDate.getDate() + dayIndex);
                     const year = baseDate.getFullYear();
                     const month = String(baseDate.getMonth() + 1).padStart(2, '0');
                     const day = String(baseDate.getDate()).padStart(2, '0');
                     const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][baseDate.getDay()];
                     currentDate = `${year}.${month}.${day} / ${dayOfWeek}`;
                 }
             } catch(e) { console.error("날짜 계산 오류:", e); }
        }

        // 섹션 제목 및 리스트 컨테이너 생성
        const titleId = `day-${dayData.day}-title`;
        const listId = `day-${dayData.day}-list`;
        section.innerHTML = `
            <h3 id="${titleId}">day ${dayData.day} - ${currentDate} <span class="edit-link">편집</span></h3>
            <div class="schedule-list" id="${listId}">
                </div>
        `;
        sectionsContainer.appendChild(section);

        // 해당 날짜의 장소 목록 추가
        const listContainer = section.querySelector(`#${listId}`);
        if (listContainer && dayData.items && Array.isArray(dayData.items)) {
             if (dayData.items.length === 0) {
                 listContainer.innerHTML = `<p style="color: #a0a4b8; font-size: 13px; padding-left: 38px;">추가된 장소가 없습니다.</p>`;
             } else {
                dayData.items.forEach((item, itemIndex) => {
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item';
                    const imageUrl = item.image || ''; // 이미지가 없을 경우 빈 문자열
                    const imageTag = imageUrl
                                    ? `<img src="${imageUrl}" alt="${item.name || ''}" class="schedule-item-image" onerror="this.style.display='none'">` // onerror로 이미지 로드 실패 시 숨김
                                    : '';

                    scheduleItem.innerHTML = `
                        <div class="circle">${itemIndex + 1}</div>
                        <div class="schedule-content">
                            <p>${item.name || '장소 이름 없음'}</p>
                            <small>${item.category || ''}${item.category && item.reason ? ' - ' : ''}${item.reason || ''}</small>
                        </div>
                        ${imageTag}
                    `;
                    listContainer.appendChild(scheduleItem);
                });
             }
        } else if (listContainer) {
            listContainer.innerHTML = `<p style="color: #a0a4b8; font-size: 13px; padding-left: 38px;">장소 목록 정보가 없습니다.</p>`;
        }
    });
     // 모든 섹션 생성 후 편집 버튼 리스너 다시 설정
     setupEditButtons();
}


// --- Google Maps 관련 함수 ---
// 이 함수는 Google Maps API 스크립트 로드 완료 시 callback으로 호출됩니다.
function initScheduleMap() {
    console.log("schedule.js의 initScheduleMap 실행");
    const mapElement = document.getElementById('schedule-map');
    if (!mapElement) {
        console.error("ID가 'schedule-map'인 요소를 찾을 수 없습니다.");
        return;
    }

    // 지도가 이미 생성되었다면 중복 실행 방지
    if (scheduleMap) {
        console.warn("initScheduleMap이 중복 호출되었습니다.");
        return;
    }

    // 기본 중심 좌표 (데이터 없을 경우 대비)
    let initialCenter = { lat: 37.5665, lng: 126.9780 }; // 서울
    const planData = window.loadedPlanData; // loadScheduleData에서 전달받은 데이터

    if (planData && planData.days.length > 0 && planData.days[0].items.length > 0 && typeof planData.days[0].items[0].lat === 'number') {
         initialCenter = { lat: planData.days[0].items[0].lat, lng: planData.days[0].items[0].lng };
    } else if (planData && planData.city) { // 도시 이름 기반으로 설정
         switch (planData.city.toLowerCase()) {
             case '도쿄':
             case 'tokyo':
                 initialCenter = { lat: 35.6895, lng: 139.6917 };
                 break;
             case '서울':
             case 'seoul':
                 initialCenter = { lat: 37.5665, lng: 126.9780 };
                 break;
             // 다른 도시 추가...
             default:
                 console.log(`알 수 없는 도시(${planData.city})의 기본 좌표 사용`);
         }
    }
    console.log("지도 초기 중심 좌표:", initialCenter);

    try {
        scheduleMap = new google.maps.Map(mapElement, {
            center: initialCenter,
            zoom: 11, // 적절한 초기 줌 레벨
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true, // 전체화면 버튼은 유용할 수 있음
            zoomControl: true,
            // 어두운 테마 스타일 적용 (result.js와 동일하게)
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
        console.log("Schedule 지도 객체 생성 완료");

        // 로드된 데이터 기반으로 마커 및 경로 추가
        if (planData) {
            console.log("planData 존재, 마커 및 경로 추가 시도");
            addMarkersAndRouteToScheduleMap(planData);
        } else {
            console.warn("planData가 없어 지도에 마커를 추가할 수 없습니다.");
        }

    } catch (error) {
        console.error("Schedule 지도 초기화 중 오류 발생:", error);
        mapElement.textContent = '지도 초기화 오류';
        mapElement.style.color = '#ff6b6b'; // 오류 시 텍스트 색상 변경
    }
}

// 지도에 마커 및 경로 추가 함수
function addMarkersAndRouteToScheduleMap(planData) {
     if (!scheduleMap || !google || !planData) {
         console.warn("지도 객체 또는 planData가 준비되지 않아 마커를 추가할 수 없습니다.");
         return;
     }
     console.log("addMarkersAndRouteToScheduleMap 실행");
     clearScheduleMapElements(); // 기존 마커 및 경로 제거

     const bounds = new google.maps.LatLngBounds();
     let hasValidCoords = false;
     const pathCoordinates = []; // 전체 경로 좌표

     planData.days.forEach(dayData => {
         const dayPath = []; // 일차별 경로 좌표
         dayData.items.forEach((item, itemIndex) => {
              if (typeof item.lat === 'number' && typeof item.lng === 'number') {
                 hasValidCoords = true;
                 const position = { lat: item.lat, lng: item.lng };
                 const marker = new google.maps.Marker({
                     position: position,
                     map: scheduleMap,
                     title: `${dayData.day}일차 ${itemIndex + 1}. ${item.name}`,
                     // 라벨에 날짜+순서 표시
                     label: { text: `${dayData.day}-${itemIndex + 1}`, color: 'white', fontWeight: 'bold', fontSize: '10px' },
                     // 아이콘 커스텀 (선택 사항)
                     // icon: { url: 'path/to/custom_icon.png', scaledSize: new google.maps.Size(25, 25) }
                 });
                 scheduleMarkers.push(marker);
                 bounds.extend(position);
                 dayPath.push(position); // 일차별 경로에 추가

                // 정보창 추가
                 const infoContent = `
                     <div style="color: #333;">
                         <strong>${dayData.day}-${itemIndex + 1}. ${item.name || ''}</strong><br>
                         ${item.category ? `카테고리: ${item.category}<br>` : ''}
                         ${item.reason ? `추천 이유: ${item.reason}` : ''}
                         ${item.image ? `<br><img src="${item.image}" alt="${item.name}" style="width:100px; margin-top:5px;" onerror="this.style.display='none'">` : ''}
                     </div>`;
                 const infowindow = new google.maps.InfoWindow({ content: infoContent });
                 marker.addListener('click', () => {
                     infowindow.open(scheduleMap, marker);
                 });

              } else {
                  console.warn(`'${item.name}' 항목에 유효한 위경도 정보가 없습니다.`);
              }
         });
         // 일차별 경로 좌표를 전체 경로에 합침
         pathCoordinates.push(...dayPath);
     });
     console.log(`총 ${scheduleMarkers.length}개의 마커 추가됨`);

     // 전체 경로 Polyline 그리기
     if (pathCoordinates.length > 1) {
         if (schedulePolyline) schedulePolyline.setMap(null); // 기존 경로 제거
         schedulePolyline = new google.maps.Polyline({
             path: pathCoordinates,
             geodesic: true,
             strokeColor: '#FF0000', // 경로 색상 (예: 빨간색)
             strokeOpacity: 0.6,
             strokeWeight: 4,
             // 화살표 아이콘 추가 (선택 사항)
             icons: [{
                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                offset: '100%',
                repeat: '100px' // 100px 간격으로 화살표 표시
             }]
         });
         schedulePolyline.setMap(scheduleMap);
         console.log("경로 Polyline 추가됨");
     } else {
         console.log("경로를 그릴 좌표가 부족합니다.");
     }

     // 모든 마커가 보이도록 지도 범위 조정
     if (hasValidCoords && scheduleMarkers.length > 0) {
          if (scheduleMarkers.length > 1) {
               scheduleMap.fitBounds(bounds, { top: 50, bottom: 50, left: 30, right: 30 }); // 패딩 조절
               console.log("지도 범위를 마커에 맞춤");
          } else {
               scheduleMap.setCenter(bounds.getCenter());
               scheduleMap.setZoom(15); // 마커 하나일 때 고정 줌
               console.log("지도 중심을 단일 마커로 이동");
          }
          // fitBounds 후 최소 줌 레벨 설정 (선택 사항)
          google.maps.event.addListenerOnce(scheduleMap, 'idle', () => {
            const minZoom = 10; // 최소 줌 레벨
            if (scheduleMap.getZoom() < minZoom) {
              scheduleMap.setZoom(minZoom);
              console.log(`줌 레벨이 너무 낮아 ${minZoom}으로 조정`);
            }
          });
     } else {
          console.warn("지도에 표시할 유효한 좌표가 없습니다. 범위 조정 안 함.");
          // 지도를 기본 중심으로 유지하거나 다른 처리
     }
}

 // 기존 마커 및 경로 제거 함수
 function clearScheduleMapElements() {
     console.log("지도 요소 제거 시도");
     scheduleMarkers.forEach(marker => marker.setMap(null));
     scheduleMarkers = [];
     if (schedulePolyline) {
         schedulePolyline.setMap(null);
         schedulePolyline = null;
         console.log("Polyline 제거됨");
     }
     console.log("지도 요소 제거 완료");
 }