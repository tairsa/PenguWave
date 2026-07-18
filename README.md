# PenguWave: Security Operations Portal

A full-stack security operations portal for monitoring security events across your infrastructure.

## How to Run

### Prerequisites
- Node.js 18+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and set a strong JWT secret:
```bash
cp .env.example .env
```

### 3. Start the backend (terminal 1)
```bash
npm run server
```
The API runs at `http://localhost:3001`. On first run, the database is seeded with two default users:
- `admin@penguwave.io` / `admin123` (admin role)
- `analyst@penguwave.io` / `analyst123` (analyst role)

### 4. Start the frontend (terminal 2)
```bash
npm run dev
```
The app runs at `http://localhost:5173`.

---

## How Authentication Works

Authentication uses **JWT (JSON Web Tokens)**:

1. The client sends `POST /api/auth/login` with email and password.
2. The server looks up the user and compares the submitted password against the **bcrypt hash** stored in the database. Passwords are never stored in plaintext.
3. On success, the server signs a JWT with the user's `id`, `email`, and `role`, valid for 8 hours.
4. The client stores the token in `localStorage` and sends it on every subsequent request as `Authorization: Bearer <token>`.
5. The `requireAuth` middleware on every protected route verifies the token. If missing or invalid, it returns `401 Unauthorized`.
6. Logout removes the token from `localStorage`. In production, a server-side token blocklist (e.g. Redis) would be added to fully invalidate tokens before expiry.

**Security measures:**
- Passwords hashed with bcrypt (cost factor 10)
- Generic error messages on failed login — does not reveal whether the email exists
- Login endpoint rate-limited to 10 attempts per 15 minutes per IP
- JWT secret loaded from environment variable, never hardcoded

---

## How Authorization Is Enforced

- **Identity** always comes from the verified JWT payload (`req.user`), never from URL parameters or request body fields controlled by the client.
- **Events endpoints** require any authenticated user (`requireAuth`).
- **User management endpoints** require both authentication and the `admin` role (`requireAuth + requireAdmin`). A non-admin receives `403 Forbidden`.
- An admin cannot delete their own account to prevent accidental lockout.
- API responses for users **never include the password field**.

---

## Storage

User data is persisted in **SQLite** via `better-sqlite3` (`server/penguwave.db`). All queries use **prepared statements** — no string concatenation — to prevent SQL injection. In production this would be swapped for Cloud SQL (PostgreSQL).

---

## Security Fixes Applied to the Original Frontend

| Issue | Fix |
|-------|-----|
| Passwords displayed in plaintext in the users table | Removed password column; passwords never returned by API |
| `dangerouslySetInnerHTML` on search term | Replaced with safe React text rendering |
| `el.innerHTML` on event description | Replaced with `<p>{selectedEvent.description}</p>` |
| Hardcoded mock users | Replaced with real API calls |

---

## How to Deploy Securely in Production

**Infrastructure (Google Cloud)**
- **Cloud Run** for the backend (containerized, autoscaled)
- **Cloud SQL (PostgreSQL)** to replace SQLite
- **Secret Manager** for `JWT_SECRET` and database credentials
- **Cloud Armor** for WAF, DDoS protection, and rate limiting
- **HTTPS only** — Cloud Run enforces TLS by default

**Application hardening**
- Replace `localStorage` JWT storage with `HttpOnly` cookies to prevent XSS token theft
- Add a Redis-backed token blocklist so logout fully invalidates tokens
- Add `helmet.js` for security headers (CSP, HSTS, X-Frame-Options)
- Rotate JWT secret regularly via Secret Manager versioning
- Least-privilege IAM roles for Cloud Run service accounts

**Observability**
- Cloud Logging for failed logins and denied access attempts
- Alerts on repeated 401/403 responses
