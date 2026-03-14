export interface AmazonProductInfo {
  url: string;
  label: string;
  title: string;
  image: string | null;
  price: string | null;
}

/**
 * HMAC-SHA256 署名（SubtleCrypto を使用）
 */
async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return toHex(hash);
}

/**
 * amzn.to の短縮URLからASINを抽出する
 * amzn.to → amazon.co.jp にリダイレクトされるのでLocationヘッダーからASINを取得
 */
async function resolveAsin(shortUrl: string): Promise<string | null> {
  try {
    // HEADリクエストでリダイレクト先を確認
    const res = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const finalUrl = res.url;
    // /dp/ASIN or /gp/product/ASIN
    const asinMatch = finalUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    return asinMatch ? asinMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * PA-API 5.0 で商品情報を取得（AWS Signature V4）
 */
async function fetchFromPaApi(
  asin: string,
  accessKey: string,
  secretKey: string,
  associateTag: string
): Promise<{ title: string; image: string | null; price: string | null }> {
  const host = "webservices.amazon.co.jp";
  const region = "us-east-1";
  const path = "/paapi5/getitems";
  const target = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";

  const payload = JSON.stringify({
    ItemIds: [asin],
    PartnerTag: associateTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.co.jp",
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "Offers.Listings.Price",
    ],
  });

  // AWS Signature V4
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256Hex(payload);

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  // 署名キー生成
  const enc = new TextEncoder();
  const kDate = await hmacSha256(enc.encode("AWS4" + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, "ProductAdvertisingAPI");
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${path}`, {
    method: "POST",
    headers: {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=utf-8",
      host,
      "x-amz-date": amzDate,
      "x-amz-target": target,
      Authorization: authHeader,
    },
    body: payload,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("PA-API error:", res.status, errText);
    throw new Error(`PA-API returned ${res.status}`);
  }

  const data = (await res.json()) as {
    ItemsResult?: {
      Items?: Array<{
        ItemInfo?: { Title?: { DisplayValue?: string } };
        Images?: { Primary?: { Large?: { URL?: string } } };
        Offers?: { Listings?: Array<{ Price?: { DisplayAmount?: string } }> };
      }>;
    };
  };

  const item = data.ItemsResult?.Items?.[0];
  return {
    title: item?.ItemInfo?.Title?.DisplayValue ?? "",
    image: item?.Images?.Primary?.Large?.URL ?? null,
    price: item?.Offers?.Listings?.[0]?.Price?.DisplayAmount ?? null,
  };
}

/**
 * amzn.to URL → PA-API で商品情報を取得
 * 失敗時はラベルをタイトルとして返す（エラーは握りつぶす）
 */
export async function fetchAmazonOGP(
  url: string,
  label: string,
  accessKey?: string,
  secretKey?: string,
  associateTag?: string
): Promise<AmazonProductInfo> {
  // 認証情報がなければフォールバック
  if (!accessKey || !secretKey || !associateTag) {
    return { url, label, title: label, image: null, price: null };
  }

  try {
    const asin = await resolveAsin(url);
    if (!asin) {
      return { url, label, title: label, image: null, price: null };
    }

    const product = await fetchFromPaApi(asin, accessKey, secretKey, associateTag);
    return {
      url,
      label,
      title: product.title || label,
      image: product.image,
      price: product.price,
    };
  } catch (e) {
    console.error("fetchAmazonOGP error:", e);
    return { url, label, title: label, image: null, price: null };
  }
}
