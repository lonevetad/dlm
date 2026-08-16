# v2-model-scheduler: Execution DAG prototype

## Goal

Define an execution plan for a first distributed inference round without requiring full end-to-end decentralization of the final generation step.

## Core assumption

A prompt execution round is treated as a dependency graph of worklets. Each worklet corresponds to a logical shard or a block of model computation.

## Worklet model

Each shard is assigned metadata:

- shardId
- modelVersion
- stageName
- dependencyIds[]
- requiredRamMb
- requiredCpuTflops
- requiredBandwidthMbps
- roleHint: root | normal
- replicationFactor

## DAG example

For a transformer-like model, the scheduler can define a practical stage sequence:

1. prompt_embedding
2. layer_block_01
3. layer_block_02
4. ...
5. final_attention_aggregation
6. output_projection
7. final_output_node

The final output node may be a single designated node in v1, which reduces complexity significantly.

## Scheduling strategy

- Step 1: filter nodes by liveness and capability.
- Step 2: for each shard, compute the eligible node pool.
- Step 3: select the smallest sufficient node set satisfying resource constraints.
- Step 4: assign a root coordinator and a final aggregation node.
- Step 5: store the assignment map in the backend and commit a hash to the DAO.

## Selection logic

The scheduler should prefer nodes with:

- enough RAM for the shard footprint,
- sufficient CPU and bandwidth to finish the stage promptly,
- stable heartbeat timestamps,
- minimal current load,
- non-overloaded root-node roles for critical orchestration tasks.

## Result aggregation

The system should record:

- shard result hash,
- execution node id,
- stage execution time,
- validation status,
- final output node id.

A final aggregation node checks the ordering and completeness of shards before returning the final answer.

## Risks

- dependency mismatch between shards,
- uneven node capabilities,
- incomplete node set due to churn,
- vulnerability to malicious or lazy nodes,
- difficulty of generalizing the strategy across very different model architectures.

## Initial recommendation

Start with a smaller model family and a simplified DAG. The first realistic milestone is a two-tier scheduler:

- root nodes manage orchestration and metadata,
- normal nodes execute specific stage shards,
- one designated final node handles output assembly.
