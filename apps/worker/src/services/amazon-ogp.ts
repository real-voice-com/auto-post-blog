export interface AmazonProductInfo {
  url: string;
  label: string;
  title: string;
  image: string | null;
  price: string | null;
}

export async function fetchAmazonOGP(url: string, label: string): Promise<AmazonProductInfo> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      redirect: 'follow',
    });
    const html = await res.text();

    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return {
      url,
      label,
      title: titleMatch ? titleMatch[1] : label,
      image: imageMatch ? imageMatch[1] : null,
      price: null,
    };
  } catch {
    return { url, label, title: label, image: null, price: null };
  }
}
