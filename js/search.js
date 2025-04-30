document.addEventListener("DOMContentLoaded", () => {
    const data = [
      {
        title: "도쿄 벚꽃 여행",
        type: "후기",
        date: "2025-04-28",
        description:
          "벚꽃이 만개한 아사쿠사를 걷다 보면 시간이 멈춘 듯한 기분이 든다.",
        image: "./assets/images/tokyo1.jpg",
      },
      {
        title: "하와이 가족 여행",
        type: "후기",
        date: "2025-05-10",
        description: "하와이의 햇살과 바다는 정말 최고였다.",
        image: "./assets/images/hawaii1.jpg",
      },
      {
        title: "베트남 다낭 여행지 소개",
        type: "여행지",
        date: "2025-04-22",
        description: "미케비치, 한강 야경, 맛있는 분짜까지 모든 것이 다 있다!",
        image: "./assets/images/vietnam.jpg",
      },
    ];

    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const resultContainer = document.getElementById("resultContainer");
    const searchIcon = document.querySelector(".search-icon");

    function renderResults(results) {
      resultContainer.innerHTML = "";
      if (results.length === 0) {
        resultContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
      }
      results.forEach((item) => {
        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `
          <img src="${item.image}" alt="${item.title}" />
          <div class="result-content">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </div>
        `;
        resultContainer.appendChild(card);
      });
    }

    function filterResults() {
      const keyword = searchInput.value.trim().toLowerCase();
      const selectedType = categoryFilter.value;
      const fromDate = startDate.value;
      const toDate = endDate.value;

      const filtered = data.filter((item) => {
        const matchesKeyword = item.title.toLowerCase().includes(keyword);
        const matchesType = selectedType === "전체" || item.type === selectedType;
        const matchesDate =
          (!fromDate || item.date >= fromDate) &&
          (!toDate || item.date <= toDate);
        return matchesKeyword && matchesType && matchesDate;
      });

      renderResults(filtered);
    }

    
    function filterAndRender() {
        const keyword = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const start = startDate.value;
        const end = endDate.value;
    
        const filtered = searchData.filter(item => {
          const matchKeyword = item.title.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword);
          const matchCategory = category === "전체" || item.type === category;
          const matchDate =
            (!start || item.date >= start) &&
            (!end || item.date <= end);
          return matchKeyword && matchCategory && matchDate;
        });
    
        renderResults(filtered);
      }
    
      function renderResults(list) {
        resultContainer.innerHTML = "";
        if (list.length === 0) {
          resultContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
          return;
        }
    
        list.forEach(item => {
          const card = document.createElement("div");
          card.className = "result-card";
          card.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
            <div class="result-content">
              <h4>${item.title}</h4>
              <p>${item.description}</p>
            </div>`;
          resultContainer.appendChild(card);
        });
      }
    
      // 🔍 아이콘 클릭 시 검색 실행
      searchIcon.addEventListener("click", filterAndRender);
    
      // Enter 키로도 검색 가능
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") filterAndRender();
      });
    searchInput.addEventListener("input", filterResults);
    categoryFilter.addEventListener("change", filterResults);
    startDate.addEventListener("change", filterResults);
    endDate.addEventListener("change", filterResults);

    renderResults(data);
  });