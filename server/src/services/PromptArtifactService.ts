import fs from "fs";
import path from "path";

export interface ElectedNodeRecord {
  wallet: string;
  nodeId: string;
  role?: string;
}

export class PromptArtifactService {
  private readonly rootDir: string;

  constructor(rootDir = path.resolve(process.cwd(), "data", "user-artifacts")) {
    this.rootDir = rootDir;
    this.ensureRoot();
  }

  private ensureRoot(): void {
    fs.mkdirSync(this.rootDir, { recursive: true });
  }

  private ensureUserFolder(wallet: string): string {
    const userDir = path.join(this.rootDir, wallet);
    fs.mkdirSync(userDir, { recursive: true });
    return userDir;
  }

  private ensurePromptFolder(userDir: string, folderName: string): string {
    const folderPath = path.join(userDir, folderName);
    fs.mkdirSync(folderPath, { recursive: true });
    return folderPath;
  }

  writePromptContent(
    wallet: string,
    promptId: string,
    content: string,
  ): string {
    const userDir = this.ensureUserFolder(wallet);
    const targetDir = this.ensurePromptFolder(userDir, "prompts");
    const filePath = path.join(targetDir, `${promptId}.txt`);
    fs.writeFileSync(filePath, content, "utf8");
    return filePath;
  }

  readPromptContent(wallet: string, promptId: string): string {
    const filePath = path.join(
      this.rootDir,
      wallet,
      "prompts",
      `${promptId}.txt`,
    );
    return fs.readFileSync(filePath, "utf8");
  }

  writeResponse(
    wallet: string,
    promptId: string,
    responseText: string,
  ): string {
    const userDir = this.ensureUserFolder(wallet);
    const targetDir = this.ensurePromptFolder(userDir, "responses");
    const filePath = path.join(targetDir, `${promptId}.txt`);
    fs.writeFileSync(filePath, responseText, "utf8");
    return filePath;
  }

  readResponse(wallet: string, promptId: string): string {
    const filePath = path.join(
      this.rootDir,
      wallet,
      "responses",
      `${promptId}.txt`,
    );
    return fs.readFileSync(filePath, "utf8");
  }

  writeElectedNodes(
    wallet: string,
    promptId: string,
    nodes: ElectedNodeRecord[],
  ): string {
    const userDir = this.ensureUserFolder(wallet);
    const targetDir = this.ensurePromptFolder(userDir, "elected-nodes");
    const filePath = path.join(targetDir, `${promptId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(nodes, null, 2), "utf8");
    return filePath;
  }

  readElectedNodes(wallet: string, promptId: string): ElectedNodeRecord[] {
    const filePath = path.join(
      this.rootDir,
      wallet,
      "elected-nodes",
      `${promptId}.json`,
    );
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ElectedNodeRecord[];
  }
}

export const promptArtifactService = new PromptArtifactService();
