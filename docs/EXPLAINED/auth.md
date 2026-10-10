# EXPLAINED: Authentication & Session Engine (Study Guide & Viva Prep)

---

## 1. What is this module in plain English?
The Auth module controls how users prove who they are, how their login sessions are maintained across requests, and how compromised sessions are detected and revoked. It provides:
1. Secure login (`POST /auth/login`)
2. Silent session renewal (`POST /auth/refresh`)
3. Clean logout (`POST /auth/logout`)
4. Current profile retrieval and modification (`GET /auth/me`, `PATCH /auth/me`)
5. Password update with session revocation (`POST /auth/change-password`)

---

## 2. Step-by-Step Flow: Refresh Token Rotation & Reuse Detection
1. **User logs in:** The server hashes the password with Argon2id, generates a 15-minute access JWT and a 7-day cryptographically random refresh token. It saves the SHA-256 hash of the refresh token in the database under a unique `family_id` UUID, and sets both tokens in `httpOnly`, `SameSite=Lax` cookies.
2. **Access token expires (15 min):** The frontend transparently requests `/auth/refresh`.
3. **Valid Rotation:** The backend checks the refresh token against the database:
   - If active (`revokedAt IS NULL`), it immediately sets `revokedAt = NOW()`.
   - It issues a **brand new** refresh token with the **same `family_id`**, and a new access token.
4. **Intrusion / Reuse Attempt:** If an attacker intercepts an old refresh token and tries to use it:
   - The backend sees `revokedAt IS NOT NULL`.
   - The server triggers an immediate security alert: it revokes the **entire family** (`WHERE family_id = token.familyId`), increments the user's `token_version` (invalidating all outstanding access JWTs), and returns `401 REFRESH_TOKEN_REUSE_DETECTED`.

---

## 3. Why this design? (Design Justifications)

| Decision | Alternative Considered | Why we chose our approach |
|---|---|---|
| **httpOnly Cookies** | `localStorage` / `sessionStorage` | Storing tokens in `localStorage` leaves them vulnerable to theft via Cross-Site Scripting (XSS). `httpOnly` cookies cannot be accessed by client JavaScript. |
| **Argon2id** | `bcrypt` / `PBKDF2` | Argon2id is the modern standard (winner of the Password Hashing Competition). Unlike bcrypt, it provides tunable memory hardness to resist GPU/ASIC parallel cracking clusters. |
| **Token Family Rotation** | Single long-lived refresh token | A static refresh token remains valid if stolen. Rotating tokens ensures each token is single-use, and family tracking enables instant detection and neutralization of token replay attacks. |
| **token_version counter** | Database lookup on every request / Redis blacklist | Checking `user.tokenVersion === payload.tokenVersion` during `JwtAuthGuard` gives us instant, global session revocation on password change or deactivation with minimal overhead. |

---

## 4. Top 5 Interview Questions & Exact Answers

### Q1: Why do you store JWTs in httpOnly cookies instead of Authorization headers via localStorage?
**Answer:** "Tokens stored in `localStorage` can be extracted by any third-party script or XSS vulnerability on the page. Storing JWTs in `httpOnly` cookies ensures the browser transmits credentials automatically while completely blocking JavaScript access. We pair this with `SameSite=Lax` and explicit Origin checking in `CsrfOriginGuard` to prevent Cross-Site Request Forgery (CSRF)."

### Q2: What happens if an attacker steals a refresh token?
**Answer:** "Forgeline implements Refresh Token Rotation with Reuse Detection. If either the legitimate user or the attacker attempts to use a refresh token that was already rotated (`revokedAt IS NOT NULL`), our backend detects a token collision. It instantly revokes all tokens in that `family_id` and increments the user's `token_version`, invalidating all active sessions for that account."

### Q3: How do you prevent user enumeration on the login endpoint?
**Answer:** "Whether an email exists or not, the endpoint returns an identical HTTP 401 status code with the exact same error code (`INVALID_CREDENTIALS`) and message (`'Invalid email or password'`). When an email is not found, we perform a dummy Argon2 verification to equalize execution timing and eliminate side-channel timing attacks."

### Q4: If JWTs are stateless, how do you instantly block a deactivated user?
**Answer:** "Our `JwtAuthGuard` loads the active user record and compares `payload.tokenVersion` with the database's `user.tokenVersion`. If an admin deactivates a user or their `tokenVersion` was incremented, their access token is rejected immediately on the next request."

### Q5: How is Cross-Site Request Forgery (CSRF) mitigated when using cookies?
**Answer:** "First, our cookies use `SameSite=Lax`, which stops browsers from sending cookies on cross-origin POST/PATCH requests initiated by third-party sites. Second, we implement `CsrfOriginGuard`, which verifies that the `Origin` or `Referer` header on mutating requests strictly matches our allowed `WEB_ORIGIN`."
