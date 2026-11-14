/**
 * Base Postgres embarquée (PGlite, en mémoire) pour les scripts de contrôle.
 * Permet d'exécuter les vraies migrations SQL, déclencheurs compris, sans toucher une base réelle.
 * Ne jamais importer depuis le code de production.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Db } from "./client";
import * as schema from "./schema";

export interface TestDb {
  /** Même interface que la base de production pour les requêtes du paquet. */
  db: Db;
  /** Accès SQL brut, pour tenter ce que le paquet n'offre pas (UPDATE, DELETE…). */
  exec: (sql: string) => Promise<void>;
  query: <T>(sql: string) => Promise<T[]>;
}

export async function createTestDb(migrations: readonly string[]): Promise<TestDb> {
  const pg = new PGlite();
  // Rôles Supabase référencés par les migrations (GRANT / REVOKE).
  await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated;");
  for (const sql of migrations) await pg.exec(sql);
  return {
    db: drizzle(pg, { schema }) as unknown as Db,
    exec: async (sql) => {
      await pg.exec(sql);
    },
    query: async <T>(sql: string) => (await pg.query<T>(sql)).rows,
  };
}
