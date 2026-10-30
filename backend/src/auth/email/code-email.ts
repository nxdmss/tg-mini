import { CODE_IMAGE_HEIGHT, CODE_IMAGE_WIDTH, renderCodeImage } from './code-image';

const IMAGE_CID = 'verification-code@swagystan.ru';

export function createCodeEmail(code: string, expiresAt: Date) {
  const content = renderCodeImage(code);
  if (!Number.isFinite(expiresAt.getTime())) throw new Error('Invalid email expiry');
  const deadline = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(expiresAt);
  return {
    text: `${code}\n\n10 МИНУТ · ДО ${deadline} МСК`,
    html: `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>SWAGYSTAN</title></head>
<body bgcolor="#ffffff" style="margin:0;padding:0;background:#ffffff;color:#000000;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
<tr><td align="center" style="padding:80px 16px;">
<table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:480px;">
<tr><td align="center" style="padding:0 8px;">
<img src="cid:${IMAGE_CID}" alt="${code}" width="${CODE_IMAGE_WIDTH / 2}" height="${CODE_IMAGE_HEIGHT / 2}" style="display:block;width:100%;max-width:${CODE_IMAGE_WIDTH / 2}px;height:auto;border:0;color:#000000;font-family:'Courier New',monospace;font-size:48px;font-weight:bold;letter-spacing:4px;">
</td></tr>
<tr><td align="center" style="padding:28px 0 0;font-family:'Courier New',monospace;font-size:16px;font-weight:bold;line-height:24px;letter-spacing:2px;color:#000000;">10 МИНУТ</td></tr>
<tr><td align="center" style="padding:4px 0 0;font-family:'Courier New',monospace;font-size:12px;line-height:20px;letter-spacing:1px;color:#555555;">ДО ${deadline} МСК</td></tr>
</table>
</td></tr></table>
</body></html>`,
    attachments: [{ filename: 'code.png', content, contentType: 'image/png', cid: IMAGE_CID, contentDisposition: 'inline' as const }],
  };
}
