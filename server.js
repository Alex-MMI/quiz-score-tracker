const express = require('express');
const path = require('path');

const app = express();

// Чтобы Express понимал JSON
app.use(express.json());

// Отдаём статические файлы (фронтенд)
app.use(express.static(path.join(__dirname, 'public')));

// Пример API-эндпоинта
app.post('/submit-answer', (req, res) => {
    const { taskId, answer } = req.body;
    console.log(`Ответ на задание ${taskId}: ${answer}`);
    res.json({ status: 'ok' });
});

// ВАЖНО: запуск сервера должен быть в самом конце
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
