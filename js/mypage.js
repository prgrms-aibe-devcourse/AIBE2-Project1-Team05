// 탭 전환 (갤러리/일정)
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

  // more 메뉴 토글
  const moreBtn = document.querySelector(".more-btn");
  const moreMenu = document.querySelector(".more-menu");

  moreBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    moreMenu.style.display =
      moreMenu.style.display === "block" ? "none" : "block";
  });

  window.addEventListener("click", () => {
    moreMenu.style.display = "none";
  });

  // 갤러리 다이어리 모달 슬라이드
  const photos = document.querySelectorAll(".gallery-photo");
  const diaryModal = document.getElementById("diaryModal");
  const closeDiary = document.querySelector(".close-diary");
  const slides = document.querySelectorAll(".slide-photo");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  let currentSlide = 0;

  function showSlide(index) {
    slides.forEach((slide) => slide.classList.remove("active"));
    slides[index].classList.add("active");
    currentSlide = index;
  }

  photos.forEach((photo) => {
    photo.addEventListener("click", () => {
      diaryModal.classList.add("show");
    });
  });

  closeDiary?.addEventListener("click", () => {
    diaryModal.classList.remove("show");
  });

  prevBtn?.addEventListener("click", () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  });

  nextBtn?.addEventListener("click", () => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  });

  // 다이어리 편집/저장/취소
  const diaryText = document.getElementById("diaryText");
  const editBtn = document.getElementById("editBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  let originalValue = diaryText?.value;
  let isEditing = false;

  editBtn?.addEventListener("click", () => {
    isEditing = true;
    diaryText.readOnly = false;
    diaryText.focus();
    editBtn.style.display = "none";
    cancelBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
  });

  diaryText?.addEventListener("input", () => {
    if (isEditing && diaryText.value !== originalValue) {
      saveBtn.style.display = "inline-block";
    } else {
      saveBtn.style.display = "none";
    }
  });

  saveBtn?.addEventListener("click", () => {
    originalValue = diaryText.value;
    diaryText.readOnly = true;
    isEditing = false;
    editBtn.style.display = "inline-block";
    cancelBtn.style.display = "none";
    saveBtn.style.display = "none";
    alert("저장되었습니다!");
  });

  cancelBtn?.addEventListener("click", () => {
    diaryText.value = originalValue;
    diaryText.readOnly = true;
    isEditing = false;
    editBtn.style.display = "inline-block";
    cancelBtn.style.display = "none";
    saveBtn.style.display = "none";
  });

  const modal = document.getElementById("diaryModal");
  const openModalBtn = document.getElementById("openModal");
  const closeModalBtn = document.querySelector(".close-diary");

  // 열기
  openModalBtn?.addEventListener("click", () => {
    modal.classList.add("show");
  });

  // 닫기
  closeModalBtn?.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // 바깥 클릭시 닫기
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});
