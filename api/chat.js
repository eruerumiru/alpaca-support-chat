// api/chat.js
// 安定性の高い Node.js ランタイムを使用

module.exports = async (req, res) => {
  // CORS設定（ブラウザからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プレフライトリクエスト（事前確認）への応答
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST以外は拒否
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 1. APIキーの確認
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Vercelに 'GEMINI_API_KEY' が設定されていません。\nSettings > Environment Variables を確認し、設定後に Redeploy してください。");
    }

    const { message, history } = req.body || {};

    // 2. システムプロンプト（AIへの指示）
    const systemPrompt = `
あなたは中古パソコンショップ「アルパカPC」のサポート担当です。
以下のマニュアルに基づき、短く的確に回答してください。

【トラブル解決マニュアル】
・電源が入らない → 「放電（電源コードを抜いて10分放置）」を提案。それでもダメなら修理。
・Wi-Fiが繋がらない → 「USB無線LANアダプタ（小さな子機）」が挿さっているか確認させる。
・パスワードが分からない → 「空欄のままEnterキー」を試させる。
・キーボード入力がおかしい → 「NumLock」キーを確認させる。
・解決しない場合 → 「恐れ入りますが、サポート（048-577-7990）までご連絡ください」と案内。

【回答のルール】
・お客様は初心者です。専門用語は避けてください。
・1回に1つのことだけを質問してください。
・マニュアルにないことは適当に答えず、サポートへ誘導してください。
`;

    // 3. Gemini API用のデータ作成
    // 過去の会話履歴をGemini形式に変換
    const contents = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 今回のメッセージを追加
    contents.push({
      role: "user",
      parts: [{ text: `システム指示: ${systemPrompt}\n\nユーザーの質問: ${message}` }]
    });

    // 4. Gemini APIを叩く
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      throw new Error(`Gemini API Error: ${apiRes.status} ${errorText}`);
    }

    const data = await apiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません、うまく回答を生成できませんでした。";

    // 成功！
    res.status(200).json({ reply });

  } catch (error) {
    console.error("API Error:", error);
    // エラー内容を画面に返す（デバッグ用）
    res.status(200).json({ reply: `【システムエラーが発生しました】\n${error.message}` });
  }
};