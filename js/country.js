const countries = ['한국', '일본', '태국', '프랑스', '미국'];

function selectCountry(country) {
  localStorage.setItem('selectedCountry', country);
  location.href = 'theme.html'; // 다음 화면으로 이동
}

function selectRandom() {
  const randomIndex = Math.floor(Math.random() * countries.length);
  const randomCountry = countries[randomIndex];
  selectCountry(randomCountry);
}
