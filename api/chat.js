// api/chat.js
// 【診断用】あなたのキーで使えるモデル一覧を表示するコード

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS設定
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Vercelの設定か、直書きのキーを取得
    // ★もし直書きする場合は、下の "ここにキー" の部分に入れてください
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAAE0EQZcM0aa2qJy5TmBAkqW5Wx21aYZ8"; 

    if (!apiKey || apiKey === "ここに直書きしたキー") {
      throw new Error("APIキーが見つかりません。コード内の 'ここに直書きしたキー' の部分にキーを貼ってください。");
    }

    // ■ モデル一覧を取得するAPIを叩く
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`APIエラー: ${data.error.message}`);
    }

    // チャットに使えるモデル（generateContent対応）だけを抜き出す
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name) // 例: "models/gemini-1.5-flash"
      .join("\n");

    const reply = `【成功！あなたのキーで使えるモデル一覧】\n\n${models || "見つかりませんでした"}\n\n★この中にある名前（models/〇〇）を使えば100%動きます！`;

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: `【診断エラー】\n${error.message}` }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}