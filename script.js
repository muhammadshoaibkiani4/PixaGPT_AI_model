const powerOn = document.getElementById("powerOn");
const powerOff = document.getElementById("powerOff");
const bulb = document.getElementById("statusBulb");
const face = document.getElementById("faceImage");
const sendButton = document.getElementById("sendButton");
const input = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");

let powered = false;

// === POWER BUTTONS ===
powerOn.onclick = () => {
  powered = true;
  bulb.src = "assets/pixa_gpt_activation_bulb_active.png";
  face.src = "assets/pixa_gpt_pixel_face_neutral.png";
  appendMessage("System activated.", "ai");
};

powerOff.onclick = () => {
  powered = false;
  bulb.src = "assets/pixa_gpt_activation_bulb_unactive.png";
  face.src = "assets/pixa_gpt_pixel_face_neutral.png";
  appendMessage("System shutting down...", "ai");
};

// === SEND MESSAGE ===
sendButton.onclick = sendMessage;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  if (!powered) {
    appendMessage("(Turn on PIXA-GPT first.)", "ai");
    return;
  }

  appendMessage(text, "user");
  input.value = "";

  // Thinking face during "response"
  face.src = "assets/pixa_gpt_pixel_face_thinking.png";
  bulb.src = "assets/pixa_gpt_activation_bulb_thinking.png";

  setTimeout(() => {
    const reply = mockAI(text);
    appendMessage(reply, "ai");

    // Happy face after reply
    face.src = "assets/pixa_gpt_pixel_face_happy.png";
    bulb.src = "assets/pixa_gpt_activation_bulb_active.png";

    setTimeout(() => {
      face.src = "assets/pixa_gpt_pixel_face_neutral.png";
    }, 2000);
  }, 1500);
}

// === APPEND CHAT MESSAGE ===
function appendMessage(msg, sender) {
  const div = document.createElement("div");
  div.classList.add(sender === "user" ? "userMsg" : "aiMsg");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === MOCK AI ===
function mockAI(input) {
  const responses = [
    "That's quite interesting!",
    "Let me process that...",
    "I think I understand.",
    "Good question!",
    "Hmm... fascinating."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
