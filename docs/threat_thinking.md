# Threat Thinking — PenguWave Security Portal

## 1. Authentication Bypass & Brute Force

**Threat:** Attackers might brute-force the login or bypass the UI entirely to call backend APIs directly.

**Plan:** Passwords will be hashed with bcrypt, and the login route will be rate-limited. All protected API endpoints will strictly require a valid JWT.

## 2. Broken Authorization (Changing IDs)

**Threat:** Logged-in users might try to access or modify others' data by altering IDs in API requests.

**Plan:** The backend will determine identity and roles solely from the verified JWT payload, never trusting client input. Unauthorized actions will be blocked with a `403 Forbidden`.

## 3. Injection & Data Leaks

**Threat:** Malicious inputs could trigger database injections, or the API might accidentally leak password hashes to the frontend.

**Plan:** We will use parameterized queries to block injections, and explicitly filter all API responses so sensitive fields never reach the client.

## 4. Client-Side Attacks (XSS)

**Threat:** Rendering event data directly to the screen could execute malicious JavaScript if the source JSON contains script tags.

**Plan:** The frontend will treat all incoming API data as plain text. We will avoid unsafe DOM properties like `innerHTML` or `dangerouslySetInnerHTML` to ensure scripts cannot run.
