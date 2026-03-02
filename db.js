import sql from "mssql";

/** @type {sql.config} */
const connectionConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DB,
  server: process.env.MSSQL_HOST || "localhost",
  port: Number.parseInt(process.env.MSSQL_PORT || "1433", 10),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    trustServerCertificate: true
  }
};

const pool = new sql.ConnectionPool(connectionConfig);
export default pool;
