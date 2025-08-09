document.getElementById("sendBtn").addEventListener("click", async () => {
    const taskId = document.getElementById("taskId").value.trim();
    const answer = document.getElementById("answer").value.trim();
    const resultDiv = document.getElementById("result");

    if (!taskId || !answer) {
        resultDiv.textContent = "Заполните оба поля!";
        resultDiv.style.color = "red";
        return;
    }

    try {
        const res = await fetch("/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, answer })
        });

        const data = await res.json();
        resultDiv.textContent = data.message;
        resultDiv.style.color = data.correct ? "green" : "red";
    } catch {
        resultDiv.textContent = "Ошибка соединения с сервером!";
        resultDiv.style.color = "red";
    }
});
