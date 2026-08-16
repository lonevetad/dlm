# Journal: execution DAG and scheduler prototype

## Date

2026-08-16

## Objective

Translate the DAO and server plan into a realistic execution model for a distributed inference round, with explicit shard dependencies and a minimal final-output relaxation.

## Key architectural decision

The system should not attempt a fully decentralized final generation step in the first working version. Instead, a single final aggregation node is allowed to complete the terminal output stage once all partial execution outputs have been checked for dependency order and completeness.

## Worklet model

Each model shard is represented as a worklet with metadata:

- shardId
- modelVersion
- stageName
- dependencyIds[]
- requiredRamMb
- requiredCpuTflops
- requiredBandwidthMbps
- roleHint
- replicationFactor

## Execution-stage pattern

The first scheduler draft follows a transformer-style pipeline:

1. prompt embedding
2. layer block execution
3. attention or transformer stage aggregation
4. output projection
5. final aggregation / terminal output completion

This model is compatible with a practical early version because the stage dependencies are explicit and the scheduler can assign them to root and normal nodes based on validated capabilities.

## Scheduling logic

- filter nodes by heartbeat and current availability;
- rank eligible nodes by RAM, CPU, and bandwidth;
- assign minimal sufficient workers per shard;
- record the mapping in backend state;
- commit a compact hash of the chosen node set to the DAO;
- keep the full assignment payload and execution metadata in the backend database.

## Node policy

The scheduler should prefer:

- stable root nodes for orchestration,
- normal nodes for shard execution,
- nodes whose current resource snapshots remain above the required threshold,
- nodes with low load and low network latency.

## Aggregation policy

The final aggregation step should validate:

- all shard dependencies have run,
- the execution order is consistent,
- the output is complete and coherent,
- no critical node is missing or failed.

## Risks and constraints

- model-specific sharding is highly architecture-dependent;
- scheduler fairness is essential to prevent centralization or overload;
- prompt safety validation is still required before any execution stage begins;
- heterogeneity across devices can cause uneven execution completion times.

## Decisions for the next implementation step

- implement a minimal shard metadata registry in the backend;
- add capability scoring for node selection;
- keep the first prototype model family small enough to support clear stage boundaries;
- treat the final output node as an explicit orchestration role in the first milestone.

## References

- Petals distributed inference research
- Gpipe and pipeline-parallelism literature
- Megatron-LM tensor-parallelism literature
- DLM project memory and architecture notes
