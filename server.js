const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Статика
app.use(express.static(path.join(__dirname, 'public')));

// API для приёма ответов
app.post('/submit-answer', (req, res) => {
    const { taskId, answer } = req.body;
    console.log(`Ответ на задание ${taskId}: ${answer}`);
    res.json({ status: 'ok' });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
