function loadBottomNav() {

    fetch('./components/bottom-nav.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('bottom-nav-container').innerHTML = data;
        })
        .catch(error => console.error('하단 네비게이션 바 로드 실패:', error));
} 