import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/translate", async (req, res) => {
  try {
    const { strings, target_language, context = "" } = req.body;

    if (!strings || typeof strings !== "object") {
      return res.status(400).json({ error: "Missing 'strings' object in request body" });
    }

    // Build a nice prompt
    const prompt = `You are an expert mobile app translator for friendly English learning apps.

App Name: Elo
Description: Elo helps non-native English speakers build vocabulary and improve speaking skills with fun lessons and an AI companion named Elo. Tone is encouraging, warm, simple, and motivating.

Translate the following UI strings from English to ${target_language}.

Important Rules:
- Return ONLY a valid JSON object with the exact same keys.
- Do not add any extra text, explanations, or markdown.
- Preserve placeholders exactly (%@, %lld, \\n, etc.).
- Keep English learning terms in English (vocabulary, streak, XP, level, speak, pronunciation, etc.).
- Make translations natural and friendly.

Strings to translate:
${JSON.stringify(strings, null, 2)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",        // cheaper and fast. Change to "gpt-4o" if you want higher quality
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid response from OpenAI");
    }

    const translatedText = data.choices[0].message.content.trim();

    // Try to parse the JSON returned by GPT
    let translations;
    try {
      translations = JSON.parse(translatedText);
    } catch (e) {
      // Fallback if GPT returns text instead of clean JSON
      translations = { error: "GPT did not return valid JSON", raw: translatedText };
    }

    res.json({ 
      success: true, 
      target_language,
      translations 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Translation failed" 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
