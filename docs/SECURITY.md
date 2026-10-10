# FORGELINE — Security Architecture & Threat Model
Last updated: 2026-10-10

---

## 1. Authentication & Session Security

### 1.1 Credential Hashing with Argon2id
Passwords are never stored in plaintext or with legacy hashing algorithms (MD5/SHA1/bcrypt). Forgeline uses **Argon2id** (the winner of the Password Hashing Competition), offering maximum resilience against GPU and ASIC cracking by combining memory hardness with resistance to side-channel attacks.

### 1.2 Dual-Token Cookie Architecture
* **Access Token (JWT):**
  * Short-lived (15 minutes).
  * Encrypted payload containing `sub`, `email`, `globalRole`, and `tokenVersion`.
  * Delivered strictly in an `httpOnly`, `SameSite=Lax` cookie. JavaScript has zero access to token values, eliminating XSS token theft vectors common in `localStorage`.
* **Refresh Token (Rotating Session):**
  * 7-day lifespan.
  * Opaque 40-byte cryptographically random string (`crypto.randomBytes(40)`).
  * Stored in the database as a SHA-256 hash alongside a `family_id` UUID.

### 1.3 Refresh Token Rotation (RTR) & Reuse Detection
* Every time `/auth/refresh` is called, the provided refresh token is immediately marked as revoked (`revokedAt = NOW()`), and a new refresh token is issued within the same `family_id`.
* **Reuse Detection:** If an adversary intercepts and attempts to replay a previously used refresh token (`revokedAt IS NOT NULL`), Forgeline detects the intrusion:
  1. The entire token family (`family_id`) is instantly revoked.
  2. The user's `token_version` counter is incremented in the database.
  3. All active access tokens and sessions are terminated immediately.

### 1.4 Instant Deactivation & Session Severing
* When an administrator sets `is_active = false` or a user changes their password:
  * The `token_version` integer on `users` increments.
  * Every incoming request through `JwtAuthGuard` verifies that `payload.tokenVersion === user.tokenVersion` and `user.isActive === true`.
  * The session is rejected immediately with HTTP 401/403, with zero delay.

---

## 2. API Hardening & Attack Mitigations

| Threat | Defense Implementation |
|---|---|
| **User Enumeration** | Login endpoints return identical `401 INVALID_CREDENTIALS` responses with identical messages ("Invalid email or password") whether the user does not exist or the password is bad. A dummy Argon2 verify is performed to equalize response times. |
| **Cross-Site Request Forgery (CSRF)** | Cookies are strictly configured with `SameSite=Lax`. In addition, `CsrfOriginGuard` verifies the incoming `Origin` and `Referer` headers against `WEB_ORIGIN` for state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`). |
| **Credential Stuffing / Brute Force** | `@nestjs/throttler` enforces a strict rate limit of 5 requests per minute on `/auth/login`, and 100 requests per minute globally. |
| **Clickjacking & MIME-Sniffing** | `helmet` sets secure HTTP response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`). |
| **XSS Token Extraction** | Access and refresh tokens are stored exclusively in `httpOnly` cookies; no sensitive credentials exist in browser memory or `localStorage`. |
