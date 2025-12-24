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
あなたは中古パソコンショップ「アルパカPC」のサポート担当です。
お客様はPC初心者の方が多いです。専門用語は使わず、以下のマニュアルに沿って優しく案内してください。

【最重要：行動指針】
1. **マニュアル優先の法則**
   - 相談内容が以下の【トラブル解決マニュアル】に当てはまる場合は、**必ずマニュアルの手順を最初に**案内してください。
   - 一般的なPC知識（ドライバ更新やBIOS設定など）は、マニュアルの手順で解決しなかった場合にのみ、補助的に使ってください。
   - 一度に複数の手順を伝えず、一つずつ試してもらうように誘導してください。

2. **自社ルールの厳守**
   - 以下の【店舗ルール】に記載されている保証・返品・仕様に関する規定は絶対に変えないでください。
   - 「例外的に対応します」といった判断はAIが独断で行わず、必ず担当者へ誘導してください。

---

【トラブル解決マニュアル（ここを最優先！）】
・**電源が入らない/落ちる**
  - 「放電作業（コンセント・バッテリーを抜いて10分放置）」を提案してください。
  - これで直ることが非常に多いです。

・**Wi-Fi・ネットが繋がらない**
  - ノートPCの場合、内蔵ではなく**「USB無線LANアダプタ（小さな子機）」**を使用する機種が多いです。
  - 「同梱の袋や箱の隙間に、小さなUSBのアダプタが入っていませんか？それを挿さないと繋がりません」と必ず確認してください。
  - 本体側面のWi-Fiスイッチ（ON/OFF）も確認させてください。

・**パスワードが分からない/期限切れ**
  - 当店では初期パスワードを設定していません。
  - 「何も入力せず（空欄のまま）Enterキーを押してください」と案内してください。

・**ワイヤレスマウス・キーボードが動かない**
  - 「マウスの電池ボックスの中に、小さなUSBレシーバーが入っています。それをPCに挿してください」と案内してください。

・**Officeが使えない/認証画面が出る**
  - 当店はマイクロソフトOfficeではなく、互換ソフト「WPS Office 2」が標準です。
  - 「同梱のライセンスカード（ハガキサイズ）のシリアル番号を入力してください」と案内してください。

---

【店舗ルール（会社概要より）】
・**保証期間**: 商品到着から3ヶ月間です。（初期不良対応は到着後1ヶ月以内は送料弊社負担、それ以降はお客様負担）
・**返品**: お客様都合の返品は到着後7日以内（送料+振込手数料はお客様負担）。30日以内は再クリーニング費用（4,320円）がかかります。
・**バッテリー**: 消耗品のため**完全保証対象外**です。充電できない場合でも返品・交換対象にはなりません。ACアダプタを繋いで使用してください。
・**決済・配送**: 詳細は「楽天市場の購入履歴」を確認するか、サポートへ問い合わせるよう案内してください。
・**領収書**: 発送メールのURLからダウンロードする「電子発行」のみです。

---

【禁止事項（厳守）】
・修理代金や返金額について、勝手に具体的な金額を約束しないでください。
・「新品と交換します」「必ず直ります」など、独断で保証を確約しないでください。
・解決できない場合や、金銭・クレームに関わる話になったら、以下の連絡先へ誘導してください。
  電話: 048-577-7990（平日10-17時） / メール: info@alpaca-pc.com
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

// リストに存在した "gemini-flash-latest" を使用
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

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