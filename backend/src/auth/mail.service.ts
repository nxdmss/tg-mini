import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendCode(email: string, code: string, purpose: string) {
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM)
      throw new ServiceUnavailableException('Отправка писем пока недоступна');
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465,
      requireTLS: true, auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true });
    try {
      const result = await transport.sendMail({ from: SMTP_FROM, to: email,
        subject: purpose === 'register' ? 'SWAGYSTAN · Подтверждение почты' : 'SWAGYSTAN · Восстановление пароля',
        text: `Код: ${code}\n\nДействует 10 минут. Никому не сообщайте код.\nЕсли вы не отправляли запрос, просто проигнорируйте письмо.` });
      if (!result.accepted.length) throw new Error('Recipient rejected');
    } catch { throw new ServiceUnavailableException('Не удалось отправить письмо. Попробуйте позже.'); }
    finally { transport.close(); }
  }
}
