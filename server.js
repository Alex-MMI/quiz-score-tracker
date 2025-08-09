const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_API_KEY = 'supersecret123'; // Твой пароль для админки — замени если нужно

// Инициализация БД
const db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) console.error('DB error:', err);
  else console.log('Connected to SQLite DB');
});

db.serialize(() => {
  // Таблица с заданиями
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      answer TEXT NOT NULL,
      points INTEGER NOT NULL
    )
  `);

  // Таблица с результатами
  db.run(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      task_id TEXT,
      points INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Добавляем задания (если их еще нет)
  const stmt = db.prepare('INSERT OR IGNORE INTO tasks (id, answer, points) VALUES (?, ?, ?)');

  stmt.run('task1', '42', 10);
  stmt.run('task2', 'привет', 15);
  stmt.run('task3', 'nodejs', 20);
  stmt.finalize();
});

// Проверка ответа
app.post('/api/check-answer', (req, res) => {
  const { task_id, answer, username } = req.body;

  if (!task_id || !answer) {
    return res.json({ correct: false, message: 'Отсутствует ID задания или ответ.' });
  }

  db.get('SELECT answer, points FROM tasks WHERE id = ?', [task_id], (err, task) => {
    if (err || !task) {
      return res.json({ correct: false, message: 'Задание не найдено.' });
    }

    // Сравниваем ответы без учета регистра и пробелов по краям
    const correctAnswer = task.answer.trim().toLowerCase();
    const userAnswer = answer.trim().toLowerCase();

    if (correctAnswer === userAnswer) {
      // Проверяем, не был ли этот пользователь уже засчитан за это задание
      if (username && username.trim()) {
        db.get(
          'SELECT * FROM results WHERE username = ? AND task_id = ?',
          [username.trim(), task_id],
          (err, row) => {
            if (row) {
              // Уже было начисление
              // Подсчитаем текущие баллы пользователя
              db.get(
                'SELECT SUM(points) as total FROM results WHERE username = ?',
                [username.trim()],
                (err, sumRow) => {
                  res.json({
                    correct: true,
                    message: 'Вы уже получили баллы за это задание.',
                    current_points: sumRow.total || 0,
                  });
                }
              );
            } else {
              // Запишем результат
              db.run(
                'INSERT INTO results (username, task_id, points) VALUES (?, ?, ?)',
                [username.trim(), task_id, task.points],
                (err) => {
                  if (err) {
                    return res.json({ correct: false, message: 'Ошибка базы данных.' });
                  }
                  db.get(
                    'SELECT SUM(points) as total FROM results WHERE username = ?',
                    [username.trim()],
                    (err, sumRow) => {
                      res.json({
                        correct: true,
                        message: `Правильно! +${task.points} баллов.`,
                        current_points: sumRow.total || 0,
                      });
                    }
                  );
                }
              );
            }
          }
        );
      } else {
        // Анонимный пользователь — баллы не сохраняем
        res.json({
          correct: true,
          message: `Правильно! Но баллы не сохраняются для анонимных.`,
          current_points: 0,
        });
      }
    } else {
      res.json({ correct: false, message: 'Неправильный ответ.' });
    }
  });
});

// Админская экспорт-функция
app.get('/api/admin/export', (req, res) => {
  const key = req.headers['x-api-key'];

  if (key !== ADMIN_API_KEY) {
    return res.status(403).send('Доступ запрещён');
  }

  db.all('SELECT username, SUM(points) as total_points FROM results WHERE username IS NOT NULL AND username != "" GROUP BY username ORDER BY total_points DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Ошибка базы данных');
    }

    let csv = 'Имя,Баллы\n';
    rows.forEach(r => {
      csv += `${r.username},${r.total_points}\n`;
    });

    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
