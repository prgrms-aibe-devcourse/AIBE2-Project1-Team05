// mypage.js 전체

// 예시 다이어리 데이터
const diaryList = [
  {
    id: "101",
    title: "도쿄 여행",
    period: "2025.04.28 ~ 2025.04.29",
    route: "나리타 국제공항 → 아사쿠사 → 아사쿠사 규카츠",
    diaryText: "벚꽃이 정말 예뻤다! 다시 가고 싶다.",
    photos: [
      "./assets/images/tokyo1.jpg",
      "./assets/images/tokyo2.jpg",
      "./assets/images/tokyo3.jpg"
    ]
  },
  {
    id: "102",
    title: "하와이 가족 여행",
    period: "2025.05.10 ~ 2025.05.14",
    route: "호놀룰루 공항 → 와이키키 해변 → 다이아몬드 헤드 → 알라모아나 쇼핑센터",
    diaryText: "하와이의 햇살과 바다는 정말 최고였다. 가족들과의 소중한 시간이었어.",
    photos: [
      "./assets/images/hawaii1.jpg",
      "./assets/images/hawaii2.jpg",
      "./assets/images/hawaii3.jpg"
    ]
  }  
];
let currentSlide = 0;

function showSlide(index) {
  const slides = document.querySelectorAll(".slide-photo");
  if (!slides.length) return;

  slides.forEach((slide) => slide.classList.remove("active"));
  slides[index].classList.add("active");
  currentSlide = index;
}

document.addEventListener("DOMContentLoaded", () => {
  const gridIcon = document.querySelector(".fa-th");
  const calendarIcon = document.querySelector(".fa-calendar-alt");
  const galleryTab = document.querySelector(".gallery-tab");
  const calendarTab = document.querySelector(".calendar-tab");

  document.querySelector(".prev-btn")?.addEventListener("click", () => {
    const slides = document.querySelectorAll(".slide-photo");
    if (slides.length === 0) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  });
  
  document.querySelector(".next-btn")?.addEventListener("click", () => {
    const slides = document.querySelectorAll(".slide-photo");
    if (slides.length === 0) return;
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  });
  

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
    document.getElementById("newDiaryModal").classList.add("show");
  });
  galleryContainer.appendChild(addButton);

  const newDiaryModal = document.getElementById("newDiaryModal");
const closeNewDiary = document.getElementById("closeNewDiary");

closeNewDiary.addEventListener("click", () => {
  newDiaryModal.classList.remove("show");
});

newDiaryModal.addEventListener("click", (e) => {
  if (e.target === newDiaryModal) {
    newDiaryModal.classList.remove("show");
  }
});

  

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
      window.location.href = `schedule.html`;
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


document.addEventListener("DOMContentLoaded", () => {
  const editBtn = document.querySelector(".edit-profile-btn");
  const modal = document.getElementById("editProfileModal");
  const closeBtn = document.querySelector(".close-profile");
  const saveBtn = document.getElementById("saveProfileBtn");

  const nicknameDisplay = document.querySelector(".nickname");
  const descriptionDisplay = document.querySelector(".description");
  const profileImage = document.getElementById("profileImage");

  const nicknameInput = document.getElementById("editNickname");
  const descriptionInput = document.getElementById("editDescription");
  const imageInput = document.getElementById("imageInput");
  const previewImage = document.getElementById("previewImage");

  // 열기
  editBtn.addEventListener("click", () => {
    nicknameInput.value = nicknameDisplay.textContent;
    descriptionInput.value = descriptionDisplay.textContent;
    previewImage.src = profileImage.src;
    modal.classList.add("show");
    console.log("sdfsdf")
  });

  // 닫기
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });

  // 이미지 업로드 미리보기
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        previewImage.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // 저장
  saveBtn.addEventListener("click", () => {
    nicknameDisplay.textContent = nicknameInput.value;
    descriptionDisplay.textContent = descriptionInput.value;
    profileImage.src = previewImage.src;
    modal.classList.remove("show");
  });
});
