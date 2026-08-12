import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";

// Load server/.env if present (Hostinger: injected env vars also supported).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_NAME = "dr_kareem",
  DB_USER = "root",
  DB_PASSWORD = "",
  DB_LOGGING = "false",
  DB_CHARSET = "utf8mb4",
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "mysql",
  logging: DB_LOGGING === "true" ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
    charset: DB_CHARSET,
    collate: `${DB_CHARSET}_unicode_ci`,
  },
  dialectOptions: {
    charset: DB_CHARSET,
    // MySQL 8 default auth plugin.
    authPlugins: { mysql_native_password: () => () => undefined },
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  // Retry: migrations/seeds run sequentially over one connection; avoid
  // transient MySQL connection loss bubbling up as hard failures.
  retry: { max: 3 },
});