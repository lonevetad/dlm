import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  daoRpcUrl: process.env.DAO_RPC_URL ?? "http://127.0.0.1:8545",
  daoContractAddress:
    process.env.DAO_CONTRACT_ADDRESS ??
    "0x0000000000000000000000000000000000000000",
  dbHost: process.env.DB_HOST ?? "127.0.0.1",
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbName: process.env.DB_NAME ?? "dlm",
  dbUser: process.env.DB_USER ?? "dlm_user",
  dbPassword: process.env.DB_PASSWORD ?? "dlm_password",
  dbConnectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
};
