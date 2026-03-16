import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { env } from "../config/env.js";

function buildPoolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode === "require" || url.hostname.includes("supabase.com")) {
    url.searchParams.set("sslmode", "no-verify");

    return {
      connectionString: url.toString(),
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  return { connectionString };
}

const pool = new Pool(buildPoolConfig(env.DATABASE_URL));
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
