export interface ModelStageDefinition {
  id: string;
  stageName: string;
  requiredRamMb: number;
  requiredCpuTflops: number;
  requiredBandwidthMbps: number;
  dependencies?: string[];
  replicationFactor?: number;
}

export interface ModelDefinition {
  name: string;
  family: string;
  maxContextTokens: number;
  stages: ModelStageDefinition[];
}

export class ModelRegistry {
  private readonly models = new Map<string, ModelDefinition>();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults(): void {
    this.registerModel({
      name: "gemma-2b",
      family: "gemma",
      maxContextTokens: 2048,
      stages: [
        {
          id: "prompt_embedding",
          stageName: "prompt_embedding",
          requiredRamMb: 512,
          requiredCpuTflops: 1,
          requiredBandwidthMbps: 10,
        },
        {
          id: "layer_block_01",
          stageName: "layer_block_01",
          requiredRamMb: 2048,
          requiredCpuTflops: 3,
          requiredBandwidthMbps: 15,
        },
        {
          id: "layer_block_02",
          stageName: "layer_block_02",
          requiredRamMb: 2048,
          requiredCpuTflops: 3,
          requiredBandwidthMbps: 15,
        },
        {
          id: "attention_merge",
          stageName: "attention_merge",
          requiredRamMb: 1024,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 12,
        },
        {
          id: "output_projection",
          stageName: "output_projection",
          requiredRamMb: 1024,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 10,
        },
        {
          id: "final_output_node",
          stageName: "final_output_node",
          requiredRamMb: 2048,
          requiredCpuTflops: 4,
          requiredBandwidthMbps: 20,
        },
      ],
    });

    this.registerModel({
      name: "tinyllama-1b",
      family: "tinyllama",
      maxContextTokens: 2048,
      stages: [
        {
          id: "token_encoder",
          stageName: "token_encoder",
          requiredRamMb: 256,
          requiredCpuTflops: 1,
          requiredBandwidthMbps: 8,
        },
        {
          id: "hidden_block_01",
          stageName: "hidden_block_01",
          requiredRamMb: 1024,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 10,
        },
        {
          id: "hidden_block_02",
          stageName: "hidden_block_02",
          requiredRamMb: 1024,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 10,
        },
        {
          id: "output_head",
          stageName: "output_head",
          requiredRamMb: 768,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 8,
        },
      ],
    });

    this.registerModel({
      name: "mistral-7b",
      family: "mistral",
      maxContextTokens: 8192,
      stages: [
        {
          id: "token_embedding",
          stageName: "token_embedding",
          requiredRamMb: 1024,
          requiredCpuTflops: 2,
          requiredBandwidthMbps: 12,
        },
        {
          id: "decoder_block_01",
          stageName: "decoder_block_01",
          requiredRamMb: 4096,
          requiredCpuTflops: 5,
          requiredBandwidthMbps: 18,
        },
        {
          id: "decoder_block_02",
          stageName: "decoder_block_02",
          requiredRamMb: 4096,
          requiredCpuTflops: 5,
          requiredBandwidthMbps: 18,
        },
        {
          id: "attention_pool",
          stageName: "attention_pool",
          requiredRamMb: 2048,
          requiredCpuTflops: 3,
          requiredBandwidthMbps: 16,
        },
        {
          id: "lm_head",
          stageName: "lm_head",
          requiredRamMb: 2048,
          requiredCpuTflops: 4,
          requiredBandwidthMbps: 12,
        },
      ],
    });
  }

  registerModel({
    name,
    family,
    maxContextTokens,
    stages,
  }: {
    name: string;
    family: string;
    maxContextTokens: number;
    stages: ModelStageDefinition[];
  }): void {
    if (!name || !Array.isArray(stages) || stages.length === 0) {
      throw new Error("Model configuration is invalid");
    }

    this.models.set(name, {
      name,
      family,
      maxContextTokens,
      stages: stages.map((stage, index) => ({
        ...stage,
        dependencies: index === 0 ? [] : [stages[index - 1].id],
        replicationFactor: stage.replicationFactor ?? 1,
      })),
    });
  }

  getModel(modelVersion = "gemma-2b"): ModelDefinition {
    const model = this.models.get(modelVersion);
    if (!model) {
      throw new Error(`Unsupported model version: ${modelVersion}`);
    }
    return model;
  }

  listModels(): Array<{
    name: string;
    family: string;
    maxContextTokens: number;
    stageCount: number;
  }> {
    return Array.from(this.models.values()).map((model) => ({
      name: model.name,
      family: model.family,
      maxContextTokens: model.maxContextTokens,
      stageCount: model.stages.length,
    }));
  }
}

export const modelRegistry = new ModelRegistry();
