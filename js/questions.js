// MBTI 스타일 2지선다 질문 (각 지표당 2문항씩)
const questions = [
    { dimension: "EI", text: "여행 중 사람들과 어울리는 걸 좋아하시나요?", a: "예, 활발하게 어울려요", b: "아니요, 혼자가 편해요" },
    { dimension: "EI", text: "즉흥적인 여행을 좋아하시나요?", a: "예, 자유로운 게 좋아요", b: "아니요, 계획된 여행이 좋아요" },
  
    { dimension: "NS", text: "장소를 선택할 때 어떤 기준을 중요시하나요?", a: "감성적이고 독특한 곳", b: "실제로 유명한 장소" },
    { dimension: "NS", text: "새로운 체험을 좋아하시나요?", a: "네, 새로움을 추구해요", b: "아니요, 익숙한 게 좋아요" },
  
    { dimension: "TF", text: "여행 일정은 어떻게 구성하나요?", a: "기분이나 감성 위주", b: "효율과 논리 중심" },
    { dimension: "TF", text: "예산 조정이 필요하다면?", a: "감성적인 선택을 해요", b: "가성비를 따져요" },
  
    { dimension: "PJ", text: "일정을 미리 계획하시나요?", a: "아니요, 그때그때 움직여요", b: "네, 상세하게 짜요" },
    { dimension: "PJ", text: "계획 변경이 생기면?", a: "괜찮아요, 융통성 있게 대응해요", b: "불편해요, 혼란스러워요" }
  ];
  
  let current = 0;
  let mbtiScores = { E: 0, I: 0, N: 0, S: 0, T: 0, F: 0, P: 0, J: 0 };
  
  const questionText = document.getElementById("question-text");
  const btnA = document.getElementById("btn-a");
  const btnB = document.getElementById("btn-b");
  
  function renderQuestion() {
    const q = questions[current];
    questionText.textContent = q.text;
    btnA.textContent = q.a;
    btnB.textContent = q.b;
  }
  
  function saveAnswer(choice) {
    const { dimension } = questions[current];
    const trait = choice === "A" ? dimension[0] : dimension[1];
    mbtiScores[trait]++;
    current++;
  
    if (current >= questions.length) {
      const result = getMBTIResult();
      localStorage.setItem("mbtiResult", result);
      document.getElementById("question-box").style.display = "none";
      document.getElementById("result-box").style.display = "block";
      requestGemini(result); // ai.js 함수 호출
    } else {
      renderQuestion();
    }
  }
  
  function getMBTIResult() {
    return (
      (mbtiScores.E >= mbtiScores.I ? "E" : "I") +
      (mbtiScores.N >= mbtiScores.S ? "N" : "S") +
      (mbtiScores.F >= mbtiScores.T ? "F" : "T") +
      (mbtiScores.P >= mbtiScores.J ? "P" : "J")
    );
  }
  
  btnA.onclick = () => saveAnswer("A");
  btnB.onclick = () => saveAnswer("B");
  
  renderQuestion();
  