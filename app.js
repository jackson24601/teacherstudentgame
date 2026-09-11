(() => {
  const TIMER_SECONDS = 15;
  const RING_LENGTH = 2 * Math.PI * 52;

  const scores = {
    students: 0,
    teachers: 0,
  };

  const studentScoreEl = document.getElementById("student-score");
  const teacherScoreEl = document.getElementById("teacher-score");
  const timerEl = document.getElementById("timer");
  const timerValueEl = document.getElementById("timer-value");
  const timerProgressEl = document.getElementById("timer-progress");
  const startBtn = document.getElementById("start-btn");
  const resetBtn = document.getElementById("reset-btn");

  let remainingMs = TIMER_SECONDS * 1000;
  let deadline = null;
  let frameId = null;

  function renderScores() {
    studentScoreEl.textContent = String(scores.students);
    teacherScoreEl.textContent = String(scores.teachers);
  }

  function popScore(team) {
    const el = team === "students" ? studentScoreEl : teacherScoreEl;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  function changeScore(team, delta) {
    scores[team] = Math.max(0, scores[team] + delta);
    renderScores();
    popScore(team);
  }

  function formatSeconds(ms) {
    return String(Math.ceil(ms / 1000));
  }

  function timerState(ms) {
    if (ms <= 0) return "done";
    if (deadline === null) return "ready";
    const seconds = ms / 1000;
    if (seconds <= 5) return "danger";
    if (seconds <= 8) return "warn";
    return "running";
  }

  function renderTimer() {
    const clamped = Math.max(0, remainingMs);
    timerValueEl.textContent = formatSeconds(clamped);
    const progress = clamped / (TIMER_SECONDS * 1000);
    timerProgressEl.style.strokeDasharray = String(RING_LENGTH);
    timerProgressEl.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
    timerEl.dataset.state = timerState(clamped);
    startBtn.disabled = deadline !== null && clamped > 0;
  }

  function stopTimer() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    deadline = null;
    startBtn.disabled = false;
  }

  function buzz() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  }

  function tick() {
    remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      remainingMs = 0;
      stopTimer();
      renderTimer();
      buzz();
      return;
    }
    renderTimer();
    frameId = requestAnimationFrame(tick);
  }

  function startTimer() {
    if (deadline !== null) return;
    if (remainingMs <= 0) {
      remainingMs = TIMER_SECONDS * 1000;
    }
    deadline = Date.now() + remainingMs;
    startBtn.disabled = true;
    frameId = requestAnimationFrame(tick);
  }

  function resetTimer() {
    stopTimer();
    remainingMs = TIMER_SECONDS * 1000;
    renderTimer();
  }

  document.querySelectorAll(".score-btn").forEach((button) => {
    button.addEventListener("click", () => {
      changeScore(button.dataset.team, Number(button.dataset.delta));
    });
  });

  startBtn.addEventListener("click", startTimer);
  resetBtn.addEventListener("click", resetTimer);

  renderScores();
  renderTimer();
})();
