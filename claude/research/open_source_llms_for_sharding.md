# Open-Source LLMs Relevant to DLM

## Goal

Identify open-source models that are strong candidates for a distributed, shard-based execution network and those whose architecture makes partitioning practical.

## Candidates and assessment

### 1) Llama 3.x family

- Examples: Llama 3 8B, 70B, 405B variants
- Strengths:
  - widely used and open-source-friendly;
  - strong ecosystem support;
  - clear layer-based architecture suitable for model partitioning.
- DLM fit: high; strong candidate for initial research and implementation if the project targets a multi-node inference network.
- Caveat: large parameter counts make distribution more complex but also more realistic.

### 2) Mistral and Mixtral

- Examples: Mistral 7B; Mixtral 8x7B
- Strengths:
  - highly efficient and popular;
  - MoE architecture in Mixtral creates natural expert partitioning opportunities.
- DLM fit: very high for MoE-specific routing and expert sharding.
- Caveat: expert-based routing complicates scheduling but may be powerful for DLM.

### 3) Falcon

- Examples: Falcon 7B, 40B, 180B
- Strengths:
  - strong open-source ecosystem;
  - suitable for distributed inference experiments;
  - architecture is compatible with block-wise sharding.
- DLM fit: high.

### 4) BLOOM

- Strengths:
  - open-source large-scale multilingual model;
  - designed with broad availability in distributed systems contexts.
- DLM fit: moderate to high.

### 5) Qwen 2 / Qwen 2.5

- Strengths:
  - very capable open-source LLMs;
  - good ecosystem and practical usage in inference pipelines.
- DLM fit: high.

### 6) Gemma

- Examples: Gemma 2B, 7B, 9B, 27B
- Strengths:
  - smaller, practical deployments;
  - manageable size for early network prototypes.
- DLM fit: high for the first prototype because of smaller memory requirements.

### 7) DeepSeek models

- Strengths:
  - strong open-source adoption and performance;
  - relevant to distributed inference experiments.
- DLM fit: moderate to high.

### 8) Phi family

- Strengths:
  - compact and efficient;
  - practical for local and edge scenarios.
- DLM fit: moderate; useful for small-device prototype testbeds.

### 9) TinyLlama and small open-source models

- Strengths:
  - very suitable for early prototyping and turning a shard strategy into a working simulation.
- DLM fit: very high for initial engineering validation.

## Best candidates for a shard-first prototype

The most realistic first implementation candidates are:

1. Gemma or TinyLlama for early proof-of-concept development.
2. Mistral or Llama 3 for realistic production-style distributed inference.
3. Mixtral for MoE-style expert partitioning experiments.
4. Falcon or BLOOM for large-scale sharding experiments.

## Why some models are easier to shard

The most shard-friendly architectures are those with:

- clear layer or block boundaries;
- transformer stacks with consistent parameter tensors;
- modular attention and MLP subcomponents;
- optional expert routing patterns (for MoE models);
- enough open-source tooling for serialization and partitioning.

## Recommended project path

- Phase 1 prototype: use a smaller open-source model to validate node scheduling and shard metadata.
- Phase 2 distributed inference: move to Mistral/Llama-class models.
- Phase 3 advanced sharding: explore MoE models and richer orchestration.

## Reference links

- Llama: https://llama.meta.com/
- Mistral: https://mistral.ai/
- Mixtral: https://huggingface.co/mistralai/Mixtral-8x7B-v0.1
- Falcon: https://falconllm.tii.ae/
- BLOOM: https://bigscience.huggingface.co/
- Qwen: https://qwenlm.github.io/
- Gemma: https://ai.google.dev/gemma
- DeepSeek: https://github.com/deepseek-ai
- Phi: https://azure.microsoft.com/en-us/products/phi/
