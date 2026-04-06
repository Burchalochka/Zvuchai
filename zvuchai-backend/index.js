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

BUSINESS RULES FOR TASK SCHEDULING:
A. UNIVERSAL INBOX RULE: ANY task that DOES NOT have a specific time of day (hours/minutes) MUST be flagged as "isInbox": true. This applies even if the task has a specific date ("tomorrow") or a deadline ("by Wednesday"). If there is no clock time, it goes to the Inbox. When isInbox is true, set startTime and endTime to null.
B. DATE RANGES (EXTENDED DEADLINES): If the user says "this week", "this month", or "by Wednesday", recognize it as a date range. Calculate appropriate startDate and endDate:
   - "this week": startDate = Monday of current week, endDate = Sunday of current week
   - "this month": startDate = 1st day of current month, endDate = last day of current month
   - "by Wednesday": deadline = next Wednesday at end of day (23:59), startDate = today
   For date ranges, if there's no specific time, isInbox MUST be true and startTime/endTime must be null.
C. TODAY RULE: If the user says "today" (e.g., "wash car today") but mentions no specific time, provide today's date (based on CURRENT SYSTEM TIME). Since there's no clock time, isInbox MUST be true. Set startTime and endTime to null.
D. DEADLINE RULE: If the user provides a deadline with time (e.g., "finish lab by 8 PM"), extract the deadline into the "deadline" field as "YYYY-MM-DD HH:MM". If the deadline has a specific time, isInbox is false. If deadline is just a date without time, isInbox MUST be true.

TIME HANDLING:
- If user provides specific time (e.g., "at 3 PM"), extract it into startTime and calculate endTime as startTime + 1 hour. isInbox is false.
- If user provides both start and end times, use them as provided. isInbox is false.
- If user says "all day", "цілий день", "весь день", or similar phrases indicating the task takes the whole day, set startTime to "07:00", endTime to "21:00" (14-hour block), and isInbox to false.
- If no time information is provided, set startTime and endTime to null and isInbox MUST be true.

NO DEADLINE RULE: If there is no date and no time ("buy milk"), "isInbox": true, and all dates/times are null.

JSON SCHEMA:
{
  "title": "Short title",
  "description": "Extra info",
  "date": "YYYY-MM-DD" or null,  // For single-day tasks
  "startDate": "YYYY-MM-DD" or null,  // For date ranges (start of range)
  "endDate": "YYYY-MM-DD" or null,    // For date ranges (end of range)
  "startTime": "HH:MM" or null,
  "endTime": "HH:MM" or null,
  "deadline": "YYYY-MM-DD HH:MM" or null,
  "estimatedDuration": 60,
  "isInbox": false,  // MUST be true if startTime is null
  "tags": ["робота"],
  "confidenceScore": 90
}`;

    if (deadZoneConflict) {
        prompt += `\nWARNING: User overrides rest time. Forcefully set the requested time.`;
    }
    return prompt;
};

// ==========================================
// ЕНДПОІНТ 1: ПЕРЕВІРКА МЕРЕЖІ ТА ТРАНСКРИБЦІЯ
// ==========================================
app.get('/health', (req, res) => {
  res.status(200).send('OK - Server is alive!');
});

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
// СУПЕР-ЕНДПОІНТ: АУДІО -> ГОТОВИЙ JSON (Повний цикл)
// Ендпоінт: /api/process-audio
// ==========================================
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Аудіофайл не знайдено" });
    }

    const { currentTime, deadZoneConflict } = req.body;
    const isDeadZone = deadZoneConflict === 'true'; 

    // 🎛 ГОЛОВНИЙ ПЕРЕМИКАЧ МОДЕЛЕЙ:
    // true = платний швидкий DeepSeek
    // false = безкоштовний OpenRouter
    const USE_DEEPSEEK = true; 

    try {
        console.log("Етап 1: Відправляємо аудіо на Groq...");
        
        const groqFormData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        groqFormData.append('file', blob, 'audio.m4a');
        groqFormData.append('model', 'whisper-large-v3');
        groqFormData.append('language', 'uk');

        const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
            body: groqFormData
        });

        if (!groqResponse.ok) throw new Error("Помилка розпізнавання голосу від Groq");
        const groqData = await groqResponse.json();
        const recognizedText = groqData.text;
        
        console.log(`Розпізнано текст: "${recognizedText}"`);
        console.log(`Етап 2: Відправляємо текст на ${USE_DEEPSEEK ? 'DeepSeek (Платний)' : 'OpenRouter (Безкоштовний)'}...`);

        const systemPrompt = getSystemPrompt(currentTime, isDeadZone);
        let finalTask;

        if (USE_DEEPSEEK) {
            // ПЛАТНИЙ DEEPSEEK
            const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": "deepseek-chat",
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        { "role": "user", "content": recognizedText }
                    ],
                    "response_format": { "type": "json_object" }
                })
            });

            if (!aiResponse.ok) throw new Error(`Помилка DeepSeek: ${await aiResponse.text()}`);
            const aiData = await aiResponse.json();
            
            let rawContent = aiData.choices[0].message.content;
            const cleanJsonString = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
            finalTask = JSON.parse(cleanJsonString);

        } else {
            //  БЕЗКОШТОВНИЙ OPENROUTER
            const fullTextToAnalyze = systemPrompt + "\n\nUSER TEXT TO PARSE:\n" + recognizedText;
            
            const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://zvuchai.com', 
                    'X-Title': 'Zvuchai App', 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": "openrouter/free",
                    "messages": [
                        { "role": "user", "content": fullTextToAnalyze }
                    ]
                })
            });

            if (!aiResponse.ok) throw new Error(`Помилка OpenRouter: ${await aiResponse.text()}`);
            const aiData = await aiResponse.json();
            
            let rawContent = aiData.choices[0].message.content;
            const cleanJsonString = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
            finalTask = JSON.parse(cleanJsonString);
        }

        console.log("Успіх! Задача згенерована.");

        // --- ЕТАП 3: Віддаємо результат фронтенду ---
        res.status(200).json({
            originalText: recognizedText,
            task: finalTask
        });

    } catch (error) {
        console.error("Помилка в пайплайні process-audio:", error);
        res.status(500).json({ error: "Не вдалося обробити голосове повідомлення", details: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер Zvuchai успішно запущено на порту ${PORT}`);
    console.log(`Доступні ендпоінти:`);
    console.log(`- GET  /health`);
    console.log(`- POST /api/process-audio (ПОВНИЙ ЦИКЛ ГОЛОС -> ЗАДАЧА)`);
});