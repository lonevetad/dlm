# DAO Implementation Plan (First Draft)

## Purpose

Define the initial decentralized governance and accounting layer for DLM. The DAO will manage identities, rewards, network state, prompt lifecycle, and governance actions while keeping computationally heavy token logic off-chain.

## Core principles

- Keep the smart contract state auditable and minimal.
- Use the blockchain for truth and settlement, not for full inference execution.
- Separate node identity, prompt tracking, and governance from model execution scheduling.
- Allow a phased design: minimal contracts first, then richer governance and slash logic.

## Key contract areas

### 1) Node registry contract

Purpose:

- register node identity,
- store node metadata,
- track node role (root or normal),
- keep resource snapshots,
- update liveness and availability.

Fields:

- nodeId UUID
- wallet address
- role enum
- capabilities: RAM, CPU, storage, bandwidth
- lastHeartbeat
- status: active / inactive / banned
- shardAssignments[]

Functions:

- registerNode()
- updateCapabilities()
- heartbeat()
- setRole()
- suspendNode()
- restoreNode()

### 2) User registry and auth contract

Purpose:

- store user identity and wallet linkage,
- manage account status,
- support prompt credit or balance accounting.

Minimal fields:

- userId
- wallet
- reputation
- activeSessions
- isVerified

Functions:

- registerUser()
- verifyUser()
- lockAccount()
- updateReputation()

### 3) Prompt lifecycle contract

Purpose:

- record submitted prompts,
- track status of validation and execution,
- maintain hashes and reference IDs for off-chain storage.

States:

- submitted
- accepted
- rejected
- queued
- assigned
- executing
- completed
- failed

Fields:

- promptId
- userId
- timestamp
- hash
- status
- assignedNodeSetHash
- rewardPoolReference

Functions:

- registerPrompt()
- markAccepted()
- markRejected()
- assignNodes()
- markExecuted()
- markFailed()

### 4) Reward and staking contract

Purpose:

- track token burn or spend for each prompt,
- pay contributors for execution,
- maintain slashing conditions for misbehavior.

Mechanics:

- user pays tokens to submit a prompt;
- root and compute node rewards are distributed from a pool or fee pool;
- bad nodes can burn staked funds after validation failures.

Functions:

- depositStake()
- burnPromptFee()
- distributeReward()
- slashNode()

### 5) Governance contract

Purpose:

- vote on protocol parameters,
- approve new root nodes,
- change shard allocation rules,
- update safety thresholds and model policy.

Examples:

- adjust prompt fee,
- raise or reduce node reliability threshold,
- enable or disable a model family,
- change reward split among root nodes and normal nodes.

### 6) Shard inventory registry

Purpose:

- keep a verifiable mapping of shard identifiers to hosts,
- record redundancy across nodes,
- support balancing policy among root nodes.

Fields:

- shardId
- modelVersion
- ownerNodeIds[]
- replicationFactor
- lastValidated

Functions:

- addShardReplica()
- removeShardReplica()
- rebalanceShardMap()

## Recommended phases

### Phase 1: minimal governance contract

- registry for nodes and users,
- prompt status tracking,
- reward accounting,
- governance votes for admin actions.

### Phase 2: staking and slashing

- requirements for node stake,
- proof-of-availability checks,
- slash conditions for missing deadlines and invalid outputs.

### Phase 3: richer policy and reward tuning

- subnets or model-specific pools,
- dynamic reward curves,
- governance for shard access policies and model enablement.

## Implementation notes

- Use Solidity for the chain contracts.
- Keep token economics simple in v1: one token unit for prompt fee and node reward accounting.
- Use off-chain metadata and encrypted logs for prompt payloads when needed.
- Keep all heavy execution maps and graphs in the backend database, with only hashes or IDs committed on-chain.
- The backend must enforce DAO membership before allowing user registration, node registration, and prompt submission.
- The Solidity contract is the source of truth for wallet ownership, node enrollment, and governance state.

## Risks and open issues

- Node reputation is critical for fairness and attack resistance.
- Prompt safety validation must be enforced before reward settlement.
- The system must avoid directly storing sensitive prompt text on the blockchain.
- The reward model needs clear logic for root-node and compute-node contribution splits.
