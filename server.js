const express = require("express");
const answers = require("./answers");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // раздаём index.html, style.css, script.js

app.post("/check", (req, res) => {
    const { taskId, answer } = req.body;
    if (!taskId || !answer) {
        return res.status(400).json({ message: "Заполните все поля" });
    }

    const correctAnswer = answers[taskId];
    if (!correctAnswer) {
        return res.status(404).json({ message: "Задание не найдено" });
    }

    const correct = correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
    res.json({ correct, message: correct ? "Верно!" : "Неверно" });
});

module.exports = app;
