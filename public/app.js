
const $ = id => document.getElementById(id);

let timer = null;
let voices = [];
let speaking = false;

const hasSpeech = "speechSynthesis" in window &&
                  "SpeechSynthesisUtterance" in window;

function setStatus(message) {
  const el = $("status");
  if (el) el.textContent = message;
}

function loadVoices() {
  if (!hasSpeech) return;
  voices = speechSynthesis.getVoices() || [];
}

if (hasSpeech) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

// สร้างบทพูดสำรอง หากเซิร์ฟเวอร์ AI ยังไม่ตอบ
function fallbackLine(viewer = "") {
  if (viewer) {
    return `สวัสดีครับ ${viewer} ยินดีต้อนรับเข้าสู่ไลฟ์ของพี่ต้นครับ วันนี้มาสนุกด้วยกันนะครับ`;
  }

  const topic = $("topic")?.value?.trim() || "เรื่องราวในชีวิตประจำวัน";

  const lines = [
    `สวัสดีครับทุกคน วันนี้พี่ต้นจะมาเล่าเรื่อง ${topic} ให้ฟังกันครับ`,
    "ชีวิตคนเราต้องมีเสียงหัวเราะบ้างนะครับ ยิ้มวันละนิด จิตแจ่มใสครับ",
    "ใครกำลังดูไลฟ์อยู่ ทักทายกันได้นะครับ พี่ต้นยินดีต้อนรับทุกคนครับ",
    "วันนี้เหนื่อยกันมาทั้งวันแล้ว พักผ่อนและมาสนุกด้วยกันนะครับ"
  ];

  return lines[Math.floor(Math.random() * lines.length)];
}

// ระบบเสียงภาษาไทย
function say(line) {
  line = String(line || "").trim();

  if (!line) {
    setStatus("ไม่มีข้อความสำหรับอ่าน");
    return;
  }

  if (!hasSpeech) {
    setStatus("เบราว์เซอร์ไม่รองรับระบบเสียง");
    alert("โทรศัพท์หรือเบราว์เซอร์ไม่รองรับ Text-to-Speech");
    return;
  }

  speechSynthesis.cancel();
  loadVoices();

  const u = new SpeechSynthesisUtterance(line);
  u.lang = "th-TH";
  u.rate = 0.94;
  u.pitch = 0.95;
  u.volume = 1;

  const thaiVoice = voices.find(v =>
    v.lang && v.lang.toLowerCase() === "th-th"
  ) || voices.find(v =>
    v.lang && v.lang.toLowerCase().startsWith("th")
  );

  if (thaiVoice) u.voice = thaiVoice;

  u.onstart = () => {
    speaking = true;
    $("mouth")?.classList.add("talk");
    setStatus("กำลังพูดภาษาไทย...");
  };

  u.onend = () => {
    speaking = false;
    $("mouth")?.classList.remove("talk");
    setStatus("พร้อม • พูดจบแล้ว");
  };

  u.onerror = event => {
    speaking = false;
    $("mouth")?.classList.remove("talk");
    setStatus("เสียงผิดพลาด: " + event.error);
  };

  try {
    speechSynthesis.speak(u);
    localStorage.setItem("thaiLiveLastLine", line);
  } catch (e) {
    setStatus("ไม่สามารถเปิดเสียงได้");
    alert(e.message);
  }
}

// สร้างบทพูดจากเซิร์ฟเวอร์
async function generate(viewer = "") {
  setStatus("กำลังสร้างบทพูด...");

  let line;
  let mode = "โหมดตัวอย่าง";

  try {
    const response = await fetch("/api/line", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topic: $("topic")?.value || "",
        tone: $("tone")?.value || "",
        viewer
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "API Error");
    }

    line = data.line;
    mode = data.mode || "AI";
  } catch (error) {
    console.warn("AI API:", error);
    line = fallbackLine(viewer);
    mode = "โหมดตัวอย่าง";
  }

  if (!line) {
    line = fallbackLine(viewer);
  }

  $("line").value = line;
  setStatus("พร้อม • " + mode);

  say(line);
}

// ปุ่มสร้างบทพูด
$("speak")?.addEventListener("click", () => {
  generate().catch(error => {
    console.error(error);
    setStatus("เกิดข้อผิดพลาด");
  });
});

// ปุ่มตอบคอมเมนต์ตัวอย่าง
$("reply")?.addEventListener("click", () => {
  generate($("viewer")?.value?.trim() || "");
});

// อ่านข้อความ
$("say")?.addEventListener("click", () => {
  say($("line")?.value || "");
});

// หยุดเสียงทันที
$("stop")?.addEventListener("click", () => {
  if (timer) clearInterval(timer);

  timer = null;

  if (hasSpeech) speechSynthesis.cancel();

  speaking = false;
  $("mouth")?.classList.remove("talk");

  if ($("auto")) {
    $("auto").textContent = "เริ่มพูดวนอัตโนมัติ";
  }

  setStatus("หยุดการพูดแล้ว");
});

// พูดวนอัตโนมัติ
$("auto")?.addEventListener("click", () => {
  if (timer) {
    $("stop")?.click();
    return;
  }

  generate();

  timer = setInterval(() => {
    if (!speaking) generate();
  }, 40000);

  $("auto").textContent = "กำลังพูดอัตโนมัติ • แตะเพื่อหยุด";
});

// ล้างประวัติ
$("clear")?.addEventListener("click", async () => {
  $("line").value = "";

  try {
    await fetch("/api/reset", { method: "POST" });
  } catch (e) {
    console.warn(e);
  }

  setStatus("ล้างข้อความแล้ว");
});

// ตรวจสอบเซิร์ฟเวอร์
async function checkStatus() {
  try {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    setStatus(
      "พร้อม • " + (data.ai ? "เชื่อม AI แล้ว" : "โหมดตัวอย่าง")
    );
  } catch (e) {
    setStatus("เซิร์ฟเวอร์ AI ยังไม่ตอบสนอง");
  }
}

checkStatus();

// ลงทะเบียน Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  });
}
