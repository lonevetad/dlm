# DLM Project Memory

## Project identity

- Project name: DLM (Distributed Language Model)
- Goal: build a DAO-backed, shard-distributed LLM inference network where nodes contribute compute, storage, and bandwidth to run open-source models and receive token rewards.
- Repository: /home/cronomatita/Desktop/lavoro/sowelu/dlm
- Primary design inspiration: federated learning, edge computing, swarm coordination, torrent/shard distribution, and Bitcoin-like coordination with DAO governance.
- Related project: SIGNET-ETCH (https://github.com/SoweluAvanzo/signet-etch)

## Source brief

The project goal is to:

- shard one or more open-source LLMs across many heterogeneous nodes;
- let each node contribute hardware resources;
- reward contributors with crypto tokens;
- maintain a blockchain/DAO layer for node registry, governance, and prompt accounting;
- allow a single node to complete the final output step in the first implementation version to ease early development.

## Current working assumptions

- The system is intentionally split between two major domains:
  1. DAO and blockchain/back-end governance layer.
  2. LLM execution orchestration and distributed inference layer.
- The initial implementation should prioritize design and architecture before deep model sharding mechanics.
- The system should support root nodes and normal nodes, with root nodes managing registry, shard inventory, prompt orchestration, reward accounting, and governance.
- Security checks should exist at two levels: lightweight pre-acceptance validation and deeper risk analysis before execution.

## Research backlog

1. Market/industry scan for similar companies or services.
2. Scientific research on model parallelism, distributed inference, and result aggregation.
3. Open-source LLM short-list for shard-friendly models.
4. Initial DAO implementation plan.
5. Initial server implementation plan.

## Key references already identified

- Petals: distributed inference over a peer-to-peer network of model shards.
- Gensyn: decentralized AI infrastructure for training, verification, and settlement.
- Bittensor: decentralized AI network with tokenized incentives and subnet coordination.
- Petals and Gensyn are the closest conceptual analogues to the project’s architecture.
- Relevant ML research fields:
  - model parallelism,
  - pipeline parallelism,
  - tensor parallelism,
  - MoE sharding,
  - federated learning,
  - distributed inference scheduling,
  - graph-based execution orchestration.

## Important design constraints and open questions

- A full end-to-end distributed LLM execution is a difficult engineering problem; the project must start with a relaxed model where a final aggregation node may complete the final output generation.
- Sharding must match model topology. Different open-source LLMs support fragmentation differently.
- A network election scheme is needed to select nodes per shard without overloading the most capable nodes.
- The project must distinguish between on-chain facts (registrations, rewards, governance) and off-chain heavy computation (prompt execution, shard scheduling, partial inference).
- A robust safety and security layer is mandatory for prompt filtering and abuse prevention.

## Current task status

- [x] Read the repository brief and project ideas.
- [x] Create the project memory and research working structure.
- [x] Market research: identify companies and services similar to DLM.
- [x] Scientific research: identify relevant parallelism and model-sharding techniques.
- [x] Open-source LLM shortlist: rank shard-friendly candidates.
- [x] DAO implementation plan: draft concept and contracts.
- [x] Server implementation plan: draft core architecture and services.
- [x] Execution DAG prototype: conceptually define the scheduler and shard dependency model.
- [x] Refactor backend to TypeScript.
- [x] Add MariaDB-ready persistence layer and environment-driven configuration.
- [x] Enforce DAO-backed user and node validation before registration and prompt submission.

## Current implementation state

- Backend is now TypeScript-based and can run via `ts-node`.
- Database configuration is environment-driven through `.env` variables.
- MariaDB schema is codified in [server/src/db/schema.sql](../server/src/db/schema.sql).
- Solidity DAO remains the authoritative registry for wallet-enabled identities and node enrollment.
- Prompt and execution flows are now structured around lifecycle services and model schedulers.

## Next session focus

The next step is to align the full backend with a live MariaDB instance, add real DAO contract deployment wiring, and evolve the scheduler into a stricter model-aware orchestration service with richer node reputation and execution tracking.
