export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'TikTok oEmbed failed' });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      thumbnail_url: data.thumbnail_url || null,
      title: data.title || null,
      author_name: data.author_name || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Thumbnail fetch failed' });
  }
}
