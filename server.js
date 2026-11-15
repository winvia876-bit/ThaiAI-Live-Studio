require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
const app = express();
app.use(express.json({limit:"20kb"}));
app.use(express.static(path.join(__dirname,"public")));
const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
let history = [];
const safeTopics = ["เรื่องขำขันในชีวิตประจำวัน","เรื่องเล่าชวนยิ้ม","คำถามชวนคุยกับผู้ชม","เกมทายใจและปริศนาเบา ๆ","เรื่องแปลกแต่จริงที่ตรวจสอบได้"];
const fallback = [
"สวัสดีครับทุกคน ยินดีต้อนรับเข้าสู่ไลฟ์ วันนี้มาพักสมอง คุยกันสบาย ๆ นะครับ",
"เคยไหมครับ ตั้งใจจะนอนเร็ว แต่พอจับโทรศัพท์เท่านั้นแหละ รู้ตัวอีกทีไก่ขันแล้ว",
"ขอถามหน่อยครับ ถ้าเลือกได้หนึ่งอย่าง ระหว่างกินของอร่อยฟรีตลอดชีวิต กับนอนหลับเต็มอิ่มทุกคืน จะเลือกอะไรครับ",
"มุกวันนี้อาจจะไม่คมมากนะครับ เพราะสมองผมยังโหลดไม่ครบ รอสัญญาณ Wi-Fi ก่อนครับ",
"ใครเพิ่งเข้ามาทักทายกันได้นะครับ วันนี้เรามาคุยกันแบบเป็นกันเอง สุภาพ และสนุกไปด้วยกันครับ"
];
app.get("/api/status",(_,res)=>res.json({ok:true,ai:!!client,mode:client?"OpenAI":"ตัวอย่างในระบบ",model:client?model:null}));
app.post("/api/line",async(req,res)=>{
  const topic=String(req.body.topic||"เรื่องเล่าสนุก ๆ").slice(0,240);
  const tone=String(req.body.tone||"ผู้ชายไทย เป็นกันเอง สุภาพ มีอารมณ์ขัน").slice(0,160);
  const viewer=String(req.body.viewer||"").slice(0,240);
  try{
    let line;
    if(client){
      const messages=[
        {role:"system",content:"คุณคือพิธีกร AI ผู้ชายไทยในไลฟ์บันเทิง พูดภาษาไทยธรรมชาติ เป็นกันเอง สุภาพ มีมุกเบา ๆ ตอบสั้น 1-3 ประโยค ห้ามเหยียด ห้ามคุกคาม ห้ามลามก ห้ามเปิดเผยข้อมูลส่วนตัว ห้ามชักชวนให้โอนเงินหรือซื้อสินค้านอกระบบ ห้ามแต่งข่าวหรืออ้างข้อเท็จจริงที่ไม่แน่ใจ หากผู้ชมถามเรื่องอันตรายหรือผิดกฎหมายให้ปฏิเสธอย่างสุภาพ"},
        ...history.slice(-8),
        {role:"user",content:`สร้างบทพูดสำหรับไลฟ์ในหัวข้อ "${topic}". สไตล์: ${tone}. ${viewer?`ตอบหรือกล่าวถึงข้อความผู้ชมนี้อย่างสุภาพ: ${viewer}`:"พูดต่อเนื่องชวนคนดูคุย"}. อย่าพูดซ้ำประโยคเดิม`}
      ];
      const out=await client.chat.completions.create({model,messages,temperature:0.85,max_tokens:130});
      line=out.choices?.[0]?.message?.content?.trim();
    }else{
      line=viewer?`ขอบคุณสำหรับคอมเมนต์นะครับ ${viewer} มาคุยกันต่อได้เลยครับ`:fallback[Math.floor(Math.random()*fallback.length)];
    }
    if(!line) throw new Error("AI ไม่ส่งข้อความกลับมา");
    history.push({role:"assistant",content:line}); history=history.slice(-10);
    res.json({line,mode:client?"OpenAI":"ตัวอย่างในระบบ"});
  }catch(e){res.status(500).json({error:"สร้างบทพูดไม่สำเร็จ",detail:e.message});}
});
app.post("/api/reset",(_,res)=>{history=[];res.json({ok:true});});
app.get("/overlay",(_,res)=>res.sendFile(path.join(__dirname,"public","overlay.html")));
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const port=process.env.PORT||3000;
app.listen(port,"0.0.0.0",()=>console.log(`ThaiAI Live Studio listening on ${port}`));
