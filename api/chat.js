// api/chat.js
// Gemini 1.5 Flashモデルを使用（高速・無料枠あり）

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { message, history } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key not found" }), { status: 500 });
  }

  // ■ 1. システムプロンプト（AIへの指示書）
  // 前回の内容をそのままGeminiに理解させます
  const systemPrompt = `
あなたは中古パソコンショップ「アルパカPC」のベテランサポート担当です。
以下の「トラブル解決マニュアル」に基づき、お客様の相談に乗ってください。

【マニュアル（知識）】
・電源が入らない時は、まず「放電（コンセント抜いて10分放置）」を提案する。
・Wi-Fiが繋がらない時は、まず「USB無線LANアダプタが挿さっているか」を確認する（内蔵じゃない機種が多い）。
・パスワードが分からない時は、「空欄でEnter」を試させる。
・キーボード不良は、強く押して直らなければ交換対応。
・それでもダメなら、以下の連絡先へ誘導する。
  メール: support@alpaca-pc.com
  電話: 048-577-7990

【ルール】
・口調は丁寧で、初心者にもわかりやすく。
・マニュアルにないことは勝手に創作せず、「詳細を確認しますのでサポートへご連絡ください」と案内する。
・一度にたくさんのことを言わず、一つずつ確認する。
`;

  // ■ 2. 会話履歴の変換
  // OpenAI形式 (user/assistant) を Gemini形式 (user/model) に変換します
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // 今回のユーザー発言を追加
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  // ■ 3. Gemini APIを叩く
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] }, // システム指示
        contents: contents,
        generationConfig: {
          temperature: 0.7, // 創造性の調整
          maxOutputTokens: 500,
        }
      })
    });

    const data = await response.json();

    // エラーハンドリング
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Geminiからの返答を取り出す
    const reply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}