/**
 * CodeUp — Edge Function `chat-ai` (Gemini).
 * Deploy: `supabase functions deploy chat-ai`
 * Secrets: GEMINI_API_KEY; опційно GEMINI_MODEL (напр. gemini-2.5-flash).
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Педагогіка CodeUp: теорія й розуміння помилок — без повного готового розв’язку вправ платформи. */
const CODEUP_PEDAGOGY_UK = `Жорсткі правила чесності навчання:
1) Не видавай повний готовий розв’язок жодної вправи, завдання чи практикуму з платформи CodeUp (включно з кодом «під ключ», який одразу проходить перевірку автотестів). Якщо просять саме це — відмовся ввічливо й коротко поясни, навіщо важливо спробувати самостійно.
2) Дозволено й заохочується: пояснювати теорію, синтаксис, поняття; розбирати повідомлення про помилки та типові причини; підказувати загальний підхід до пошуку помилки; пропонувати невеликі нейтральні приклади, які не копіюють умову конкретної вправи; структурувати думку (кроки, план, псевдокод без повного робочого коду під їхню задачу).
3) Не підміняй учня на змаганнях чи оцінюванні: не генеруй відповідь «як для здачі» замість навчальної допомоги.

Тон: коротко, доброзичливо, без зверхності.`;

type ChatMsg = { role: string; content: string };

function buildGeminiBody(messages: ChatMsg[]) {
  const systemIntro =
    "You are a concise, friendly tutor for JavaScript and the CodeUp learning module. Prefer short paragraphs and code examples when useful for understanding theory — not as a drop-in solution for a specific CodeUp exercise. Answer in Ukrainian unless the student writes in another language.\n\n" +
    CODEUP_PEDAGOGY_UK;

  const systemParts: string[] = [systemIntro];
  let rest = [...messages];

  while (rest.length && rest[0].role === "assistant") {
    systemParts.push("Earlier assistant message (context):\n" + rest[0].content);
    rest = rest.slice(1);
  }

  const mapped = rest
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      text: (m.content ?? "").trim(),
    }))
    .filter((m) => m.text.length > 0);

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of mapped) {
    const last = contents[contents.length - 1];
    if (last && last.role === m.role) {
      last.parts[0].text += "\n\n" + m.text;
    } else {
      contents.push({ role: m.role, parts: [{ text: m.text }] });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Привіт" }] });
  }
  if (contents[0].role === "model") {
    systemParts.push("Context:\n" + contents[0].parts[0].text);
    contents.shift();
  }
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Привіт" }] });
  }

  return {
    systemInstruction: { parts: [{ text: systemParts.join("\n\n") }] },
    contents,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: auth } },
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!geminiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set on the function" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: { messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages[] is required" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const model = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-2.0-flash";
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const geminiBody = buildGeminiBody(messages);

  const geminiRes = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey,
    },
    body: JSON.stringify({
      ...geminiBody,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  const raw = await geminiRes.text();
  let parsed: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string; code?: number; status?: string };
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return new Response(JSON.stringify({ error: raw || "Gemini returned non-JSON" }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!geminiRes.ok) {
    const msg = parsed.error?.message ?? raw ?? geminiRes.statusText;
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const text =
    parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim() ?? "";

  if (!text) {
    return new Response(
      JSON.stringify({
        error: "Empty model response (Gemini may have blocked the reply; try rephrasing or check API logs).",
      }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ reply: text }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
