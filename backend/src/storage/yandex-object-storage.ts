import {
  createHash,
  createHmac,
  randomUUID,
} from 'node:crypto';
import { extname } from 'node:path';

const DEFAULT_ENDPOINT =
  'https://storage.yandexcloud.net';

const DEFAULT_REGION =
  'ru-central1';

function requiredEnv(name: string) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing ${name}`,
    );
  }

  return value;
}

function sha256Hex(
  value: string | Buffer,
) {
  return createHash('sha256')
    .update(value)
    .digest('hex');
}

function hmac(
  key: Buffer | string,
  value: string,
) {
  return createHmac(
    'sha256',
    key,
  )
    .update(value)
    .digest();
}

function signingKey(
  secret: string,
  date: string,
  region: string,
) {
  const dateKey = hmac(
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
      's3',
    );

  return hmac(
    serviceKey,
    'aws4_request',
  );
}

function awsEncode(
  value: string,
) {
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

function encodeKey(
  key: string,
) {
  return key
    .split('/')
    .map(awsEncode)
    .join('/');
}

function extensionFor(
  contentType: string,
  originalName?: string,
) {
  const original =
    originalName
      ? extname(
          originalName,
        )
          .toLowerCase()
          .replace(
            /[^a-z0-9.]/g,
            '',
          )
      : '';

  if (
    original &&
    original.length <= 10
  ) {
    return original;
  }

  const normalized =
    contentType
      .split(';')[0]
      .trim()
      .toLowerCase();

  const byType:
    Record<
      string,
      string
    > = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/avif': '.avif',
    };

  return (
    byType[normalized] ??
    '.bin'
  );
}

function publicBaseUrl(
  endpoint: string,
  bucket: string,
) {
  const configured =
    process.env
      .MEDIA_PUBLIC_BASE_URL
      ?.trim()
      .replace(/\/+$/, '');

  if (configured) {
    return configured;
  }

  return `${endpoint.replace(
    /\/+$/,
    '',
  )}/${awsEncode(bucket)}`;
}

export async function uploadProductImage(
  body: Buffer,
  contentType = 'application/octet-stream',
  originalName?: string,
) {
  const endpoint = (
    process.env
      .OBJECT_STORAGE_ENDPOINT ||
    DEFAULT_ENDPOINT
  ).replace(/\/+$/, '');

  const region =
    process.env
      .OBJECT_STORAGE_REGION ||
    DEFAULT_REGION;

  const bucket =
    requiredEnv(
      'OBJECT_STORAGE_BUCKET',
    );

  const accessKeyId =
    requiredEnv(
      'OBJECT_STORAGE_ACCESS_KEY_ID',
    );

  const secretAccessKey =
    requiredEnv(
      'OBJECT_STORAGE_SECRET_ACCESS_KEY',
    );

  const now =
    new Date();

  const amzDate =
    now
      .toISOString()
      .replace(
        /[:-]|\.\d{3}/g,
        '',
      );

  const date =
    amzDate.slice(
      0,
      8,
    );

  const extension =
    extensionFor(
      contentType,
      originalName,
    );

  const month =
    now
      .toISOString()
      .slice(0, 7);

  const key =
    `products/${month}/${randomUUID()}${extension}`;

  const host =
    new URL(endpoint).host;

  const canonicalUri =
    `/${awsEncode(
      bucket,
    )}/${encodeKey(
      key,
    )}`;

  const payloadHash =
    sha256Hex(body);

  const cacheControl =
    'public, max-age=31536000, immutable';

  const canonicalHeaders = [
    `cache-control:${cacheControl}`,
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
  ].join('\n');

  const signedHeaders =
    'cache-control;content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope =
    `${date}/${region}/s3/aws4_request`;

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(
      canonicalRequest,
    ),
  ].join('\n');

  const signature =
    createHmac(
      'sha256',
      signingKey(
        secretAccessKey,
        date,
        region,
      ),
    )
      .update(
        stringToSign,
      )
      .digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response =
    await fetch(
      `${endpoint}${canonicalUri}`,
      {
        method: 'PUT',
        headers: {
          Authorization:
            authorization,
          'Cache-Control':
            cacheControl,
          'Content-Type':
            contentType,
          'x-amz-content-sha256':
            payloadHash,
          'x-amz-date':
            amzDate,
        },
        body,
      },
    );

  if (!response.ok) {
    const detail =
      await response
        .text()
        .catch(
          () => '',
        );

    throw new Error(
      `Object Storage upload failed (${response.status}): ${detail.slice(
        0,
        500,
      )}`,
    );
  }

  return `${publicBaseUrl(
    endpoint,
    bucket,
  )}/${encodeKey(key)}`;
}
