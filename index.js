const express = require("express");
const fs = require("fs");
const { analyze, getReply } = require("./ai");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   🧠 حافظه‌ها
========================= */
const memory = {};
const carts = {};
const users = {};

/* =========================
   📲 تلگرام (اگر خواستی فعال کن)
========================= */
const TELEGRAM_TOKEN = "YOUR_BOT_TOKEN";
const CHAT_ID = "YOUR_CHAT_ID";

function sendTelegram(text) {
    if (!TELEGRAM_TOKEN || !CHAT_ID) return;

    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text
        })
    }).catch(() => {});
}

/* =========================
   👤 گرفتن کاربر
========================= */
function getUser(req) {
    return req.ip || "user1";
}

/* =========================
   🔐 Login
========================= */
app.post("/login", (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.json({ ok: false, msg: "username required" });
    }

    if (!users[username]) {
        users[username] = {
            cart: [],
            created: Date.now()
        };
    }

    res.json({ ok: true, user: username });
});

/* =========================
   💬 Chat AI
========================= */
app.post("/chat", (req, res) => {

    let text = req.body.message || "";
    let userId = getUser(req);

    if (!memory[userId]) {
        memory[userId] = { history: [], lastTopics: [] };
    }

    let a = analyze(text);
    let reply = getReply(a, text);

    memory[userId].history.push({ text, time: Date.now() });
    memory[userId].lastTopics.push(a);

    if (memory[userId].history.length > 20) {
        memory[userId].history.shift();
    }

    const tips = [
        "💡 برای انتخاب بهتر بگو سرور رو برای چی می‌خوای (سایت، AI، هاستینگ یا پروژه سنگین)",
        "🖥️ سرورهای HP G9 تا G12 داریم؛ هر کدوم کاربرد خاص دارن",
        "⚙️ می‌تونم بر اساس نیازت بهترین کانفیگ CPU Xeon + RAM ECC پیشنهاد بدم",
        "📦 اگر بودجه رو بگی دقیق‌تر راهنمایی می‌کنم",
        "🧠 برای AI معمولاً G12 بهترین انتخابه",
        "🚀 برای سایت G9 یا G10 کافیه",
        "🔥 سرورهای HP قابلیت ارتقا دارن (RAM / CPU / SSD / HDD)",
        "💰 انتخاب درست = هزینه کمتر و سرعت بیشتر"
    ];

    if (Math.random() > 0.6) {
        reply += "\n\n" + tips[Math.floor(Math.random() * tips.length)];
    }

    res.json({ reply });
});

/* =========================
   🛒 Order
========================= */
app.post("/order", (req, res) => {

    const { product, name, phone, cpu, ram } = req.body;

    const newOrder = {
        product,
        name,
        phone,
        cpu,
        ram,
        time: new Date().toISOString()
    };

    let data = [];

    try {
        data = JSON.parse(fs.readFileSync("orders.json"));
    } catch (e) {}

    data.push(newOrder);

    fs.writeFileSync("orders.json", JSON.stringify(data, null, 2));

    sendTelegram(`
🖥️ NEW ORDER

📦 Product: ${product}
👤 Name: ${name}
📞 Phone: ${phone}
⚙️ CPU: ${cpu}
🧠 RAM: ${ram}
`);

    res.json({ ok: true, msg: "✅ سفارش ثبت شد" });
});

/* =========================
   🛒 Cart
========================= */
app.post("/cart/add", (req, res) => {

    const { user, product } = req.body;

    if (!carts[user]) {
        carts[user] = [];
    }

    carts[user].push(product);

    res.json({ ok: true, msg: "🛒 اضافه شد به سبد خرید" });
});

app.get("/cart/:user", (req, res) => {

    const user = req.params.user;

    res.json({
        cart: carts[user] || []
    });
});

/* =========================
   📊 Admin Panel
========================= */
app.get("/admin", (req, res) => {

    const pass = req.query.pass;

    if (pass !== "1234") {
        return res.send("❌ Access Denied");
    }

    let data = [];

    try {
        data = JSON.parse(fs.readFileSync("orders.json"));
    } catch (e) {}

    let html = `
    <html>
    <head>
        <title>Admin Panel</title>
        <style>
            body{font-family:tahoma;background:#0f172a;color:white;padding:20px}
            .box{background:#1e293b;padding:15px;margin:10px;border-radius:10px}
            h1{color:#38bdf8}
        </style>
    </head>
    <body>
    <h1>📦 Orders Panel</h1>
    `;

    data.reverse().forEach(o => {
        html += `
        <div class="box">
            🖥️ <b>${o.product}</b><br>
            👤 ${o.name}<br>
            📞 ${o.phone}<br>
            ⚙️ CPU: ${o.cpu || "-"}<br>
            🧠 RAM: ${o.ram || "-"}<br>
            ⏰ ${o.time}
        </div>
        `;
    });

    html += "</body></html>";

    res.send(html);
});

/* =========================
   🚀 Server Start
========================= */
app.listen(3002, () => {
    console.log("Running on 3002");
});