# Access and refresh token setup

The feature branch uses a short-lived signed access token and a rotating opaque refresh token.

- Access token: 15 minutes, signed with HMAC-SHA256, stored in an HttpOnly cookie.
- Refresh token: 7 days, stored in an HttpOnly cookie; only its SHA-256 hash is stored in the Session table.
- Refresh endpoint: POST /api/v1/auth/refresh rotates the refresh token and issues a new access token.
- Protected API routes validate the access token and verify the active server-side session.
- Frontend API requests retry once after a 401. Concurrent refresh attempts in the same browser tab share one refresh request.
- Logout deletes the server-side refresh session and clears both cookies.

## Local setup (Windows)

1. Open `app/backend/.env` (create it if missing; do not commit it).
2. Copy the database connection and other local settings from `app/backend/.env.example`.
3. Generate a secret in PowerShell/terminal:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Add the generated value to `app/backend/.env`:

   ```dotenv
   ACCESS_TOKEN_SECRET="paste-your-generated-value-here"
   ```

5. Restart the backend so the environment variable is loaded.

Never commit the actual `.env` file or share the generated secret. Production must use a unique secret over HTTPS.

## Manual verification checklist

- Sign up and sign in; both auth cookies should be HttpOnly.
- Confirm protected account, category and transaction endpoints work while signed in.
- Wait 15 minutes or clear only the access cookie; a protected request should refresh and retry once.
- Confirm several simultaneous protected requests trigger one refresh request in the same tab.
- Confirm refresh rotates the refresh cookie and the previous refresh token cannot be reused.
- Sign out; protected endpoints should return 401.
- Remove/omit `ACCESS_TOKEN_SECRET`; auth should fail and backend logs should explain the missing configuration.

Builds, database migrations, and browser tests must be run locally before merging. This branch has not been locally executed by the assistant.
