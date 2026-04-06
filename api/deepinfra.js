const MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';
const ENDPOINT = 'https://api.deepinfra.com/v1/openai/chat/completions';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.DEEPINFRA_API_KEY) {
    res.status(500).json({ error: 'DeepInfra API key not configured' });
    return;
  }

  let prompt;
  try {
    ({ prompt } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 320,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are Alex Williamson’s personal CSCS/physical therapy coach. Provide specific, actionable training adjustments that respect Whoop recovery status, morning weight trends, and the programmed sessions. Stay concise: max two bullet points.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: text || 'DeepInfra error' });
      return;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content?.trim();
    if (!message) {
      res.status(502).json({ error: 'DeepInfra returned no content' });
      return;
    }

    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message || 'DeepInfra request failed' });
  }
};
