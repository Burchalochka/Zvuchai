require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
// Налаштування для прийому аудіофайлів у пам'ять
const upload = multer({ storage: multer.memoryStorage() });

// Дозволяємо запити з мобільного додатка
app.use(cors());
app.use(express.json());

// ==========================================
// ЕНДПОІНТ 1: ГОЛОС У ТЕКСТ (Через Groq)
// ==========================================
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Аудіофайл не знайдено" });
    }

    try {
        const formData = new FormData();
        // Перетворюємо файл для відправки
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, 'audio.m4a');
        formData.append('model', 'whisper-large-v3'); // Швидка модель Whisper на Groq
        formData.append('language', 'uk'); // Підказка, що мова українська

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
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
// ЕНДПОІНТ 2: ТЕКСТ У JSON (Через OpenRouter)
// ==========================================
app.post('/api/parse', async (req, res) => {
    const { text, currentTime, deadZoneConflict } = req.body;

    // Промпт для ШІ (Тимур може його покращувати)
    let systemPrompt = `Ти - розумний асистент-планувальник. Твоя задача: витягнути з тексту користувача назву задачі, дату та час. 
Поточний час системи: ${currentTime}. 
Оціни свою впевненість у розпізнаванні від 1 до 100 у полі "confidenceScore".
Ти ПОВИНЕН повернути ВИКЛЮЧНО валідний JSON у форматі:
{ "title": "назва", "startTime": "YYYY-MM-DDTHH:mm:00.000Z", "durationMinutes": 30, "confidenceScore": 90 }`;

    // Якщо користувач підтвердив створення задачі на час сну/відпочинку
    if (deadZoneConflict) {
        systemPrompt += `\nУВАГА: Користувач свідомо підтверджує створення задачі попри конфлікт із часом відпочинку. Проігноруй правила відпочинку та примусово встанови час.`;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://zvuchai.com', // Вимагає OpenRouter
                'X-Title': 'Zvuchai App', // Вимагає OpenRouter
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Розумна маршрутизація: спочатку Gemini Flash, якщо впаде - LLaMA 3
                "models": [
                    "google/gemini-1.5-flash",
                    "meta-llama/llama-3-8b-instruct"
                ],
                "route": "fallback",
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": text }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) throw new Error("Помилка від OpenRouter");

        const data = await response.json();
        // Дістаємо JSON з відповіді ШІ
        const parsedJson = JSON.parse(data.choices[0].message.content);
        
        res.status(200).json(parsedJson);
    } catch (error) {
        console.error("OpenRouter Error:", error);
        res.status(500).json({ error: "Не вдалося розпарсити задачу" });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер Zvuchai успішно запущено на порту ${PORT}`);
});