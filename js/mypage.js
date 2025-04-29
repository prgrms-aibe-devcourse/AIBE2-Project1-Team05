window.onload = function() {
    const userEmail = getLoggedInUser();
    const userEmailBox = document.getElementById('user-email');
  
    if (!userEmail) {
      alert("로그인이 필요한 서비스입니다.");
      location.href = 'login.html';
      return;
    }
  
    userEmailBox.textContent = `로그인한 이메일: ${userEmail}`;
  
    loadDiaries();
    loadReviews();
  };
  
  function loadDiaries() {
    const diaryList = document.getElementById('diary-list');
    const diaries = JSON.parse(localStorage.getItem('diaryPhotos') || "[]");
  
    if (diaries.length === 0) {
      diaryList.innerHTML = "<li>작성한 다이어리가 없습니다.</li>";
      return;
    }
  
    diaries.forEach((diary, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${idx + 1}.</strong> 📍위치: (${diary.lat.toFixed(3)}, ${diary.lng.toFixed(3)})`;
      diaryList.appendChild(li);
    });
  }
  
  function loadReviews() {
    const reviewList = document.getElementById('review-list');
    const reviews = JSON.parse(localStorage.getItem('reviews') || "[]");
  
    if (reviews.length === 0) {
      reviewList.innerHTML = "<li>작성한 후기가 없습니다.</li>";
      return;
    }
  
    reviews.forEach((review, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${idx + 1}.</strong> ${review.text} (⭐ ${review.rating}점)`;
      reviewList.appendChild(li);
    });
  }
  