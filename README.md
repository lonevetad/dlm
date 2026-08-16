# DLM

## Brief overview

DLM is a DAO-backed distributed language model network: open-source model shards are distributed across independent nodes, coordinated by a backend scheduler, and validated against a Solidity governance/identity layer. The project is built to support a user-facing LLM service without centralizing execution in one data center.

## Current architecture

- DAO layer: Solidity contract in [contracts/DLMDAO.sol](contracts/DLMDAO.sol)
- Backend: TypeScript-based server in [server/app.ts](server/app.ts)
- Persistence: MariaDB schema under [server/src/db/schema.sql](server/src/db/schema.sql)
- Configuration: environment variables via [server/src/config/env.ts](server/src/config/env.ts) and [.env.example](.env.example)
- Scheduling: model registry + plan engine in [server/src/services/ModelRegistry.ts](server/src/services/ModelRegistry.ts) and [server/src/services/ExecutionPlanService.ts](server/src/services/ExecutionPlanService.ts)

## Key constraints now enforced

- TypeScript instead of plain JavaScript for backend code
- Local MariaDB storage with credentials loaded from environment variables
- Solidity DAO as the source of truth for wallet and identity registration checks
- User and node validation includes DAO membership verification before registration or prompt submission

## Working stack

- Node.js + Express in TypeScript
- MariaDB for users, nodes, prompts, execution plans
- Ethers.js for DAO reads
- Solidity DAO for on-chain identity/accounting

## Status

This repository is now in a refactored, architecture-first phase with a real DAO contract, a TypeScript API, and a MariaDB-backed persistence plan. The codebase is in active evolution toward a more production-oriented distributed scheduling architecture.
