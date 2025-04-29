
const questions = [
    {
      text: "여행지에서는 어떤 활동을 선호하시나요?",
      a: "자연에서 여유롭게 산책하기",
      b: "도시에서 핫플 탐방하기"
    },
    {
      text: "숙소 선택 시 어떤 기준이 중요하신가요?",
      a: "조용하고 한적한 분위기",
      b: "접근성과 주변 시설"
    },
    {
      text: "여행 사진은 어떤 걸 더 많이 찍으시나요?",
      a: "풍경, 자연, 하늘",
      b: "음식, 거리, 건물"
    }
  ];
  
  let current = 0;
  let answers = [];
  
  const questionText = document.getElementById("question-text");
  const btnA = document.getElementById("btn-a");
  const btnB = document.getElementById("btn-b");
  const resultBox = document.getElementById("result-box");
  const aiResult = document.getElementById("ai-result");
  
  function renderQuestion() {
    const q = questions[current];
    questionText.textContent = q.text;
    btnA.textContent = q.a;
    btnB.textContent = q.b;
  }
  
  btnA.onclick = () => {
    answers.push("A");
    next();
  };
  
  btnB.onclick = () => {
    answers.push("B");
    next();
  };
  
  function next() {
    current++;
    if (current < questions.length) {
      renderQuestion();
    } else {
      sendToGemini();
    }
  }
  
  function sendToGemini() {
    document.getElementById("question-box").style.display = "none";
    resultBox.style.display = "block";
  
    const prompt = `
  다음과 같은 성향을 가진 사용자에게 2박 3일 국내 여행 일정을 추천해주세요.
  
  
  [질문 응답]
  ${answers.map((ans, i) => `Q${i+1}: ${questions[i][ans.toLowerCase()]}`).join('\n')}
  
  [요청]
  - 여행지는 국내로 한정해주세요.
  - 하루당 2~3곳 여행지를 추천해주세요.
  - 표 형태로 요약해주세요.
  `;
  
    fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })
      .then(res => res.json())
      .then(data => {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "추천 결과를 불러올 수 없습니다.";
        aiResult.textContent = text;
      })
      .catch(err => {
        console.error(err);
        aiResult.textContent = "에러가 발생했습니다.";
      });
  }
  
  // 첫 질문 표시
  renderQuestion();
  