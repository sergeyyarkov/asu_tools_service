import sql from "mssql";

/** @type {sql.config} */
const connectionConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DB,
  server: process.env.MSSQL_HOST,
  port: Number.parseInt(process.env.MSSQL_PORT, 10) || 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 5000,
  },
  options: {
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(connectionConfig);
export default pool;
