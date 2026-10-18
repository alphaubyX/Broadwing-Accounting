import type { PoolConfig } from "mariadb";

/**
 * Turn DATABASE_URL (mysql://user:pass@host:3306/db?connection_limit=3&socket=/path)
 * into a mariadb pool config. Works with MySQL and MariaDB servers.
 */
export function poolConfig(url: string | undefined): PoolConfig {
  if (!url) throw new Error("DATABASE_URL is not set");
  const u = new URL(url);
  const socket = u.searchParams.get("socket");
  return {
    host: u.hostname || "localhost",
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    connectionLimit: Number(u.searchParams.get("connection_limit") || 3),
    connectTimeout: 10_000,
    // MySQL 8 default authentication over a local, non-TLS connection.
    allowPublicKeyRetrieval: true,
    ...(socket ? { socketPath: socket } : {}),
  };
}
