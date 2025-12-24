// api/chat.js
// Gemini 2.0 Flashモデルを使用（最新・高速！）

module.exports = async (req, res) => {
  // CORS設定（ブラウザからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プレフライトリクエストへの応答
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // ★ここに診断で成功したAPIキーを貼り付けてください！（""で囲む）
    const apiKey = "AIzaSyAAE0EQZcM0aa2qJy5TmBAkqW5Wx21aYZ8"; 
    
    if (!apiKey || apiKey.includes("ここに")) {
      throw new Error("コード内の★部分にAPIキーが貼り付けられていません！");
    }

    const { message, history } = req.body || {};

    // ■ システムプロンプト（AIへの指示書）
    // アルパカPCの店員になりきらせる設定です
    const systemPrompt = `
あなたは中古パソコンショップ「アルパカPC」のベテランサポート担当です。
以下のマニュアルに基づき、お客様（初心者）に優しく、短く回答してください。

【トラブル解決マニュアル】
・電源が入らない/落ちる → 「放電作業（コンセントを抜いて10分放置）」を提案。
・Wi-Fiが繋がらない → 「USB無線LANアダプタ（小さな子機）」が挿さっているか確認させる（内蔵じゃない機種が多いため）。
・パスワードが分からない/期限切れ → 「何も入力せず（空欄のまま）Enterキー」を試させる。
・キーボード入力がおかしい → 「NumLock」キーを確認させる。
・解決しない場合 → 「恐れ入りますが、詳細確認のためサポート（048-577-7990）までお電話ください」と案内。

【回答のルール】
・専門用語は使わず、初心者にもわかる言葉で。
・1回に1つのことだけを質問して、状況を絞り込んでください。
・マニュアルにないことは勝手に創作せず、サポートへ誘導してください。
`;

    // Gemini形式に変換
    const contents = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 今回のメッセージを追加
    contents.push({
      role: "user",
      parts: [{ text: `システム指示: ${systemPrompt}\n\nユーザーの質問: ${message}` }]
    });

// 一番安定している無料モデル (1.5-flash) に変更
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      throw new Error(`Gemini API Error: ${apiRes.status} ${errorText}`);
    }

    const data = await apiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "申し訳ありません、応答できませんでした。";

    res.status(200).json({ reply });

  } catch (error) {
    res.status(200).json({ reply: `【エラー】\n${error.message}` });
  }
};