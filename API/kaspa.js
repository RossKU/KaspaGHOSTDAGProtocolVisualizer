// Vercel Serverless Function to act as a proxy for the Kaspa REST API

export default async function handler(request, response) {
  // 1. フロントエンドから問い合わせたいエンドポイントを取得
  const { endpoint, id } = request.query;

  if (!endpoint) {
    return response.status(400).json({ error: 'Endpoint is required' });
  }

  // 2. 実際のKaspa APIのURLを構築
  let apiUrl = `https://api.kaspa.org/${endpoint}`;
  if (id) {
    apiUrl += `/${id}`;
  }

  try {
    // 3. サーバーとしてKaspa APIにリクエストを送信 (CORS制限なし)
    const kaspaResponse = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!kaspaResponse.ok) {
      // Kaspa APIがエラーを返した場合、そのエラーをフロントエンドに転送
      const errorText = await kaspaResponse.text();
      return response.status(kaspaResponse.status).json({ error: `Kaspa API Error: ${errorText}` });
    }

    // 4. 成功した場合、取得したJSONデータをフロントエンドに返す
    const data = await kaspaResponse.json();
    
    // Vercelがキャッシュするようにヘッダーを設定 (1秒間)
    response.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    
    response.status(200).json(data);

  } catch (error) {
    // ネットワークエラーなど、予期せぬエラーが発生した場合
    response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
