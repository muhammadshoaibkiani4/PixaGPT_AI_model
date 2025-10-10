// PIXA-GPT LOGIC
const faceImage = document.getElementById("faceImage");
const bulb = document.getElementById("statusBulb");
const powerOn = document.getElementById("powerOn");
const powerOff = document.getElementById("powerOff");
const sendButton = document.getElementById("sendButton");
const userInput = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");

let powered = false;
let thinking = false;

// === POWER HANDLING ===
powerOn.addEventListener("click", () => {
  powered = true;
  bulb.src = "assets/pixa_gpt_activation_bulb_active.png";
  faceImage.src = "assets/pixa_gpt_pixel_face_happy.png";
});

powerOff.addEventListener("click", () => {
  powered = false;
  bulb.src = "assets/pixa_gpt_activation_bulb_unactive.png";
  faceImage.src = "assets/pixa_gpt_pixel_face_neutral.png";
});

// === CHAT LOGIC ===
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || !powered) return;

  appendMessage(text, "user");
  userInput.value = "";

  // Thinking phase
  faceImage.src = "assets/pixa_gpt_pixel_face_thinking.png";
  bulb.src = "assets/pixa_gpt_activation_bulb_thinking.png";

  try {
    const res = await fetch("http://127.0.0.1:4891/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Reasoner v1",
        messages: [{ role: "user", content: text }],
        max_tokens: 100,
      }),
    });

    const data = await res.json();
    const aiReply = data.choices?.[0]?.message?.content || "(No response)";
    appendMessage(aiReply, "ai");

    // Emotion logic
    const lower = aiReply.toLowerCase();
    if (lower.includes("sorry") || lower.includes("not")) {
      faceImage.src = "assets/pixa_gpt_pixel_face_sad.png";
    } else if (lower.includes("?")) {
      faceImage.src = "assets/pixa_gpt_pixel_face_confused.png";
    } else {
      faceImage.src = "assets/pixa_gpt_pixel_face_happy.png";
    }
    bulb.src = "assets/pixa_gpt_activation_bulb_active.png";
  } catch (err) {
    console.error(err);
    appendMessage("(Connection error — is GPT4All running?)", "ai");
    faceImage.src = "assets/pixa_gpt_pixel_face_angry.png";
    bulb.src = "assets/pixa_gpt_activation_bulb_unactive.png";
  }
}

// === HELPER: DISPLAY MESSAGE ===
function appendMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add(type === "user" ? "userMsg" : "aiMsg");
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
