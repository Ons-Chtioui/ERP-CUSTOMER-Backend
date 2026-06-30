// src/emails/mailer.config.ts
import { MailerOptions } from '@nestjs-modules/mailer';
// Use require for the adapter to avoid missing type declaration file errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HandlebarsAdapter = require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter')?.HandlebarsAdapter;
import { join } from 'path';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: false,  // TLS, pas SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  defaults: {
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
  },
  template: {
    dir:     join(__dirname, 'templates'),
    adapter: new HandlebarsAdapter(),
    options: { strict: true },
  },
});