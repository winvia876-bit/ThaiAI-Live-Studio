
"use strict";

/* =====================================
   ThaiAI LIVE STUDIO - COMPLETE APP.JS
   Thai Male Host: P'Ton
===================================== */

const $ = id => document.getElementById(id);

let timer = null;
let voices = [];
let speaking = false;
let generating = false;
let currentUtterance = null;
let lastLine = "";

/* ---------- STATUS ---------- */

function setStatus(message) {
  const el = $("status");
  if (el) el.textContent = message;
}

function setMouth(active) {
  $("mouth")?.classList.toggle("talk", active);
}

/* ---------- SPEECH SUPPORT ---------- */

const hasSpeech =
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

function loadVoices() {
  if (!hasSpeech) return [];
  voices = window.speechSynthesis.getVoices() || [];
  return voices;
}

if (hasSpeech) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/* รอ Android โหลดเสียง */

async function getThaiVoice() {
  if (!hasSpeech) {
    throw new Error("เบราว์เซอร์ไม่รองรับระบบเสียง");
  }

  let available = loadVoices();

  if (!available.length) {
    await new Promise(resolve => {
      let finished = false;

      const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        window.speechSynthesis.removeEventListener(
          "voiceschanged", done
        );
        resolve();
      };

      const timeout = setTimeout(done, 3000);

      window.speechSynthesis.addEventListener(
        "voiceschanged", done
      );
    });

    available = loadVoices();
  }

  const thaiVoice = available.find(v =>
    v.lang?.toLowerCase().replace("_", "-") === "th-th"
  ) || available.find(v =>
    v.lang?.toLowerCase().replace("_", "-").startsWith("th-")
  );

  if (!thaiVoice) {
    throw new Error(
      "ไม่พบเสียงภาษาไทย กรุณาติดตั้งเสียงภาษาไทยใน Android แล้วเปิด Chrome ใหม่"
    );
  }

  return thaiVoice;
}

/* ---------- STOP SPEECH ---------- */

function stopSpeech() {
  if (hasSpeech) {
    window.speechSynthesis.cancel();
  }

  currentUtterance = null;
  speaking = false;
  setMouth(false);
}

/* ---------- SPEAK THAI ---------- */

async function say(line) {
  line = String(line || "").trim();

  if (!line) {
    setStatus("ไม่มีข้อความให้อ่าน");
    return false;
  }

  if (!hasSpeech) {
    setStatus("อุปกรณ์ไม่รองรับระบบเสียง");
    return false;
  }

  try {
    const thaiVoice = await getThaiVoice();

    stopSpeech();

    // ให้เบราว์เซอร์มีเวลายกเลิกเสียงเดิม
    await new Promise(resolve => setTimeout(resolve, 100));

    const utterance = new SpeechSynthesisUtterance(line);

    utterance.voice = thaiVoice;
    utterance.lang = "th-TH";
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    currentUtterance = utterance;

    utterance.onstart = () => {
      speaking = true;
      setMouth(true);
      setStatus("พี่ต้นกำลังพูดภาษาไทย");
    };

    utterance.onend = () => {
      speaking = false;
      setMouth(false);
      currentUtterance = null;
      setStatus("พร้อม • พูดจบแล้ว");
    };

    utterance.onerror = event => {
      speaking = false;
      setMouth(false);
      currentUtterance = null;

      if (event.error !== "canceled" &&
          event.error !== "interrupted") {
        setStatus("ระบบเสียงขัดข้อง: " + event.error);
      }
    };

    window.speechSynthesis.speak(utterance);

    try {
      localStorage.setItem("thaiLiveLastLine", line);
    } catch (e) {}

    return true;

  } catch (error) {
    stopSpeech();
    setStatus(error.message);
    alert(error.message);
    return false;
  }
}

/* ---------- FALLBACK THAI CONTENT ---------- */

function fallbackLine(viewer = "") {
  if (viewer) {
    return `สวัสดีครับคุณ ${viewer} ยินดีต้อนรับเข้าสู่ไลฟ์ของพี่ต้นครับ ขอบคุณที่เข้ามาทักทายกันนะครับ`;
  }

  const topic =
    $("topic")?.value?.trim() ||
    "เรื่องราวในชีวิตประจำวัน";

  const lines = [
    `สวัสดีครับทุกคน วันนี้พี่ต้นจะมาเล่าเรื่อง ${topic} ให้ทุกคนฟังครับ`,
    "ยินดีต้อนรับทุกคนเข้าสู่ไลฟ์นะครับ ใครเข้ามาแล้วฝากทักทายกันด้วยครับ",
    "วันนี้ใครเหนื่อยจากการทำงานบ้างครับ เข้ามาพักผ่อนและหัวเราะด้วยกันนะครับ",
    "พี่ต้นมีคำถามครับ ระหว่างนอนต่ออีกห้านาทีกับตื่นไปทำงาน ทุกคนเลือกอะไรครับ",
    "อย่าลืมยิ้มให้ตัวเองทุกวันนะครับ เพราะรอยยิ้มเป็นกำลังใจที่ดีที่สุดครับ",
    "ขอบคุณทุกคนที่เข้ามารับชมครับ อยู่พูดคุยเป็นเพื่อนกันก่อนนะครับ"
  ];

  return lines[Math.floor(Math.random() * lines.length)];
}

/* ---------- GENERATE AI LINE ---------- */

async function generate(viewer = "") {
  if (generating) return;

  generating = true;
  setStatus("กำลังสร้างบทพูด...");

  try {
    let line = "";
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
          viewer: viewer
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "API Error");
      }

      if (typeof data.line !== "string" ||
          !data.line.trim()) {
        throw new Error("AI ไม่ได้ส่งบทพูดกลับมา");
      }

      line = data.line.trim();
      mode = data.mode || "AI";

    } catch (error) {
      console.warn("AI API Error:", error);

      line = fallbackLine(viewer);
      mode = "โหมดตัวอย่าง";
    }

    lastLine = line;

    const output = $("line");

    if (output) {
      output.value = line;
    }

    setStatus("สร้างบทพูดสำเร็จ • " + mode);

    return await say(line);

  } finally {
    generating = false;
  }
}

/* ---------- GENERATE BUTTON ---------- */

$("speak")?.addEventListener("click", async () => {
  await generate();
});

/* ---------- REPLY BUTTON ---------- */

$("reply")?.addEventListener("click", async () => {
  const viewer = $("viewer")?.value?.trim() || "";

  if (!viewer) {
    setStatus("กรุณาพิมพ์ข้อความตัวอย่างก่อน");
    alert("กรุณาพิมพ์ข้อความตัวอย่าง เช่น สวัสดีครับพี่ต้น");
    return;
  }

  await generate(viewer);
});

/* ---------- READ TEXT BUTTON ---------- */

$("say")?.addEventListener("click", async () => {
  const line = $("line")?.value?.trim() || "";
  await say(line);
});

/* ---------- EMERGENCY STOP ---------- */

$("stop")?.addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  stopSpeech();

  if ($("auto")) {
    $("auto").textContent = "เริ่มพูดวนอัตโนมัติ";
  }

  setStatus("หยุดเสียงฉุกเฉินแล้ว");
});

/* ---------- AUTO SPEAK ---------- */

$("auto")?.addEventListener("click", async () => {
  if (timer) {
    $("stop")?.click();
    return;
  }

  if (generating) return;

  $("auto").textContent =
    "กำลังพูดอัตโนมัติ • แตะเพื่อหยุด";

  setStatus("เริ่มระบบพูดอัตโนมัติ");

  await generate();

  timer = setInterval(async () => {
    if (!speaking && !generating) {
      await generate();
    }
  }, 40000);
});

/* ---------- CLEAR HISTORY ---------- */

$("clear")?.addEventListener("click", async () => {
  stopSpeech();

  if ($("line")) {
    $("line").value = "";
  }

  lastLine = "";

  try {
    await fetch("/api/reset", {
      method: "POST"
    });
  } catch (error) {
    console.warn(error);
  }

  setStatus("ล้างประวัติเรียบร้อย");
});

/* ---------- SERVER STATUS ---------- */

async function checkStatus() {
  try {
    const response = await fetch("/api/status");

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    setStatus(
      "พร้อม • " +
      (data.ai ? "เชื่อมต่อ AI แล้ว" : "โหมดตัวอย่าง")
    );

  } catch (error) {
    setStatus("เซิร์ฟเวอร์ยังไม่ตอบสนอง");
  }
}

/* ---------- INITIALIZATION ---------- */

async function initialize() {
  if (hasSpeech) {
    loadVoices();
  }

  await checkStatus();

  try {
    const saved = localStorage.getItem("thaiLiveLastLine");

    if (saved && $("line") && !$("line").value) {
      $("line").value = saved;
    }
  } catch (error) {}

  console.log("ThaiAI Live Studio initialized");
}

initialize();

/* ---------- SERVICE WORKER ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(error => console.warn("SW:", error));
  });
}

/* ---------- END ---------- */
