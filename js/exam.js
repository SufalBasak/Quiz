// Exam Controller — shared MCQ examination engine for both the regular
// exam (data/questions.json) and PYQ exam (data/pyqs.json).
// Which JSON to load is decided purely by the ?type= query param.

(function () {
  "use strict";

  var EXAM_DURATION_SECONDS = 30 * 60; // change this to adjust exam duration

  var STATUS = {
    NOT_VISITED: "not-visited",
    NOT_ANSWERED: "not-answered",
    ANSWERED: "answered",
    MARKED: "marked",
    ANSWERED_MARKED: "answered-marked"
  };

  var params = new URLSearchParams(window.location.search);
  var examType = params.get("type") === "pyq" ? "pyq" : "regular";
  var dataFile = examType === "pyq" ? "data/pyqs.json" : "data/questions.json";
  var stateKey = "exam_state_" + examType;
  var candidateKey = "candidate_" + examType;
  var resultKey = "exam_result";

  var candidateRaw = localStorage.getItem(candidateKey);
  if (!candidateRaw) {
    window.location.href = "index.html";
    return;
  }
  var candidate = JSON.parse(candidateRaw);

  var els = {
    pageTitle: document.getElementById("pageTitle"),
    examTitleText: document.getElementById("examTitleText"),
    candidateNameLabel: document.getElementById("candidateNameLabel"),
    sectionTab: document.getElementById("sectionTab"),
    timerBox: document.getElementById("timerBox"),
    timerValue: document.getElementById("timerValue"),
    questionNoLabel: document.getElementById("questionNoLabel"),
    questionMarks: document.getElementById("questionMarks"),
    questionYear: document.getElementById("questionYear"),
    questionText: document.getElementById("questionText"),
    optionsList: document.getElementById("optionsList"),
    paletteGrid: document.getElementById("paletteGrid"),
    paletteSummary: document.getElementById("paletteSummary"),
    candidateAvatar: document.getElementById("candidateAvatar"),
    candidateCardName: document.getElementById("candidateCardName"),
    markReviewBtn: document.getElementById("markReviewBtn"),
    clearResponseBtn: document.getElementById("clearResponseBtn"),
    prevBtn: document.getElementById("prevBtn"),
    saveNextBtn: document.getElementById("saveNextBtn"),
    submitExamBtn: document.getElementById("submitExamBtn"),
    submitModalOverlay: document.getElementById("submitModalOverlay"),
    confirmSubmitBtn: document.getElementById("confirmSubmitBtn"),
    statAnswered: document.getElementById("statAnswered"),
    statUnanswered: document.getElementById("statUnanswered"),
    statMarked: document.getElementById("statMarked"),
    paletteToggleBtn: document.getElementById("paletteToggleBtn"),
    paletteContent: document.getElementById("paletteContent"),
    paletteToggleIcon: document.getElementById("paletteToggleIcon")
  };

  var titleText = examType === "pyq" ? "E-Business PYQ Assessment" : "E-Business Online Assessment";
  els.pageTitle.textContent = titleText + " | E-Business Course Practice";
  els.examTitleText.textContent = titleText;
  els.sectionTab.textContent = examType === "pyq" ? "Previous Year Questions" : "General Awareness";
  els.candidateNameLabel.textContent = candidate.name + " · " + candidate.food + " · " + candidate.color;
  els.candidateCardName.textContent = candidate.name;
  setCandidateAvatar(candidate.name);

  function setCandidateAvatar(name) {
    var initial = (name || "?").trim().charAt(0).toUpperCase();
    var seed = encodeURIComponent((name || "candidate").trim().toLowerCase());
    var img = document.createElement("img");
    img.alt = name || "Candidate";
    img.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=" + seed + "&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";
    img.onerror = function () {
      els.candidateAvatar.textContent = initial;
    };
    els.candidateAvatar.textContent = "";
    els.candidateAvatar.appendChild(img);
  }

  var questions = [];
  var state = null;

  fetch(dataFile)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      questions = data;
      initState();
      render();
      startTimer();
    })
    .catch(function () {
      els.questionText.textContent = "Could not load questions from " + dataFile + ".";
    });

  function initState() {
    var saved = localStorage.getItem(stateKey);
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.status) && parsed.status.length === questions.length) {
          state = parsed;
          return;
        }
      } catch (e) { /* fall through to fresh state */ }
    }
    state = {
      current: 0,
      answers: new Array(questions.length).fill(null),
      status: new Array(questions.length).fill(STATUS.NOT_VISITED),
      timeLeft: EXAM_DURATION_SECONDS
    };
    state.status[0] = STATUS.NOT_ANSWERED;
    persist();
  }

  function persist() {
    localStorage.setItem(stateKey, JSON.stringify(state));
  }

  function currentQuestion() {
    return questions[state.current];
  }

  function render() {
    renderQuestion();
    renderPalette();
    renderSummary();
    persist();
  }

  function renderQuestion() {
    var q = currentQuestion();
    els.questionNoLabel.textContent = "Question No. " + (state.current + 1);
    els.questionMarks.textContent = "Marks: " + (q.marks != null ? q.marks : 1);
    els.questionYear.textContent = q.year ? ("Year: " + q.year) : "";
    els.questionText.textContent = q.question;

    els.optionsList.innerHTML = "";
    var letters = ["A", "B", "C", "D", "E", "F"];
    q.options.forEach(function (opt, idx) {
      var row = document.createElement("label");
      row.className = "option-row" + (state.answers[state.current] === idx ? " selected" : "");
      row.innerHTML =
        '<input type="radio" name="option" ' + (state.answers[state.current] === idx ? "checked" : "") + '>' +
        '<span><span class="option-label">' + letters[idx] + '.</span>' + escapeHtml(opt) + '</span>';
      row.querySelector("input").addEventListener("change", function () {
        state.answers[state.current] = idx;
        if (state.status[state.current] === STATUS.MARKED || state.status[state.current] === STATUS.ANSWERED_MARKED) {
          state.status[state.current] = STATUS.ANSWERED_MARKED;
        } else {
          state.status[state.current] = STATUS.ANSWERED;
        }
        renderQuestion();
        renderPalette();
        renderSummary();
        persist();
      });
      els.optionsList.appendChild(row);
    });
  }

  function renderPalette() {
    els.paletteGrid.innerHTML = "";
    questions.forEach(function (q, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette-btn " + state.status[idx] + (idx === state.current ? " current" : "");
      btn.textContent = idx + 1;
      btn.addEventListener("click", function () {
        goToQuestion(idx);
      });
      els.paletteGrid.appendChild(btn);
    });
  }

  function renderSummary() {
    var counts = computeCounts();
    els.paletteSummary.innerHTML =
      '<div><strong style="color:var(--success)">' + counts.answered + '</strong>Answered</div>' +
      '<div><strong style="color:var(--warning)">' + counts.notAnswered + '</strong>Not Answered</div>' +
      '<div><strong style="color:var(--review)">' + counts.marked + '</strong>Marked</div>' +
      '<div><strong style="color:var(--not-visited)">' + counts.notVisited + '</strong>Not Visited</div>';
  }

  function computeCounts() {
    var answered = 0, notAnswered = 0, marked = 0, notVisited = 0;
    state.status.forEach(function (s) {
      if (s === STATUS.ANSWERED) answered++;
      else if (s === STATUS.NOT_ANSWERED) notAnswered++;
      else if (s === STATUS.MARKED) { marked++; notAnswered++; }
      else if (s === STATUS.ANSWERED_MARKED) { marked++; answered++; }
      else notVisited++;
    });
    return { answered: answered, notAnswered: notAnswered, marked: marked, notVisited: notVisited };
  }

  function goToQuestion(idx) {
    if (idx < 0 || idx >= questions.length) return;
    state.current = idx;
    if (state.status[idx] === STATUS.NOT_VISITED) {
      state.status[idx] = STATUS.NOT_ANSWERED;
    }
    render();
  }

  els.saveNextBtn.addEventListener("click", function () {
    if (state.answers[state.current] != null && state.status[state.current] !== STATUS.ANSWERED_MARKED) {
      state.status[state.current] = STATUS.ANSWERED;
    }
    goToQuestion(state.current + 1 < questions.length ? state.current + 1 : state.current);
  });

  els.prevBtn.addEventListener("click", function () {
    goToQuestion(state.current - 1);
  });

  els.clearResponseBtn.addEventListener("click", function () {
    state.answers[state.current] = null;
    state.status[state.current] = STATUS.NOT_ANSWERED;
    render();
  });

  els.markReviewBtn.addEventListener("click", function () {
    state.status[state.current] = state.answers[state.current] != null ? STATUS.ANSWERED_MARKED : STATUS.MARKED;
    goToQuestion(state.current + 1 < questions.length ? state.current + 1 : state.current);
  });

  if (els.paletteToggleBtn) {
    els.paletteToggleBtn.addEventListener("click", function () {
      els.paletteContent.classList.toggle("open");
      els.paletteToggleIcon.innerHTML = els.paletteContent.classList.contains("open") ? "&#9650;" : "&#9660;";
    });
  }

  // ---------- Submit flow ----------
  els.submitExamBtn.addEventListener("click", openSubmitModal);

  function openSubmitModal() {
    var counts = computeCounts();
    els.statAnswered.textContent = counts.answered;
    els.statUnanswered.textContent = counts.notAnswered + counts.notVisited;
    els.statMarked.textContent = counts.marked;
    els.submitModalOverlay.classList.add("open");
  }

  document.querySelectorAll("[data-close-modal='submitModalOverlay']").forEach(function (btn) {
    btn.addEventListener("click", function () { els.submitModalOverlay.classList.remove("open"); });
  });

  els.confirmSubmitBtn.addEventListener("click", submitExam);

  function submitExam() {
    clearInterval(timerHandle);
    var correct = 0, incorrect = 0, unanswered = 0, scoreObtained = 0, totalMarks = 0;
    var reviewItems = questions.map(function (q, idx) {
      var marks = q.marks != null ? q.marks : 1;
      totalMarks += marks;
      var selected = state.answers[idx];
      var isCorrect = selected != null && selected === q.correctAnswer;
      if (selected == null) unanswered++;
      else if (isCorrect) { correct++; scoreObtained += marks; }
      else incorrect++;

      return {
        id: q.id,
        question: q.question,
        options: q.options,
        year: q.year || null,
        explanation: q.explanation || null,
        correctAnswer: q.correctAnswer,
        selected: selected,
        isCorrect: selected == null ? null : isCorrect
      };
    });

    var total = questions.length;
    var attempted = correct + incorrect;
    var accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    var result = {
      examType: examType,
      examName: examType === "pyq" ? "E-Business PYQ Practice" : "E-Business Practice",
      candidate: candidate,
      total: total,
      totalMarks: totalMarks,
      scoreObtained: scoreObtained,
      correct: correct,
      incorrect: incorrect,
      unanswered: unanswered,
      accuracy: accuracy,
      submittedAt: new Date().toISOString(),
      items: reviewItems
    };

    localStorage.setItem(resultKey, JSON.stringify(result));
    localStorage.removeItem(stateKey);
    logResultToSheet(result);
    window.location.href = "result.html";
  }

  // ---------- Google Sheet logging ----------
  // Fire-and-forget: never block the exam flow on network availability.
  function logResultToSheet(result) {
    var url = window.SHEET_CONFIG && window.SHEET_CONFIG.webAppUrl;
    if (!url || url.indexOf("PASTE_YOUR") !== -1) return;

    var payload = {
      examType: result.examType,
      name: result.candidate.name,
      food: result.candidate.food,
      color: result.candidate.color,
      scoreObtained: result.scoreObtained,
      totalMarks: result.totalMarks,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      accuracy: result.accuracy
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function () { /* offline or misconfigured — exam result still saved locally */ });
  }

  // ---------- Timer ----------
  var timerHandle = null;

  function startTimer() {
    updateTimerDisplay();
    timerHandle = setInterval(function () {
      state.timeLeft--;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateTimerDisplay();
        submitExam();
        return;
      }
      updateTimerDisplay();
      persist();
    }, 1000);
  }

  function updateTimerDisplay() {
    var m = Math.floor(state.timeLeft / 60);
    var s = state.timeLeft % 60;
    els.timerValue.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    els.timerBox.classList.toggle("low-time", state.timeLeft <= 60);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  window.addEventListener("beforeunload", function () {
    if (state) persist();
  });
})();
