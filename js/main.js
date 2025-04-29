// 사용자 이름 표시
const username = "인봉";
document.getElementById("username").innerText = username;

// 카드 슬라이더 드래그 기능
const slider = document.querySelector(".card-list-wrapper");
let isDragging = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
  slider.style.cursor = "grabbing";
});

slider.addEventListener("mouseleave", () => {
  isDragging = false;
  slider.style.cursor = "grab";
});

slider.addEventListener("mouseup", () => {
  isDragging = false;
  slider.style.cursor = "grab";
});

slider.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5;
  slider.scrollLeft = scrollLeft - walk;
});

slider.addEventListener("mouseenter", () => {
  slider.style.cursor = "grab";
});
