import express from "express";
import fetch from "node-fetch";  

const app = express();
app.use(express.json());

app.post("/translate", async (req, res) => {
  const { source_texts, target_language, context } = req.body;

  const prompt = `Translate the following texts into ${target_language}. Keep them suitable for a ${context}.\n\n` +
                 source_texts.map((t, i) => `${i+1}. ${t}`).join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const translatedText = data.choices[0].message.content;

    const translations = translatedText.split(/\n/).map(t => t.replace(/^\d+\.\s*/, "").trim());

    res.json({ translations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
