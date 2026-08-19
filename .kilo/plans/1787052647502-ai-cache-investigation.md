# Smart Library AI Features — Investigation Report

## 1. AI Trending Files/Functions

- **Primary logic:** `lib/trending-books.ts`
  - `getAiTrendingBooks(excludeIds, preferredGenres, limit)` — main exported function
  - `getTrendingCandidates(excludeIds, limit)` — fetches candidate books from DB with recent borrow counts
- **API route:** `app/api/ai/trending-books/route.ts`
  - `GET` handler that calls `getAiTrendingBooks` and returns JSON
- **Re-exported fallback:** `getPopularBooks` is re-exported from `lib/recommendations.ts` via `lib/trending-books.ts:11`

## 2. AI Recommendation Files/Functions

- **Primary logic:** `lib/recommendations.ts`
  - `getAiEnhancedRecommendations(userId)` — main exported function
  - `getRecommendedBooks(userId)` — existing non-AI fallback logic
  - `getPersonalizedRecommendations(preferences)` — genre/author/rating-based logic
  - `analyzeUserPreferences(readingHistory)` — weights user history
  - `getPopularBooks(excludeIds, limit)` — borrow-count fallback used by both features
- **API route:** `app/api/recommendations/route.ts`
  - `GET` handler that calls `getAiEnhancedRecommendations`

## 3. Homepage Call Flow

`app/(root)/page.tsx` is a **Server Component** that directly imports and calls the lib functions:

1. `auth()` → gets session
2. `getAiEnhancedRecommendations(userId)` → called if `userId` exists
3. Fetches user `preferredGenres` from DB
4. `getAiTrendingBooks(recommendedBookIds, preferredGenres, 6)` → always called
5. `getUserSavedBookIds(userId)` → for UI state
6. Renders `<BookList>` components with results

**Important:** The homepage does NOT call the API routes (`/api/ai/trending-books` or `/api/recommendations`). It calls the lib functions directly in the server component.

## 4. Groq Called on Every Homepage Load

**Yes, unconditionally:**

- `getAiTrendingBooks` calls `callOpenRouterChat` on every invocation (no caching, no conditional skip).
- `getAiEnhancedRecommendations` calls `callOpenRouterChat` on every invocation for logged-in users.
- Both have 10–15 second timeouts and fall back to non-AI logic on failure.
- AI provider: **Groq** via `@ai-sdk/groq` in `lib/openrouter.ts`.
- Env vars: `GROQ_API_KEY`, `GROQ_MODEL`.

## 5. Existing Caching

**None for AI results.**

- No server-side caching (no Redis, no `unstable_cache`, no `cacheLife`, no `revalidate`, no database cache table).
- Only client-side in-memory cache exists in `components/AiBookSummary.tsx` (per-page `useRef`), unrelated to homepage trending/recommendations.
- `revalidatePath` is used only in `lib/admin/actions/account-requests.ts` for admin pages.

## 6. Existing Redis/Upstash Infrastructure

- **Client exists:** `database/redis.ts` — `@upstash/redis` client configured with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from `lib/config.ts`.
- **Current usage:** `lib/ratelimit.ts` — rate limiting only (`@upstash/ratelimit`).
- **No AI caching uses Redis.**

## 7. Relevant Database Tables

From `database/schema.ts`:

| Table | Relevance |
|-------|-----------|
| `users` | Stores `preferred_genres` (JSON text), used by both AI features |
| `books` | Source data for candidates |
| `borrow_records` | Drives trending signals (7d/30d borrow counts) and recommendation history |
| `saved_books` | Drives trending signals (save counts) and recommendation context |
| `email_logs` | Unrelated |
| `visit_logs` | Unrelated |

**No cache tables exist.** A new table would be required for persistent AI result caching.

## 8. Recommended Caching Approach

Given the existing Upstash Redis client and the need to reduce Groq API calls:

1. **Primary:** Use existing Upstash Redis (`database/redis.ts`) as a cache layer.
   - Cache keys like `ai:trending:{hash}` and `ai:recommendations:{userId}:{hash}`.
   - TTL: 15–30 minutes (trending), 1–2 hours (recommendations).
   - Store serialized `Book[]` JSON.
2. **Secondary (optional):** A database-backed cache table for durability if Redis evicts entries.
3. **Cache invalidation triggers:**
   - New borrow record created
   - New book added
   - User saves a book
   - User updates preferred genres
4. **Cache key design:**
   - Trending: hash of `(excludeIds, preferredGenres, limit)` or a simple time-bucket (e.g., 15-min windows).
   - Recommendations: hash of `(userId, borrowedBookIds, savedBookIds, preferredGenres)`.

## 9. Potential Problems or Risks

1. **Every homepage load hits Groq** — high cost, latency spikes, rate-limit risk.
2. **No shared cache between homepage and API routes** — even if API routes are cached, the homepage server component bypasses them.
3. **Personalization changes frequently** — user actions (borrow, save) should invalidate recommendation cache.
4. **Trending is semi-global** — can be safely shared across users with preferred-genre variants.
5. **Redis is currently only used for rate limiting** — adding caching is low risk but needs careful TTL to avoid stale data.
6. **Fallback already works** — any caching layer must fall through to `getPopularBooks` / `getRecommendedBooks` on miss or error.
7. **AI returns book IDs, not full objects** — the lib layer already maps IDs back to DB objects; cached results should store the final `Book[]` to avoid re-querying.
