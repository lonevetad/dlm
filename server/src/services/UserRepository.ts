import { withConnection } from "../db/mariaDb.ts";
import type { UserRecord } from "../types.ts";

export class UserRepository {
  async findByWallet(wallet: string): Promise<UserRecord | null> {
    const rows = await withConnection(async (connection) => {
      return connection.query("SELECT * FROM users WHERE wallet = ?", [wallet]);
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return null;
    }

    return {
      wallet: row.wallet,
      userId: row.user_id,
      username: row.username,
      createdAt: Number(row.created_at),
    };
  }

  async create(user: UserRecord): Promise<UserRecord> {
    await withConnection(async (connection) => {
      await connection.query(
        "INSERT INTO users (wallet, user_id, username, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), username = VALUES(username)",
        [user.wallet, user.userId, user.username, user.createdAt],
      );
    });

    return user;
  }
}
