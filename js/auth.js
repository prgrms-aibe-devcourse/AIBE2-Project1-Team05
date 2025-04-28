// 회원가입 처리
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    // 기존 회원 데이터 가져오기
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[email]) {
      alert("이미 존재하는 이메일입니다. 로그인해주세요.");
      location.href = 'login.html';
      return;
    }

    // 새로운 회원 저장
    users[email] = { password };
    localStorage.setItem('users', JSON.stringify(users));

    alert("회원가입이 완료되었습니다. 로그인해주세요!");
    location.href = 'login.html';
  });
}

// 로그인 처리
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (!users[email]) {
      alert("존재하지 않는 이메일입니다. 회원가입을 먼저 진행해주세요.");
      return;
    }

    if (users[email].password !== password) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 로그인 성공
    localStorage.setItem('loggedInUser', email);
    alert("로그인 성공!");
    location.href = 'index.html'; // 로그인 성공 후 메인으로 이동
  });
}

// 로그인 상태 확인 함수 (추후 마이페이지 등에 사용할 수 있음)
function getLoggedInUser() {
  return localStorage.getItem('loggedInUser');
}

// 로그아웃 기능 (필요시 사용)
function logout() {
  localStorage.removeItem('loggedInUser');
  alert("로그아웃 되었습니다.");
  location.href = 'index.html';
}
