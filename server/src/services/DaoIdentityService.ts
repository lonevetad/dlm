import { ethers } from "ethers";
import { env } from "../config/env.ts";

const DAO_ABI = [
  "function users(address) view returns (tuple(string userId, string username, bool exists, address wallet))",
  "function nodes(address) view returns (tuple(string nodeId, uint8 role, uint256 ramMb, uint256 cpuTflops, uint256 storageGb, uint256 bandwidthMbps, bool active, uint256 lastHeartbeat, address wallet))",
  "function registerUser(string memory userId, string memory username)",
  "function registerNode(string memory nodeId, uint8 role, uint256 ramMb, uint256 cpuTflops, uint256 storageGb, uint256 bandwidthMbps)",
  "function submitPrompt(string memory userId, string memory promptHash, string memory promptRef) payable returns (uint256)",
  "function updatePromptStatus(uint256 promptId, uint8 status)",
];

export class DaoIdentityService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(env.daoRpcUrl);
    this.contract = new ethers.Contract(
      env.daoContractAddress,
      DAO_ABI,
      this.provider,
    );
  }

  async userExists(wallet: string): Promise<boolean> {
    try {
      const user = await this.contract.users(wallet);
      return Boolean(user?.exists);
    } catch {
      return false;
    }
  }

  async nodeExists(wallet: string): Promise<boolean> {
    try {
      const node = await this.contract.nodes(wallet);
      return (
        !!node && node.wallet !== ethers.ZeroAddress && Boolean(node.active)
      );
    } catch {
      return false;
    }
  }

  async isRegisteredIdentity(
    wallet: string,
    role?: "root" | "normal",
  ): Promise<boolean> {
    const exists = role
      ? await this.nodeExists(wallet)
      : await this.userExists(wallet);
    return exists;
  }
}

export const daoIdentityService = new DaoIdentityService();
