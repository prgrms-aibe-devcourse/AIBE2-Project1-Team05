// mypage.js 전체

// 예시 다이어리 데이터
const diaryList = [
  {
    id: "101",
    title: "도쿄 벚꽃 여행",
    period: "2025.04.26 ~ 2025.05.07",
    route: "김포공항 → 도쿄공항 → 숙소 → 디즈니랜드 → 유니버설",
    diaryText: "벚꽃이 정말 예뻤다! 다시 가고 싶다.",
    photos: [
      "./assets/images/seoul.jpg",
      "./assets/images/vietnam.jpg",
      "./assets/images/seoul.jpg"
    ]
  },
  {
    id: "102",
    title: "오사카 먹방 투어",
    period: "2025.05.10 ~ 2025.05.14",
    route: "오사카성 → 도톤보리 → 유니버설 스튜디오",
    diaryText: "오사카에서 먹은 타코야키는 잊지 못할 맛이었다.",
    photos: [
      "./assets/images/vietnam.jpg",
      "./assets/images/seoul.jpg",
      "./assets/images/vietnam.jpg"
    ]
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const gridIcon = document.querySelector(".fa-th");
  const calendarIcon = document.querySelector(".fa-calendar-alt");
  const galleryTab = document.querySelector(".gallery-tab");
  const calendarTab = document.querySelector(".calendar-tab");

  gridIcon.addEventListener("click", () => {
    galleryTab.style.display = "grid";
    calendarTab.style.display = "none";
    gridIcon.classList.add("active");
    calendarIcon.classList.remove("active");
  });

  calendarIcon.addEventListener("click", () => {
    galleryTab.style.display = "none";
    calendarTab.style.display = "block";
    gridIcon.classList.remove("active");
    calendarIcon.classList.add("active");
  });

  const galleryContainer = document.querySelector(".photo-grid");
  diaryList.forEach((diary) => {
    const img = document.createElement("img");
    img.src = diary.photos[0];
    img.alt = diary.title;
    img.className = "gallery-photo";
    img.dataset.diaryId = diary.id;
    galleryContainer.appendChild(img);
  });

  // ➕ 다이어리 추가 버튼
  const addButton = document.createElement("div");
  addButton.className = "add-diary-tile";
  addButton.innerHTML = "<span>+</span>";
  addButton.addEventListener("click", () => {
    alert("새 다이어리 작성 화면으로 이동 (또는 모달 표시)");
    // window.location.href = 'new-diary.html';
  });
  galleryContainer.appendChild(addButton);

  const diaryModal = document.getElementById("diaryModal");
  const closeDiary = document.querySelector(".close-diary");
  galleryContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("gallery-photo")) {
      const diaryId = e.target.dataset.diaryId;
      const selected = diaryList.find(d => d.id === diaryId);
      if (selected) openDiaryModal(selected);
    }
  });

  closeDiary.addEventListener("click", () => {
    diaryModal.classList.remove("show");
  });

  diaryModal.addEventListener("click", (e) => {
    if (e.target === diaryModal) {
      diaryModal.classList.remove("show");
    }
  });

  function openDiaryModal(data) {
    document.querySelector(".diary-title").textContent = data.title;
    document.querySelector(".diary-period").textContent = data.period;
    document.querySelector(".route").textContent = data.route;

    const diaryText = document.getElementById("diaryText");
    diaryText.value = data.diaryText;
    originalValue = data.diaryText;

    const photoSlider = document.querySelector(".photo-slider");
    const controls = document.querySelector(".slide-controls");
    photoSlider.innerHTML = "";
    data.photos.forEach((url, i) => {
      const img = document.createElement("img");
      img.src = url;
      img.className = "slide-photo";
      if (i === 0) img.classList.add("active");
      photoSlider.appendChild(img);
    });
    photoSlider.appendChild(controls);
    diaryModal.classList.add("show");
  }

  const calendarGrid = document.querySelector(".calendar-grid");
  diaryList.forEach(plan => {
    const card = document.createElement("div");
    card.className = "plan-card";
    card.dataset.planId = plan.id;
    card.innerHTML = `
      <img src="${plan.photos[0]}" alt="아이콘" />
      <div>
        <strong>${plan.title}</strong>
        <p>${plan.period}</p>
      </div>
      <i class="fas fa-ellipsis-h more-btn"></i>
      <div class="more-menu" style="display: none">
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `plan-detail.html?planId=${plan.id}`;
    });
    calendarGrid.appendChild(card);
  });

  // ✏️ 수정/저장/취소 기능
  const diaryText = document.getElementById("diaryText");
  const editBtn = document.getElementById("editBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  let originalValue = "";

  editBtn?.addEventListener("click", () => {
    diaryText.readOnly = false;
    diaryText.focus();
    originalValue = diaryText.value;
    editBtn.style.display = "none";
    cancelBtn.style.display = "inline-block";
  });

  diaryText?.addEventListener("input", () => {
    if (diaryText.value !== originalValue) {
      saveBtn.style.display = "inline-block";
    } else {
      saveBtn.style.display = "none";
    }
  });

  saveBtn?.addEventListener("click", () => {
    diaryText.readOnly = true;
    editBtn.style.display = "inline-block";
    cancelBtn.style.display = "none";
    saveBtn.style.display = "none";
    alert("저장되었습니다!");
  });

  cancelBtn?.addEventListener("click", () => {
    diaryText.value = originalValue;
    diaryText.readOnly = true;
    editBtn.style.display = "inline-block";
    cancelBtn.style.display = "none";
    saveBtn.style.display = "none";
  });
  const profileHeader = document.querySelector('.profile-header');
  if (profileHeader) {
    setTimeout(() => {
      profileHeader.classList.add('show');
    }, 100); // 약간의 딜레이를 줘서 더 부드럽게
  }
});
