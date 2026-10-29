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
