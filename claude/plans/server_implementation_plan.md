# Backend Server Implementation Plan (First Draft)

## Purpose

Define the early server architecture that supports node registration, prompt intake, shard orchestration, execution coordination, and database-backed transparency for the DLM network.

## Core architecture

### 1) API gateway

Responsibilities:

- user registration and login,
- prompt submission,
- node heartbeat and capability reporting,
- status queries,
- governance actions and node monitoring.

Interfaces:

- /users/register
- /users/login
- /nodes/register
- /nodes/heartbeat
- /prompts/submit
- /prompts/status
- /governance/vote

### 2) Authentication and identity service

Responsibilities:

- password hashing,
- MFA/session management,
- wallet identity checks,
- user and node login flows,
- access token issuance.

Key requirements:

- secure user sessions,
- short-lived tokens,
- refresh tokens,
- audit-friendly session logs.

### 3) Node registry and capability service

Responsibilities:

- accept node resources data,
- store current capability and liveness metrics,
- compute eligibility for shard assignment,
- maintain root vs normal node classification.

Data model:

- id, wallet, role, RAM, storage, CPU, bandwidth, geolocation metadata, heartbeat timestamp.

### 4) Prompt validation service

Responsibilities:

- run lightweight checks before storing prompts,
- detect obvious spam and malicious input,
- escalate suspicious prompts to deeper analysis,
- reject invalid requests quickly.

Validation pipeline:

- size validation,
- trim and normalization,
- suspicious content heuristics,
- injection and prompt attack heuristics,
- legal and policy screening.

### 5) Scheduler and shard orchestration service

Responsibilities:

- select the nodes assigned to a prompt,
- map shards to node candidates,
- monitor execution completion,
- maintain execution DAG metadata and stage ordering,
- orchestrate partial result aggregation.

Core logic:

- model registry maps model version to shard layout;
- shard metadata contains stage type, dependency, replication, and required node capability;
- assignment engine selects capable nodes and stores a mapping of shard -> node ids for the prompt execution round.

### 6) Execution worker layer

Responsibilities:

- run partial model computation on assigned nodes,
- exchange activation tensors or partial outputs,
- report completion to the scheduler,
- provide a final output aggregation step if needed.

Important design:

- in v1, one final node may be allowed to complete the last step, reducing complexity.
- workers should emit execution proofs and performance metrics to support reward settlement.

### 7) Result aggregation and safety service

Responsibilities:

- collect partial output fragments,
- validate execution ordering,
- detect invalid or incomplete results,
- recombine outputs into a coherent final response,
- generate a confidence or validation signal.

### 8) Reward and accounting service

Responsibilities:

- calculate prompt fees,
- allocate rewards among contributing nodes,
- maintain ledger of payout attempts,
- interface with the DAO contracts and on-chain settlement.

### 9) Storage and persistence layer

Suggested components:

- relational database for user and node records,
- object storage or blob store for prompt and response files,
- cache for scheduler state and node availability,
- encrypted audit archive for sensitive prompt data.

Suggested tables or collections:

- users
- nodes
- prompts
- prompt_status
- model_shards
- shard_assignments
- execution_runs
- rewards

## Reference technology stack

Suggested initial stack:

- backend: Node.js or Python FastAPI
- database: PostgreSQL
- cache: Redis
- message broker: RabbitMQ or Kafka
- blockchain: Solidity smart contracts with EVM-compatible environment
- model orchestration: Python + PyTorch/Hugging Face tooling

## Phase plan

### Phase 1: core system skeleton

- user registration and login
- node registration and heartbeat
- prompt submission and status tracking
- simple scheduler with mocked shard execution

### Phase 2: distributed orchestration

- shard metadata and execution DAG
- assignment algorithm with capability checks
- partial execution aggregation

### Phase 3: real model integration

- add one or two candidate open-source models
- production-grade validation and performance benchmarking
- reward and slash controls

## Key risks

- partial outputs may be inconsistent across nodes;
- scheduling over heterogeneous nodes is complex;
- prompt safety is essential for legitimacy;
- LLM sharding requires model-specific logic and not a one-size-fits-all solution.

## Recommended first milestone

Build a mock network with:

- root node coordinator,
- normal node registry,
- fake prompt lifecycle,
- scheduler assignment map,
- a single-model prototype with a final aggregation node.

This milestone validates the full lifecycle before building a large production-grade distributed model stack.
