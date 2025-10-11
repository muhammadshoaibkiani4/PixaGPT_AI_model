// ======== PIXA GPT MAIN SCRIPT ========

// --- DOM ELEMENTS ---
const powerBtn = document.getElementById("power-btn");
const robotEmotion = document.getElementById("robot-emotion");
const statusIcon = document.getElementById("status-icon");
const timeIcon = document.getElementById("time-icon");
const liveTime = document.getElementById("live-time");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const breakPopup = document.getElementById("break-popup");
const continueBtn = document.getElementById("continue-btn");
const closeBreakBtn = document.getElementById("close-break-btn");

let poweredOn = false;
let active = false;
let chatTimer = null;
let breakTimer = null;
let emotionState = "neutral";
let gptEndpoint = "http://localhost:4891/v1/chat/completions"; // Default GPT4All API port

// ======== POWER SYSTEM ========
powerBtn.addEventListener("click", () => {
  poweredOn = !poweredOn;
  if (poweredOn) {
    robotEmotion.src = "assets/pixagpt_happy.png";
    statusIcon.src = "assets/pixagpt_status_active.png";
    powerBtn.src = "assets/pixagpt_poweroff_button.png";
    addSystemMessage("PIXA GPT is now online. How can I help?");
    startTimers();
  } else {
    robotEmotion.src = "assets/pixagpt_neutral.png";
    statusIcon.src = "assets/pixagpt_status_unactive.png";
    powerBtn.src = "assets/pixagpt_poweron_button.png";
    addSystemMessage("PIXA GPT has been powered off.");
    stopTimers();
  }
});

// ======== MESSAGE SYSTEM ========
sendBtn.addEventListener("click", () => {
  const message = userInput.value.trim();
  if (!message || !poweredOn) return;

  addUserMessage(message);
  userInput.value = "";
  robotEmotion.src = "assets/pixagpt_thinking.png";
  statusIcon.src = "assets/pixagpt_status_thinking.png";

  // GPT4All request
  fetch(gptEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt4all",
      messages: [{ role: "user", content: message }]
    })
  })
    .then(res => res.json())
    .then(data => {
      const reply = data?.choices?.[0]?.message?.content || "No response received.";
      addBotMessage(reply);
      robotEmotion.src = "assets/pixagpt_happy.png";
      statusIcon.src = "assets/pixagpt_status_active.png";
    })
    .catch(() => {
      addBotMessage("⚠️ Unable to connect to GPT4All. Please ensure the API server is enabled.");
      robotEmotion.src = "assets/pixagpt_sad.png";
      statusIcon.src = "assets/pixagpt_status_unactive.png";
    });
});

function addUserMessage(text) {
  const msg = document.createElement("div");
  msg.classList.add("user-message");
  msg.textContent = `You: ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addBotMessage(text) {
  const msg = document.createElement("div");
  msg.classList.add("bot-message");
  msg.textContent = `PIXA GPT: ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
  const msg = document.createElement("div");
  msg.classList.add("system-message");
  msg.textContent = `[SYSTEM]: ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ======== TIME SYSTEM ========
function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  liveTime.textContent = `${hours}:${minutes}`;

  if (hours >= 5 && hours < 12) {
    timeIcon.src = "assets/pixagpt_time_morning.png";
  } else if (hours >= 12 && hours < 17) {
    timeIcon.src = "assets/pixagpt_time_afternoon.png";
  } else if (hours >= 17 && hours < 20) {
    timeIcon.src = "assets/pixagpt_time_evening.png";
  } else {
    timeIcon.src = "assets/pixagpt_status_night.png";
  }
}

// ======== BREAK SYSTEM ========
function startTimers() {
  updateTime();
  if (chatTimer) clearInterval(chatTimer);
  if (breakTimer) clearTimeout(breakTimer);

  chatTimer = setInterval(updateTime, 60000);
  breakTimer = setTimeout(showBreakPopup, 40 * 60 * 1000); // Every 40 minutes
}

function stopTimers() {
  clearInterval(chatTimer);
  clearTimeout(breakTimer);
}

function showBreakPopup() {
  breakPopup.style.display = "flex";
  robotEmotion.src = "assets/pixagpt_breaktimeworking.png";
  addSystemMessage("It's time for a 20-second break!");
  let breakCountdown = 20;
  const interval = setInterval(() => {
    if (breakCountdown <= 0) {
      clearInterval(interval);
      breakPopup.style.display = "none";
      robotEmotion.src = "assets/pixagpt_happy.png";
      addSystemMessage("Break complete. Ready to continue!");
    }
    breakCountdown--;
  }, 1000);
}

continueBtn.addEventListener("click", () => {
  breakPopup.style.display = "none";
  robotEmotion.src = "assets/pixagpt_happy.png";
});

closeBreakBtn.addEventListener("click", () => {
  breakPopup.style.display = "none";
  addSystemMessage("Break dismissed manually.");
});

// ======== INITIAL STATE ========
window.onload = () => {
  robotEmotion.src = "assets/pixagpt_neutral.png";
  statusIcon.src = "assets/pixagpt_status_unactive.png";
  powerBtn.src = "assets/pixagpt_poweron_button.png";
  updateTime();
};
