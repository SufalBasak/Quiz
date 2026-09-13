(function () {
  "use strict";

  var raw = localStorage.getItem("exam_result");
  if (!raw) {
    window.location.href = "index.html";
    return;
  }
  var result = JSON.parse(raw);

  document.getElementById("resultExamName").textContent = result.examName;
  document.getElementById("resultCandidateName").textContent = result.candidate.name;
  document.getElementById("resultScore").textContent = result.scoreObtained;
  document.getElementById("resultTotal").textContent = "/ " + result.totalMarks;
  document.getElementById("statCorrect").textContent = result.correct;
  document.getElementById("statIncorrect").textContent = result.incorrect;
  document.getElementById("statUnansweredR").textContent = result.unanswered;
  document.getElementById("statAccuracy").textContent = result.accuracy + "%";

  var reviewWrap = document.getElementById("reviewWrap");
  var reviewList = document.getElementById("reviewList");
  var reviewBtn = document.getElementById("reviewBtn");
  var letters = ["A", "B", "C", "D", "E", "F"];
  var built = false;

  reviewBtn.addEventListener("click", function () {
    if (!built) {
      buildReview();
      built = true;
    }
    reviewWrap.classList.toggle("open");
    if (reviewWrap.classList.contains("open")) {
      reviewWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  function buildReview() {
    result.items.forEach(function (item, idx) {
      var status = item.selected == null ? "unanswered" : (item.isCorrect ? "correct" : "incorrect");
      var statusLabel = status === "unanswered" ? "Unanswered" : (status === "correct" ? "Correct" : "Incorrect");

      var yourAnswerText = item.selected == null ? "Not Answered" : letters[item.selected] + ". " + item.options[item.selected];
      var correctAnswerText = letters[item.correctAnswer] + ". " + item.options[item.correctAnswer];

      var div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML =
        '<div class="review-item-top">' +
          '<h4>Question ' + (idx + 1) + (item.year ? " · " + item.year : "") + '</h4>' +
          '<span class="status-pill ' + status + '">' + statusLabel + '</span>' +
        '</div>' +
        '<div class="q-text">' + escapeHtml(item.question) + '</div>' +
        '<div class="review-answers">' +
          '<div class="ans-block your-answer"><div class="ans-label">Your Answer</div><div class="ans-value ' + (status === "unanswered" ? "" : (item.isCorrect ? "right" : "wrong")) + '">' + escapeHtml(yourAnswerText) + '</div></div>' +
          '<div class="ans-block correct-answer"><div class="ans-label">Correct Answer</div><div class="ans-value">' + escapeHtml(correctAnswerText) + '</div></div>' +
        '</div>' +
        (item.explanation ? '<div class="review-explanation">' + escapeHtml(item.explanation) + '</div>' : '');
      reviewList.appendChild(div);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
