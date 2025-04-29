// 사용자 이름 표시
const username = "인봉";
document.getElementById("username").innerText = username;

// 직접 드래그 기능
const slider = document.querySelector(".card-list-wrapper");
let isDragging = false;
let startX;
let scrollLeft;

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
