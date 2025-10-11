const powerOnBtn = document.getElementById("power-on");
const powerOffBtn = document.getElementById("power-off");
const statusIcon = document.getElementById("status-icon");
const robotFace = document.getElementById("robot-face");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

const popup = document.getElementById("break-popup");
const closePopup = document.getElementById("close-popup");
const continueBtn = document.getElementById("continue-btn");
const breakBtn = document.getElementById("break-btn");

const currentTime = document.getElementById("current-time");
const timeIcon = document.getElementById("time-icon");

let systemActive = false;
let activeStartTime = null;
let breakTimer = null;

// Update live time
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    currentTime.textContent = `${displayHours}:${minutes} ${ampm}`;

    // Set time icon
    let iconPath = "assets/pixagpt_time_morning.png";
    if (hours >= 12 && hours < 17) iconPath = "assets/pixagpt_time_afternoon.png";
    else if (hours >= 17 && hours < 20) iconPath = "assets/pixagpt_time_evening.png";
    else if (hours >= 20 || hours < 6) iconPath = "assets/pixagpt_status_night.png";
    timeIcon.src = iconPath;
}
setInterval(updateTime, 1000);
updateTime();

// Greetings
function greetingByTime() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! How’s your day starting?";
    if (hour < 17) return "Good afternoon! How’s your day going?";
    if (hour < 20) return "Good evening! How’s everything?";
    return "Working late? Good night!";
}

// Add message
function addMessage(sender, text) {
    const message = document.createElement("div");
    message.textContent = `${sender}: ${text}`;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Connect to GPT4All
async function sendMessageToGPT(message) {
    try {
        robotFace.src = "assets/pixagpt_thinking.png";
        statusIcon.src = "assets/pixagpt_status_thinking.png";

        const response = await fetch("http://localhost:4891/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "DeepSeek-R1-Distill-Qwen-1.5B",
                messages: [{ role: "user", content: message }],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || "I'm here but couldn’t think of an answer.";
        addMessage("PIXA-GPT", reply);

        robotFace.src = "assets/pixagpt_neutral.png";
        statusIcon.src = "assets/pixagpt_status_active.png";

    } catch (error) {
        addMessage("System", "⚠️ Connection error: GPT4All not reachable.");
        robotFace.src = "assets/pixagpt_sad.png";
        statusIcon.src = "assets/pixagpt_status_unactive.png";
    }
}

// Power Controls
powerOnBtn.addEventListener("click", () => {
    systemActive = true;
    addMessage("System", "System activated.");
    statusIcon.src = "assets/pixagpt_status_active.png";
    robotFace.src = "assets/pixagpt_neutral.png";
    addMessage("PIXA-GPT", greetingByTime());
    activeStartTime = Date.now();
    startBreakTimer();
});

powerOffBtn.addEventListener("click", () => {
    systemActive = false;
    addMessage("System", "System deactivated.");
    statusIcon.src = "assets/pixagpt_status_unactive.png";
    robotFace.src = "assets/pixagpt_neutral.png";
    clearTimeout(breakTimer);
});

// Chat send
sendBtn.addEventListener("click", async () => {
    if (!systemActive) {
        addMessage("System", "Activate the system first.");
        return;
    }

    const text = userInput.value.trim();
    if (!text) return;
    addMessage("You", text);
    userInput.value = "";

    // Emotion check
    if (text.toLowerCase().includes("angry")) robotFace.src = "assets/pixagpt_angry.png";
    else if (text.toLowerCase().includes("sad")) robotFace.src = "assets/pixagpt_sad.png";
    else if (text.toLowerCase().includes("surprised")) robotFace.src = "assets/pixagpt_surprised.png";
    else if (text.toLowerCase().includes("thanks")) robotFace.src = "assets/pixagpt_happy.png";

    await sendMessageToGPT(text);
});

// Break popup logic
function startBreakTimer() {
    breakTimer = setTimeout(() => {
        popup.classList.remove("hidden");
    }, 40 * 60 * 1000); // 40 minutes
}

closePopup.addEventListener("click", () => {
    popup.classList.add("hidden");
});

continueBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
});

breakBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
    robotFace.src = "assets/pixagpt_breaktimeworking.png";
    addMessage("PIXA-GPT", "I’m taking a short break, but I’m still around!");
    setTimeout(() => {
        robotFace.src = "assets/pixagpt_neutral.png";
        addMessage("PIXA-GPT", "Break over! Let’s get back to work.");
    }, 20000); // 20 seconds
});
