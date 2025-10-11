const API_URL = "http://127.0.0.1:4891/v1/chat/completions";
const MODEL = "deepseek-r1-distill-qwen-1.5b";

const powerBtn = document.getElementById("power-btn");
const statusLight = document.getElementById("status-light");
const robotFace = document.getElementById("robot-face");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const timeText = document.getElementById("time-text");
const timeIcon = document.getElementById("time-icon");
const breakPopup = document.getElementById("break-popup");
const breakBtn = document.getElementById("break-btn");
const continueBtn = document.getElementById("continue-btn");
const closePopupBtn = document.getElementById("close-popup-btn");

let systemActive = false;
let timerInterval;
let activeTime = 0;
let breakActive = false;

function setStatus(status) {
  if (status === "active") {
    statusLight.src = "assets/pixagpt_status_active.png";
  } else if (status === "thinking") {
    statusLight.src = "assets/pixagpt_status_thinking.png";
  } else {
    statusLight.src = "assets/pixagpt_status_unactive.png";
  }
}

function updateTime() {
  const now = new Date();
  const hrs = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, "0");
  timeText.textContent = `${hrs}:${mins}`;

  if (hrs >= 6 && hrs < 12) timeIcon.src = "assets/pixagpt_time_morning.png";
  else if (hrs >= 12 && hrs < 17) timeIcon.src = "assets/pixagpt_time_afternoon.png";
  else if (hrs >= 17 && hrs < 20) timeIcon.src = "assets/pixagpt_time_evening.png";
  else timeIcon.src = "assets/pixagpt_status_night.png";
}

setInterval(updateTime, 1000);

powerBtn.addEventListener("click", () => {
  if (!systemActive) {
    systemActive = true;
    powerBtn.src = "assets/pixagpt_poweron_button.png";
    setStatus("active");
    chatBox.innerHTML += `<p>🟢 System Activated</p>`;
    greetUser();
    startTimer();
  } else {
    systemActive = false;
    powerBtn.src = "assets/pixagpt_poweroff_button.png";
    setStatus("unactive");
    chatBox.innerHTML += `<p>🔴 System Deactivated</p>`;
    clearInterval(timerInterval);
    activeTime = 0;
  }
});

sendBtn.addEventListener("click", async () => {
  if (!systemActive || breakActive) return;
  const msg = messageInput.value.trim();
  if (!msg) return;
  chatBox.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  messageInput.value = "";
  setStatus("thinking");
  robotFace.src = "assets/pixagpt_thinking.png";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: msg }],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "(No reply)";
    chatBox.innerHTML += `<p><b>PIXA-GPT:</b> ${reply}</p>`;
    setStatus("active");
    robotFace.src = "assets/pixagpt_neutral.png";
  } catch (err) {
    chatBox.innerHTML += `<p style="color:red;">⚠️ Connection error. Is GPT4All running?</p>`;
    setStatus("unactive");
  }
});

function greetUser() {
  const hour = new Date().getHours();
  let greeting = "Hello!";
  if (hour >= 6 && hour < 12) greeting = "Good morning! How’s your day starting?";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon! How’s everything?";
  else if (hour >= 17 && hour < 20) greeting = "Good evening! How was your day?";
  else greeting = "Working late? Hope your night’s going well!";
  chatBox.innerHTML += `<p><b>PIXA-GPT:</b> ${greeting}</p>`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!systemActive) return;
    activeTime++;
    if (activeTime >= 2400) { // 40 minutes
      showBreakPopup();
      clearInterval(timerInterval);
    }
  }, 1000);
}

function showBreakPopup() {
  breakPopup.style.display = "block";
}

breakBtn.addEventListener("click", () => {
  breakActive = true;
  breakPopup.style.display = "none";
  robotFace.src = "assets/pixagpt_breaktimeworking.png";
  chatBox.innerHTML += `<p><b>PIXA-GPT:</b> See? I’m still working — take your time!</p>`;
  setTimeout(() => {
    breakActive = false;
    robotFace.src = "assets/pixagpt_neutral.png";
    chatBox.innerHTML += `<p><b>PIXA-GPT:</b> Break over — ready when you are!</p>`;
    startTimer();
  }, 20000);
});

continueBtn.addEventListener("click", () => {
  breakPopup.style.display = "none";
  startTimer();
});

closePopupBtn.addEventListener("click", () => {
  breakPopup.style.display = "none";
  startTimer();
});
