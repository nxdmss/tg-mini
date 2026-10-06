# SWAGYSTAN production security hardening

This checklist covers controls that live outside the repository and therefore must
be applied in Yandex Cloud / Telegram before the hardening branch is deployed.

## Required secrets

Generate new random values. Do not reuse values that have ever appeared in chat,
logs, screenshots, shell history, or old deployments.

```env
NODE_ENV=production
JWT_SECRET=<at-least-32-random-characters>
TELEGRAM_WEBHOOK_SECRET=<at-least-32-random-characters>
CORS_ORIGINS=https://swagystan.ru,https://admin.swagystan.ru
```

Store production secrets outside Git. Prefer Yandex Lockbox or an equivalent
secret store and inject them into the deployment environment.

## Telegram webhook

After setting `TELEGRAM_WEBHOOK_SECRET`, install the bot webhook with Telegram's
`secret_token` parameter using the same value. The API accepts the old webhook
until the secret is configured, so this can be rolled out without downtime.

Then verify that requests without the
`X-Telegram-Bot-Api-Secret-Token` header receive HTTP 401.

## Network

- PostgreSQL must have no public ingress.
- The API container must remain reachable only through Caddy.
- Restrict SSH to a trusted source or private administration path.
- Do not expose Docker's API or port 3000 publicly.
- Keep Object Storage write credentials limited to the product-media bucket.

## DDoS / HTTP abuse

Put the API behind Yandex Smart Web Security / Advanced Rate Limiter where
available. Apply stricter upstream limits to:

- `POST /auth/login`
- `POST /auth/register`
- `POST /orders`
- `POST /telegram/webhook`

The application has a second layer of rate limiting, but upstream protection is
still required because application limits consume VM/network resources before
rejecting traffic.

Do not expose the origin in a way that bypasses the upstream protection.

## Secrets known to have been shared previously

Rotate any old Telegram bot token, database password, Cloudinary credential, or
other production credential that was previously shared. Removing a leaked value
from a file or chat does not make it secret again.

## Accounts

Enable MFA for GitHub and Yandex Cloud administrator accounts. Keep the number of
owners/admins minimal and remove unused service-account keys.

## Backups

Keep automated PostgreSQL backups and perform a restore test. A backup that has
never been restored is merely an optimistic file.

## After deployment

Verify:

1. storefront and Telegram Mini App load;
2. product/catalog APIs work;
3. one real test order succeeds;
4. excessive repeated order/login requests receive HTTP 429;
5. admin login and order management work;
6. image upload accepts real images and rejects renamed non-images;
7. Telegram webhook works only with its secret after the secret is enabled;
8. `https://swagystan.ru/` has title `SWAGYSTAN` and the bird favicon;
9. `/robots.txt` and `/sitemap.xml` return HTTP 200;
10. database is not reachable from the public internet.
