document.addEventListener("DOMContentLoaded", () => {
    const reviewList = document.getElementById("review-list");
    const modal = document.getElementById("review-modal");
    const modalImg = document.getElementById("modal-img");
    const modalText = document.getElementById("modal-text");
    const modalMeta = document.getElementById("modal-meta");
  
    const writeModal = document.getElementById("write-modal");
    const nameInput = document.getElementById("write-name");
    const placeInput = document.getElementById("write-place");
    const textInput = document.getElementById("write-text");
    const imgInput = document.getElementById("write-img");
  
    if (!reviewList || !Array.isArray(reviews)) return;
  
    // 후기 렌더링 함수
    function renderReviewCard(review) {
      const item = document.createElement("div");
      item.className = "review-item";
      item.innerHTML = `
        <img src="${review.img}" alt="후기 이미지" />
        <div class="review-content">
          <div class="text">${review.text}</div>
          <div class="meta">- ${review.name} · ${review.place}</div>
        </div>
      `;
  
      // 클릭 시 보기 모달 열기 (드래그 구분 포함)
      let isDragging = false;
      let dragStartY = 0;
  
      item.addEventListener("mousedown", (e) => {
        isDragging = false;
        dragStartY = e.pageY;
      });
  
      item.addEventListener("mousemove", (e) => {
        if (Math.abs(e.pageY - dragStartY) > 5) {
          isDragging = true;
        }
      });
  
      item.addEventListener("mouseup", () => {
        if (!isDragging) {
          openReviewModal(review);
        }
      });
  
      reviewList.appendChild(item);
    }
  
    // 초기 카드 렌더링
    reviews.forEach(renderReviewCard);
  
    // 후기 보기 모달 열기
    function openReviewModal(review) {
      modalImg.src = review.img;
      modalText.innerText = review.text;
      modalMeta.innerText = `- ${review.name} · ${review.place}`;
      modal.classList.add("active");
    }
  
    // 후기 보기 모달 닫기
    function closeReviewModal() {
      modal.classList.remove("active");
    }
  
    // 작성 모달 열기 (버튼에서 호출)
    window.openWriteModal = function () {
      writeModal.classList.add("active");
    };
  
    // 작성 모달 닫기
    window.closeWriteModal = function () {
      writeModal.classList.remove("active");
      nameInput.value = "";
      placeInput.value = "";
      textInput.value = "";
      imgInput.value = "";
    };
  
    // 작성 제출 처리
    window.submitReview = function () {
      const name = nameInput.value.trim();
      const place = placeInput.value.trim();
      const text = textInput.value.trim();
      const imgFile = imgInput.files[0];
  
      if (!name || !place || !text || !imgFile) {
        alert("모든 항목을 입력해주세요.");
        return;
      }
  
      const reader = new FileReader();
      reader.onload = function (e) {
        const newReview = {
          name,
          place,
          text,
          img: e.target.result,
        };
  
        reviews.unshift(newReview); // 앞에 추가
        renderReviewCard(newReview);
        closeWriteModal();
      };
      reader.readAsDataURL(imgFile); // 이미지 base64로 변환
    };
  
    // 모든 모달 닫기: 오버레이 클릭 시
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", () => {
        closeReviewModal();
        closeWriteModal();
      });
    });
  
    // 후기 보기 모달 닫기 버튼 처리 (명확히)
    const reviewCloseBtn = document.querySelector("#review-modal button");
    if (reviewCloseBtn) {
      reviewCloseBtn.addEventListener("click", closeReviewModal);
    }
  
    // 작성 모달 닫기 버튼 처리
    const writeCloseBtns = document.querySelectorAll("#write-modal button");
    if (writeCloseBtns.length > 1) {
      writeCloseBtns[1].addEventListener("click", closeWriteModal); // 두 번째 버튼 = 닫기
    }
  
    // 세로 드래그 기능 (리스트 전체)
    const scrollTarget = document.querySelector(".review-list");
    let isDraggingScroll = false;
    let startY, scrollTop;
  
    scrollTarget.addEventListener("mousedown", (e) => {
      isDraggingScroll = true;
      startY = e.pageY - scrollTarget.offsetTop;
      scrollTop = scrollTarget.scrollTop;
    });
  
    scrollTarget.addEventListener("mouseleave", () => {
      isDraggingScroll = false;
    });
  
    scrollTarget.addEventListener("mouseup", () => {
      isDraggingScroll = false;
    });
  
    scrollTarget.addEventListener("mousemove", (e) => {
      if (!isDraggingScroll) return;
      e.preventDefault();
      const y = e.pageY - scrollTarget.offsetTop;
      const walk = y - startY;
      scrollTarget.scrollTop = scrollTop - walk;
    });
  });
  