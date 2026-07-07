# Admin données sportives (lot 2)

Les mutations sur `clubs`, `players`, `matches` passent par Drizzle (`getDb()`) et `requireAdmin()` depuis `../permissions.ts`.

Ne pas mélanger avec les server actions Fan Zone Supabase (`lib/fan-zone/admin-actions.ts`).
