const reviewForm = document.getElementById('reviewForm');

reviewForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const placeName = document.getElementById('place-name').value.trim();
  const rating = document.getElementById('rating').value;
  const reviewText = document.getElementById('review-text').value.trim();

  if (!placeName || !rating || !reviewText) {
    alert("모든 항목을 입력해주세요!");
    return;
  }

  const review = {
    place: placeName,
    rating: rating,
    text: reviewText
  };

  const reviews = JSON.parse(localStorage.getItem('reviews') || "[]");
  reviews.push(review);

  localStorage.setItem('reviews', JSON.stringify(reviews));

  alert("후기가 저장되었습니다!");
  location.href = 'mypage.html'; // 저장 후 마이페이지로 이동
});
