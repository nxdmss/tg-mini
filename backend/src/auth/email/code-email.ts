import { EMAIL_IMAGE_HEIGHT, EMAIL_IMAGE_WIDTH, renderEmailImage } from './code-image';

const IMAGE_CID = 'verification-code@swagystan.ru';

export function createCodeEmail(code: string, expiresAt: Date) {
  if (!Number.isFinite(expiresAt.getTime())) throw new Error('Invalid email expiry');
  const deadline = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(expiresAt);
  const content = renderEmailImage(code, deadline);
  return {
    text: `${code}\n\n10 МИНУТ · ДО ${deadline} МСК`,
    html: `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>SWAGYSTAN</title></head>
<body bgcolor="#ffffff" style="margin:0;padding:0;background:#ffffff;color:#000000;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
<tr><td align="center" bgcolor="#ffffff" style="padding:0;background:#ffffff;font-size:0;line-height:0;">
<img src="cid:${IMAGE_CID}" alt="${code} · 10 МИНУТ · ДО ${deadline} МСК" width="${EMAIL_IMAGE_WIDTH / 2}" height="${EMAIL_IMAGE_HEIGHT / 2}" style="display:block;width:100%;height:auto;border:0;background:#ffffff;color:#000000;font-family:monospace;font-size:20px;line-height:1.5;">
</td></tr>
</table>
</body></html>`,
    attachments: [{ filename: 'code.png', content, contentType: 'image/png', cid: IMAGE_CID, contentDisposition: 'inline' as const }],
  };
}
