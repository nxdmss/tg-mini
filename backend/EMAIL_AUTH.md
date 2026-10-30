# Verified email registration and password recovery

Configure SMTP_HOST, SMTP_PORT (465 TLS or 587 STARTTLS), SMTP_USER,
SMTP_PASS and SMTP_FROM in the backend service's production environment.
Credentials must stay on the server. The sender must be allowed by the SMTP provider.
For a domain sender, configure the SPF/DKIM records supplied by that provider.
Do not replace existing DNS records blindly.

The full deployment script checks resolved Compose settings before changing files,
backs up the database and applies the additive email_verification migration.
The frontend-only deployment script is insufficient for this release.

Registration requests store a password hash and a keyed hash of a six-digit code,
not a User. Verification creates the account and issues its session.
Codes expire after 10 minutes, allow five attempts and a 60-second resend cooldown.
Mail errors remove the failed challenge. Codes and mail credentials are never logged.
Existing accounts remain usable; their email is not retroactively marked verified.
Successful recovery verifies email and increments the user's session version,
invalidating previously issued web sessions. Telegram authentication is separate.

Before announcing availability, use a real inbox to register, receive a code,
confirm the account, log out, recover the password and verify the old password fails.
Local builds and mocked tests do not verify SMTP connectivity or inbox delivery.

Checks from repository root:
  npm --prefix frontend run build
  npm --prefix backend run build
  node --test backend/test/email-auth.cjs

## Email appearance

The HTML email uses an opaque white inline PNG for the six-digit code, rendered
from the same IZLOM Heavy digits as the storefront. No remote fonts, scripts or
image downloads are needed. The image has the code as alt text; a plain-text
alternative contains the code too. Mail clients may still hide inline images.
The two captions show 10 minutes and the actual database expiry in Moscow time.
There is deliberately no animated countdown: email clients cannot reliably keep
it in sync with the server expiry, especially when a message is reopened.

`backend/src/auth/email/` contains the template, PNG renderer and generated glyph
masks. Rebuild the masks after changing the storefront font with
`python3 scripts/build-email-digits.py` (Pillow required only for regeneration).
SMTP production delivery and rendering in a real inbox require a separate smoke test.
