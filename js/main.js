// 사용자 이름 표시
const username = "인봉";
document.getElementById("username").innerText = username;

// 🔹 상단 여행지 카드 슬라이드 드래그
const slider = document.querySelector(".card-list-wrapper");
let isDragging = false;
let startX, scrollLeft;

slider.addEventListener("mousedown", (e) => {
  isDragging = true;
  slider.classList.add("dragging");
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});

slider.addEventListener("mouseleave", () => {
  isDragging = false;
  slider.classList.remove("dragging");
});

slider.addEventListener("mouseup", () => {
  isDragging = false;
  slider.classList.remove("dragging");
});

slider.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = x - startX;
  slider.scrollLeft = scrollLeft - walk;
});

// 🔹 후기 카드 슬라이드 렌더링 (3개)
const reviewContainer = document.getElementById("main-review-list");

if (reviewContainer && Array.isArray(reviews)) {
  reviews.slice(0, 3).forEach((review) => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <img src="${review.img}" alt="${review.place} 후기" />
      <div class="review-text">
        ${review.text}<br />
        <span>- ${review.name} · ${review.place}</span>
      </div>
    `;
    reviewContainer.appendChild(card);
  });
}

// 🔹 후기 카드 슬라이드 드래그
const reviewSlider = document.querySelector(".review-list-wrapper");
let reviewDragging = false;
let reviewStartX, reviewScrollLeft;

reviewSlider.addEventListener("mousedown", (e) => {
  reviewDragging = true;
  reviewStartX = e.pageX - reviewSlider.offsetLeft;
  reviewScrollLeft = reviewSlider.scrollLeft;
});

reviewSlider.addEventListener("mouseleave", () => {
  reviewDragging = false;
});

reviewSlider.addEventListener("mouseup", () => {
  reviewDragging = false;
});

reviewSlider.addEventListener("mousemove", (e) => {
  if (!reviewDragging) return;
  e.preventDefault();
  const x = e.pageX - reviewSlider.offsetLeft;
  const walk = x - reviewStartX;
  reviewSlider.scrollLeft = reviewScrollLeft - walk;
});
