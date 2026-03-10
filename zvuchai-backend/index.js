require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// ==========================================
// СПІЛЬНИЙ ПРОМПТ ДЛЯ ОБОХ ВАРІАНТІВ
// ==========================================
const getSystemPrompt = (currentTime, deadZoneConflict) => {
    let prompt = `You are the core AI planner engine for the 'Zvuchai' app.
Your task is to parse the user's voice transcript and extract structured task data.

CRITICAL RULES:
1. OUTPUT STRICTLY VALID RAW JSON. Do not include markdown formatting like \`\`\`json.
2. PRESERVE UKRAINIAN LANGUAGE: Fill the JSON string values (title, description, tags) in Ukrainian.
3. TITLE LIMIT: The "title" must be ultra-short (max 2-5 words). Example: "Зустріч з інвестором".
4. DESCRIPTION LIMIT: Only extra details. Do NOT repeat the title. If none, return "".
5. CURRENT SYSTEM TIME is ${currentTime}. Use this to calculate dates.
6. SCOPE: We only support 'task' creation.

JSON SCHEMA:
{
  "title": "Short title",
  "description": "Extra info",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "estimatedDuration": 60,
  "tags": ["робота"],
  "confidenceScore": 90
}`;

    if (deadZoneConflict) {
        prompt += `\nWARNING: User overrides rest time. Forcefully set the requested time.`;
    }
    return prompt;
};

// ==========================================
// ЕНДПОІНТ 1: ГОЛОС У ТЕКСТ (Через Groq)
// ==========================================
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Аудіофайл не знайдено" });

    try {
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, 'audio.m4a');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'uk');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
            body: formData
        });

        if (!response.ok) throw new Error("Помилка від Groq");
        const data = await response.json();
        res.status(200).json({ text: data.text });
    } catch (error) {
        console.error("Groq Error:", error);
        res.status(500).json({ error: "Не вдалося розпізнати голос" });
    }
});

// ==========================================
// ВАРІАНТ А: ПРЯМИЙ ЗАПИТ ДО GEMINI (Через Fetch, Стабільний v1)
// ==========================================
app.post('/api/parse-gemini', async (req, res) => {
    const { text, currentTime, deadZoneConflict } = req.body;
    const fullTextToAnalyze = getSystemPrompt(currentTime, deadZoneConflict) + "\n\nUSER TEXT TO PARSE:\n" + text;

    try {
        // Використовуємо стабільну версію API (v1) замість v1beta
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{ "text": fullTextToAnalyze }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini відхилив запит (Статус: ${response.status}). Деталі: ${errorText}`);
        }
        
        const data = await response.json();
        let rawContent = data.candidates[0].content.parts[0].text;
        const cleanJsonString = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        res.status(200).json(JSON.parse(cleanJsonString));
    } catch (error) {
        console.error("Direct Gemini Error:", error);
        res.status(500).json({ error: "Не вдалося розпарсити задачу через Gemini", details: error.message });
    }
});

// ==========================================
// ВАРІАНТ Б: ЗАПИТ ЧЕРЕЗ OPENROUTER (Через Fetch)
// ==========================================
app.post('/api/parse-openrouter', async (req, res) => {
    const { text, currentTime, deadZoneConflict } = req.body;
    const fullTextToAnalyze = getSystemPrompt(currentTime, deadZoneConflict) + "\n\nUSER TEXT TO PARSE:\n" + text;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://zvuchai.com', 
                'X-Title': 'Zvuchai App', 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Прибрали масив. Використовуємо один рядок, який автоматично знайде вільну модель
                "model": "openrouter/free",
                "messages": [
                    { "role": "user", "content": fullTextToAnalyze }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter відхилив запит (Статус: ${response.status}). Деталі: ${errorText}`);
        }
        
        const data = await response.json();
        let rawContent = data.choices[0].message.content;
        const cleanJsonString = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        res.status(200).json(JSON.parse(cleanJsonString));
    } catch (error) {
        console.error("OpenRouter Error:", error);
        res.status(500).json({ error: "Не вдалося розпарсити задачу через OpenRouter", details: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер Zvuchai успішно запущено на порту ${PORT}`);
    console.log(`Доступні ендпоінти:`);
    console.log(`- POST /api/transcribe`);
    console.log(`- POST /api/parse-gemini (ОСНОВНИЙ)`);
    console.log(`- POST /api/parse-openrouter (РЕЗЕРВНИЙ)`);
});