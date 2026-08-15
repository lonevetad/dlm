# Scientific Research: LLM Partitioning and Parallel Computation

## Executive summary

The design challenge is not simply to distribute an LLM across many devices, but to partition the computational graph and data flow so that partial computations can be run on heterogeneous nodes while preserving a valid overall result. The main families of techniques are model parallelism, pipeline parallelism, tensor parallelism, and distributed inference scheduling. These methods form the scientific foundation for a DLM-style network.

## Relevant research areas

### 1) Model parallelism

Model parallelism splits the model itself across devices instead of replicating the full model on every node.

- Common approach: partition layers, parameter tensors, or attention blocks across machines.
- Typical use: large models too large for one GPU or one server memory.
- Relevance: central to DLM because each shard can be mapped to a node and recombined into a coherent inference path.

### 2) Pipeline parallelism

Pipeline parallelism divides a model into sequential stages and runs each stage on different devices.

- Example: early layers on one group of nodes, later layers on another.
- Advantages: often simpler than full tensor partitioning and well suited to sequential execution graphs.
- Challenge: pipeline bubbles and synchronization latency can slow throughput.
- DLM implication: a network stage scheduler is required to sequence shard execution and manage partial activations.

### 3) Tensor parallelism

Tensor parallelism splits individual layers or weight matrices across multiple workers.

- Common in transformer architectures: attention heads, MLP blocks, or matrix partitions.
- Relevance: highly relevant for transformer-based LLMs.
- DLM implication: per-shard assignments should respect actual tensor boundaries, not just arbitrary chunks of model bytes.

### 4) Data parallelism and distributed inference

Data parallelism replicates the model and distributes batches across workers; it is useful for training and throughput but not the best fit for a shard-storage network.

- Relevance: less direct than model parallelism.
- DLM implication: useful only if the system eventually adds multiple identical model replicas or load balancing.

### 5) Mixture-of-Experts (MoE) and sparse routing

MoE models activate only subsets of experts per token or per request.

- Benefit: more efficient scaling and more natural modularity.
- Relevance: a very promising architectural pattern for a sharded network, because only a selected set of experts may be activated.
- DLM implication: an advanced shard strategy could route prompts to the relevant expert groups instead of all model parts.

### 6) Federated learning and edge inference

Federated learning keeps training data local while coordinating model updates across devices.

- Relevance: many concepts align with DLM: device heterogeneity, partial contributions, network coordination, and privacy-aware compute.
- Limitation: the target is training or aggregate updates, not necessarily full prompt-level LLM execution over a public, token-driven network.

## Key scientific principles relevant to DLM

- There is no single general-purpose sharding strategy across all LLMs.
- A sharding method must match the model’s architectural topology.
- A distributed execution plan must preserve ordering, dependencies, and activation flow.
- Partial results need metadata for recombination, including shard IDs, execution stage IDs, and dependency DAG.
- Heterogeneous hardware means the scheduler must choose nodes by capability, latency, network bandwidth, and current load.

## Important literature and references

1. Gpipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism (Huang et al., 2019)
   - Core concept: pipeline partitioning of large models across devices.
2. Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism (Narayanan et al., 2019)
   - Core concept: transformer partitioning and tensor parallelism.
3. PipeDream: Generalized Pipeline Parallelism for DNN Training (Narayanan et al., 2019)
   - Core concept: pipeline scheduling and overlap of compute stages.
4. Petals: Collaborative Inference and Fine-tuning of Large Models (Borzunov et al., 2022)
   - Core concept: distributed inference with model sharding over peer-to-peer networks.
5. Communication-Efficient Learning of Deep Networks from Decentralized Data (McMahan et al., 2017)
   - Core concept: federated learning coordination patterns.
6. Efficient Large-Scale Language Model Training on GPU Clusters (various recent systems papers, 2023-2025)
   - Core concept: cluster orchestration, optimizer sharding, and high-throughput inference coordination.

## Architectural implication for the DLM project

The project should not attempt a universal “all-models” sharding method in v1. Instead, the first version should define a limited set of shardable model families and a scheduler that respects execution stages.

Recommended initial approach:

- start with a model family that is easy to decompose into layer or block stages;
- define a DAG of execution blocks;
- assign shards to nodes by capability and bandwidth;
- use one designated final node to aggregate the last steps if needed;
- keep a metadata index of shard -> node mapping and execution status;
- verify correctness by checking execution order and output plausibility before reward settlement.

## Conclusion

Theoretical and practical foundations already exist: distributed inference, pipeline and tensor parallelism, and federated coordination are mature enough to support an initial design. The remaining challenge is the system design layer: scheduling, validation, incentives, and DAO governance for a heterogeneous network of edge devices.
