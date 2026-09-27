import {
  createHash,
  createHmac,
} from "node:crypto";

const ENDPOINT = (
  process.env.OBJECT_STORAGE_ENDPOINT ||
  "https://storage.yandexcloud.net"
).replace(/\/+$/, "");

const REGION =
  process.env.OBJECT_STORAGE_REGION ||
  "ru-central1";

function required(name) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name}`,
    );
  }

  return value;
}

function sha256Hex(value) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function hmac(key, value) {
  return createHmac(
    "sha256",
    key,
  )
    .update(value)
    .digest();
}

function signingKey(
  secret,
  date,
  region,
) {
  const dateKey =
    hmac(
      `AWS4${secret}`,
      date,
    );

  const regionKey =
    hmac(
      dateKey,
      region,
    );

  const serviceKey =
    hmac(
      regionKey,
      "s3",
    );

  return hmac(
    serviceKey,
    "aws4_request",
  );
}

function awsEncode(value) {
  return encodeURIComponent(
    value,
  ).replace(
    /[!'()*]/g,
    (character) =>
      `%${character
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()}`,
  );
}

function encodeKey(key) {
  return key
    .split("/")
    .map(awsEncode)
    .join("/");
}

function baseUrl(
  endpoint,
  bucket,
) {
  return (
    process.env
      .MEDIA_PUBLIC_BASE_URL
      ?.trim()
      .replace(/\/+$/, "") ||
    `${endpoint}/${awsEncode(
      bucket,
    )}`
  );
}

export async function putObject({
  key,
  body,
  contentType,
}) {
  const bucket =
    required(
      "OBJECT_STORAGE_BUCKET",
    );

  const accessKeyId =
    required(
      "OBJECT_STORAGE_ACCESS_KEY_ID",
    );

  const secretAccessKey =
    required(
      "OBJECT_STORAGE_SECRET_ACCESS_KEY",
    );

  const now = new Date();

  const amzDate =
    now
      .toISOString()
      .replace(
        /[:-]|\.\d{3}/g,
        "",
      );

  const date =
    amzDate.slice(0, 8);

  const host =
    new URL(
      ENDPOINT,
    ).host;

  const canonicalUri =
    `/${awsEncode(
      bucket,
    )}/${encodeKey(
      key,
    )}`;

  const payloadHash =
    sha256Hex(body);

  const cacheControl =
    "public, max-age=31536000, immutable";

  const canonicalHeaders = [
    `cache-control:${cacheControl}`,
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");

  const signedHeaders =
    "cache-control;content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope =
    `${date}/${REGION}/s3/aws4_request`;

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(
      canonicalRequest,
    ),
  ].join("\n");

  const signature =
    createHmac(
      "sha256",
      signingKey(
        secretAccessKey,
        date,
        REGION,
      ),
    )
      .update(
        stringToSign,
      )
      .digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response =
    await fetch(
      `${ENDPOINT}${canonicalUri}`,
      {
        method: "PUT",
        headers: {
          Authorization:
            authorization,
          "Cache-Control":
            cacheControl,
          "Content-Type":
            contentType,
          "x-amz-content-sha256":
            payloadHash,
          "x-amz-date":
            amzDate,
        },
        body,
      },
    );

  if (!response.ok) {
    throw new Error(
      `S3 PUT failed ${response.status}: ${(
        await response.text()
      ).slice(0, 500)}`,
    );
  }

  return `${baseUrl(
    ENDPOINT,
    bucket,
  )}/${encodeKey(key)}`;
}
