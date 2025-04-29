document.addEventListener("DOMContentLoaded", () => {
  const dayTabs = document.querySelectorAll(".day-tab");
  const timelines = document.querySelectorAll(".timeline");

  dayTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedDay = tab.dataset.day;
      dayTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      timelines.forEach((tl) => {
        tl.style.display = tl.dataset.day === selectedDay ? "block" : "none";
      });
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get("planId");

  console.log("현재 불러온 planId:", planId);
});
