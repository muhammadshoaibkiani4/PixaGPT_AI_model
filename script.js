const powerBtn = document.getElementById("power-button");
const statusIcon = document.getElementById("status-icon");
const timeIcon = document.getElementById("time-icon");
const timeDisplay = document.getElementById("time-display");
const robot = document.getElementById("robot");
const chatMessages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");
const breakPopup = document.getElementById("break-popup");
const takeBreak = document.getElementById("take-break");
const continueBtn = document.getElementById("continue");
const closePopup = document.getElementById("close-popup");

let powered = false;
let activeStart = null;
let breakTimer = null;

function getDayPeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function updateTime() {
  const now = new Date();
  const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  timeDisplay.textContent = formatted;
  const period = getDayPeriod();
  timeIcon.src = `assets/pixagpt_time_${period}.png`;
}

setInterval(updateTime, 1000);

powerBtn.onclick = () => {
  powered = !powered;
  if (powered) {
    powerBtn.src = "assets/pixagpt_poweron_button.png";
    statusIcon.src = "assets/pixagpt_status_active.png";
    addMessage("System activated.");
    robot.src = "assets/pixagpt_neutral.png";
    activeStart = Date.now();
  } else {
    powerBtn.src = "assets/pixagpt_poweroff_button.png";
    statusIcon.src = "assets/pixagpt_status_unactive.png";
    addMessage("System deactivated.");
    robot.src = "assets/pixagpt_neutral.png";
    clearInterval(breakTimer);
  }
};

function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

setInterval(() => {
  if (!powered || !activeStart) return;
  const elapsed = (Date.now() - activeStart) / 1000 / 60;
  if (elapsed >= 40) {
    breakPopup.style.display = "block";
  }
}, 5000);

takeBreak.onclick = () => {
  breakPopup.style.display = "none";
  robot.src = "assets/pixagpt_breaktimeworking.png";
  addMessage("Taking a short break...");
  setTimeout(() => {
    robot.src = "assets/pixagpt_neutral.png";
    addMessage("Break over. Ready again!");
    activeStart = Date.now();
  }, 20000);
};

continueBtn.onclick = closePopup.onclick = () => {
  breakPopup.style.display = "none";
  addMessage("Continuing without break.");
};
