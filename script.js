/* PIXA-GPT Lite — client-side Q&A with fuzzy matching and emotions
   - Requires:
     - PDF placed at: assets/PixaGPT_questions_database.pdf (optional)
     - PDF.js loaded in page (cdn in index.html)
     - Fuse.js loaded in page (cdn in index.html)
*/

const PDF_PATH = 'assets/PixaGPT_questions_database.pdf'; // where to auto-load PDF from
const QA_PARSED_KEY = 'pixagpt_qa_parsed_v1'; // localStorage key for cached parsed QA

// DOM
const powerBtn = document.getElementById('power-btn');
const statusIcon = document.getElementById('status-icon');
const timeIcon = document.getElementById('time-icon');
const timeText = document.getElementById('time-text');
const robotFace = document.getElementById('robot-face');
const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pdfInput = document.getElementById('pdf-input');
const reloadBtn = document.getElementById('reload-btn');

// State
let powered = false;
let qaList = []; // { q: "...", a: "..." }
let fuse = null;
let emotionKeywords = {
  happy: ["thank you", "thanks", "good job", "well done", "nice", "great", "thanks!"],
  thinking: ["what", "why", "how", "hmm", "think"],
  sad: ["sorry", "i don't know", "you are wrong", "bad", "sad", "cant"],
  surprised: ["wow", "amazing", "really", "no way", "whoa"],
  neutral: ["hello", "hi", "hey", "good morning", "good evening"]
};

// tone: friendly-human
function buildPersonalityReply(answer) {
  // wrap answer with friendly preface sometimes
  const starters = [
    "Oh nice — here's what I know: ",
    "I think this might help: ",
    "Ah, good question! ",
    "Let me tell you — ",
    "Okay, here's a neat fact: "
  ];
  // randomly choose to preface or not
  return (Math.random() < 0.6 ? starters[Math.floor(Math.random()*starters.length)] : "") + answer;
}

// add message to UI
function pushMessage(text, who='bot') {
  const d = document.createElement('div');
  d.className = 'msg ' + (who === 'user' ? 'user' : 'bot');
  d.textContent = text;
  messages.appendChild(d);
  messages.scrollTop = messages.scrollHeight;
}

// update time & icon
function updateTime() {
  const now = new Date();
  const hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2,'0');
  timeText.textContent = `${hh}:${mm}`;
  if (hh >= 5 && hh < 12) timeIcon.src = 'assets/pixagpt_time_morning.png';
  else if (hh >= 12 && hh < 17) timeIcon.src = 'assets/pixagpt_time_afternoon.png';
  else if (hh >= 17 && hh < 20) timeIcon.src = 'assets/pixagpt_time_evening.png';
  else timeIcon.src = 'assets/pixagpt_time_night.png';
}
setInterval(updateTime, 1000);
updateTime();

// power toggling UI
powerBtn.addEventListener('click', () => {
  powered = !powered;
  if (powered) {
    powerBtn.src = 'assets/pixagpt_poweron_button.png';
    statusIcon.src = 'assets/pixagpt_status_active.png';
    robotFace.src = 'assets/pixagpt_neutral.png';
    pushMessage("System activated. " + timeGreeting(), 'bot');
  } else {
    powerBtn.src = 'assets/pixagpt_poweroff_button.png';
    statusIcon.src = 'assets/pixagpt_status_unactive.png';
    robotFace.src = 'assets/pixagpt_neutral.png';
    pushMessage("System deactivated.", 'bot');
  }
});

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! How's your day starting?";
  if (hour < 17) return "Good afternoon! How's it going?";
  if (hour < 20) return "Good evening! How was your day?";
  return "Working late? I'm here if you need me!";
}

// parse raw text into Q/A pairs (basic heuristics)
// input: full text string
function parseQAFromText(text) {
  const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const pairs = [];
  let i = 0;
  while (i < lines.length) {
    // find line that looks like a question marker
    const qMatch = lines[i].match(/^(?:Q(?:\d*)[:\.\s-]*)?(.*\?)$/i);
    if (qMatch) {
      let q = qMatch[1].trim();
      // next lines search for A:
      let a = '';
      i++;
      while (i < lines.length) {
        const aMatch = lines[i].match(/^(?:A(?:\d*)[:\.\s-]*)?(.*)/i);
        if (aMatch && aMatch[1]) {
          a = aMatch[1].trim();
          i++;
          // gather following lines until next Q or blank
          while (i < lines.length && !lines[i].match(/^(?:Q(?:\d*)[:\.\s-]*)?.*\?$/i)) {
            a += ' ' + lines[i];
            i++;
          }
          break;
        } else {
          i++;
        }
      }
      if (q && a) pairs.push({ q, a: a.trim() });
    } else {
      i++;
    }
  }
  return pairs;
}

// client-side: use PDF.js to extract text; returns Promise<string>
async function extractTextFromPDF(urlOrFile) {
  const loadingTask = (typeof urlOrFile === 'string')
    ? pdfjsLib.getDocument(urlOrFile)
    : pdfjsLib.getDocument({ data: await urlOrFile.arrayBuffer() });

  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map(i => i.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

// attempt to load PDF from assets automatically; fallback to asking user
async function loadQuestionsFromPDFAuto() {
  try {
    // try to load cached parsed QA first
    const cached = localStorage.getItem(QA_PARSED_KEY);
    if (cached) {
      qaList = JSON.parse(cached);
      buildFuse();
      console.log('Loaded QA from localStorage, pairs:', qaList.length);
      return;
    }

    // try fetch PDF path
    const res = await fetch(PDF_PATH);
    if (!res.ok) throw new Error('PDF not found at ' + PDF_PATH);
    const blob = await res.blob();
    const text = await extractTextFromPDF(blob);
    qaList = parseQAFromText(text);

    // if parse failed or empty, ask user to upload manually
    if (!qaList.length) throw new Error('Parsed 0 Q/A pairs from the PDF');

    // store cached
    localStorage.setItem(QA_PARSED_KEY, JSON.stringify(qaList));
    buildFuse();
    console.log('Parsed QA from PDF, pairs:', qaList.length);
  } catch (err) {
    console.warn('Auto PDF load failed:', err);
    pushMessage("I couldn't auto-load the Q&A PDF. You can upload it manually using the Upload control (bottom).", 'bot');
    // show manual loader UI if user wants
    document.getElementById('loader-ui').classList.remove('hidden');
  }
}

// build Fuse index for fuzzy search
function buildFuse() {
  if (!qaList || !qaList.length) return;
  const options = {
    keys: ['q'],
    threshold: 0.35,         // tweak: lower is stricter
    distance: 200,
    minMatchCharLength: 3,
    includeScore: true
  };
  fuse = new Fuse(qaList, options);
}

// handle send
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;
  pushMessage(text, 'user');
  userInput.value = '';

  if (!powered) {
    pushMessage("Activate the system first (power button).", 'bot');
    return;
  }

  // emotion trigger detection (quick)
  const lower = text.toLowerCase();
  if (detectEmotion(lower) === 'happy') {
    robotFace.src = 'assets/pixagpt_happy.png';
  } else if (detectEmotion(lower) === 'surprised') {
    robotFace.src = 'assets/pixagpt_surprised.png';
  } else if (detectEmotion(lower) === 'sad') {
    robotFace.src = 'assets/pixagpt_sad.png';
  } else {
    robotFace.src = 'assets/pixagpt_thinking.png';
  }

  // check for special "what can you do?" exact/near match
  if (/what can you do\??/i.test(text) || /what do you do\??/i.test(text)) {
    const special = "Well, I am not as intelligent and complex as ChatGPT, DeepSeek, Gemini, and others, but what makes me different is that I can show you the emotions of an AI and respond like a friendly companion. Pardon me if I can't answer your question — I'm still learning, but I can assure you you won't get bored!";
    pushMessage(buildPersonalityReply(special), 'bot');
    robotFace.src = 'assets/pixagpt_happy.png';
    statusIcon.src = 'assets/pixagpt_status_active.png';
    return;
  }

  // search in local QA with fuzzy
  if (fuse && qaList.length) {
    const results = fuse.search(text, { limit: 5 });
    if (results && results.length) {
      const top = results[0];
      // if score is good enough (lower is better)
      const score = top?.score ?? 1;
      if (score <= 0.45) {
        const answer = top.item.a;
        // reply with personality
        setTimeout(() => {
          pushMessage(buildPersonalityReply(answer), 'bot');
          robotFace.src = 'assets/pixagpt_happy.png';
          statusIcon.src = 'assets/pixagpt_status_active.png';
        }, 500 + Math.random()*600);
        return;
      }
    }
  }

  // fallback: very small keyword heuristics (capitals etc.)
  const cap = trySimpleHeuristics(text);
  if (cap) {
    setTimeout(() => {
      pushMessage(buildPersonalityReply(cap), 'bot');
      robotFace.src = 'assets/pixagpt_happy.png';
      statusIcon.src = 'assets/pixagpt_status_active.png';
    }, 400);
    return;
  }

  // unknown answer
  setTimeout(() => {
    pushMessage("Hmm… I don't know that one yet. I'm still learning — try asking differently or simpler!", 'bot');
    robotFace.src = 'assets/pixagpt_confused.png' || 'assets/pixagpt_thinking.png';
    statusIcon.src = 'assets/pixagpt_status_unactive.png';
  }, 500);
}

// very small heuristics for capitals-like Qs
function trySimpleHeuristics(text) {
  const lower = text.toLowerCase();
  const m = lower.match(/capital of ([a-z\s]+)/i);
  if (m) {
    const country = m[1].trim();
    // check in QA list for exact capital answers
    for (let item of qaList) {
      // check if Q contains 'capital' and country
      if (/capital/i.test(item.q) && item.q.toLowerCase().includes(country)) {
        return item.a;
      }
    }
  }
  return null;
}

// detect simple emotion keywords
function detectEmotion(lower) {
  for (const [emo, words] of Object.entries(emotionKeywords)) {
    for (const w of words) if (lower.includes(w)) return emo;
  }
  return null;
}

// wire UI
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

// manual PDF upload fallback
if (pdfInput) {
  pdfInput.addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const txt = await extractTextFromPDF(file);
      qaList = parseQAFromText(txt);
      localStorage.setItem(QA_PARSED_KEY, JSON.stringify(qaList));
      buildFuse();
      pushMessage(`Loaded ${qaList.length} Q/A pairs from uploaded PDF.`, 'bot');
    } catch (err) {
      console.error(err);
      pushMessage("Failed to parse uploaded PDF.", 'bot');
    }
  });
  reloadBtn.addEventListener('click', () => {
    localStorage.removeItem(QA_PARSED_KEY);
    loadQuestionsFromPDFAuto();
  });
}

// initialization: try to auto-load PDF and build fuse index
loadQuestionsFromPDFAuto().then(() => {
  if (!qaList.length) pushMessage("Knowledge base is empty — upload your PDF to start.", 'bot');
  else pushMessage(`Knowledge base loaded: ${qaList.length} entries. Ask me anything!`, 'bot');
}).catch(err => {
  console.warn(err);
  pushMessage("Unable to load knowledge base automatically. Upload PDF manually if needed.", 'bot');
});
