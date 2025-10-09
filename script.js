const face = document.getElementById("pixelFace");
const bulb = document.getElementById("bulb");
const powerBtn = document.getElementById("powerBtn");
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");

let powered = false;

// Power button logic
powerBtn.onclick = () => {
  powered = !powered;
  if (powered) {
    powerBtn.src = "assets/pixa_gpt_power_on_button.png";
    bulb.src = "assets/pixa_gpt_activation_bulb_active.png";
    face.src = "assets/pixa_gpt_pixel_face_happy.png";
  } else {
    powerBtn.src = "assets/pixa_gpt_power_off_button.png";
    bulb.src = "assets/pixa_gpt_activation_bulb_unactive.png";
    face.src = "assets/pixa_gpt_pixel_face_neutral.png";
  }
};

// Main message sending function
async function sendMessage() {
  if (!powered) return alert("AI is off! Power it on first.");

  const userMessage = input.value.trim();
  if (userMessage === "") return;

  // Show user message
  chatBox.innerHTML += `<div class='user'>🧍 ${userMessage}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
  input.value = "";

  // Thinking state
  face.src = "assets/pixa_gpt_pixel_face_thinking.png";
  bulb.src = "assets/pixa_gpt_activation_bulb_thinking.png";

  try {
    const res = await fetch("http://127.0.0.1:4891/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Reasoner v1",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    // Display AI reply
    chatBox.innerHTML += `<div class='ai'>🤖 ${reply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Emotion logic
    if (reply.match(/sorry|sad|unfortunate/i)) {
      face.src = "assets/pixa_gpt_pixel_face_sad.png";
    } else if (reply.match(/angry|upset|mad/i)) {
      face.src = "assets/pixa_gpt_pixel_face_angry.png";
    } else if (reply.match(/confused|not sure/i)) {
      face.src = "assets/pixa_gpt_pixel_face_confused.png";
    } else if (reply.match(/surprised|wow|amazing/i)) {
      face.src = "assets/pixa_gpt_pixel_face_surprised.png";
    } else if (reply.match(/happy|great|awesome|nice/i)) {
      face.src = "assets/pixa_gpt_pixel_face_happy.png";
    } else {
      face.src = "assets/pixa_gpt_pixel_face_neutral.png";
    }

    bulb.src = "assets/pixa_gpt_activation_bulb_active.png";

  } catch (err) {
    chatBox.innerHTML += `<div class='error'>⚠️ Connection error.</div>`;
    face.src = "assets/pixa_gpt_pixel_face_confused.png";
    bulb.src = "assets/pixa_gpt_activation_bulb_unactive.png";
  }
}
