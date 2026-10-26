export default async function handler(req, res) {
  const { url, image } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedRes = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'application/json,text/plain,*/*',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    if (!oembedRes.ok) {
      return res.status(oembedRes.status).json({ error: 'TikTok oEmbed failed' });
    }

    const data = await oembedRes.json();
    const thumbnailUrl = data.thumbnail_url;

    if (!thumbnailUrl) {
      return res.status(404).json({ error: 'No thumbnail found' });
    }

    if (image === '1') {
      const imgRes = await fetch(thumbnailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.tiktok.com/'
        },
        redirect: 'follow'
      });

      if (!imgRes.ok) {
        return res.status(imgRes.status).json({ error: 'Thumbnail image fetch failed' });
      }

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await imgRes.arrayBuffer());

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(buffer);
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      thumbnail_url: thumbnailUrl,
      title: data.title || null,
      author_name: data.author_name || null
    });
  } catch (error) {
    return res.status(500).json({
      error: 'TikTok thumbnail proxy failed',
      detail: String(error?.message || error)
    });
  }
}
