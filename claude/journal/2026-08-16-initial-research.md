# Journal: Initial research and project framing

## Date

2026-08-16

## Objective

Start the first implementation phase by validating the project thesis, identifying the closest existing solutions, and formalizing the initial DAO and backend architecture.

## Steps completed

1. Reviewed the project brief in [README.md](../../README.md) and [structures_and_ideas.md](../../structures_and_ideas.md).
2. Confirmed the project objective: shard-based distributed inference, DAO governance, and token economics for compute contribution.
3. Documented the project context in [claude/MEMORY.md](../MEMORY.md).
4. Carried out an initial market scan for similar companies and services.
5. Completed a research pass on distributed LLM partitioning and parallelism.
6. Shortlisted open-source LLMs suitable for a shard-first architecture.
7. Drafted the first implementation plan for the DAO layer and backend server layer.

## Main findings

- Petals, Gensyn, and Bittensor are the closest market analogues.
- Model sharding is feasible through model parallelism, pipeline parallelism, tensor parallelism, and MoE expert routing.
- A practical first version should relax the requirement for fully distributed final output generation by allowing one node to complete the last step.
- The DAO should manage identity, rewards, prompt statuses, governance, and transparency; heavy inference should be handled outside the chain.
- Small or mid-sized open-source models are preferable as the initial prototype target.

## Decisions for the next phase

- Prototype the network with a smaller, shard-friendly model such as Gemma, TinyLlama, or Llama-class models.
- Use a DAG scheduler for shard execution, with root nodes coordinating task assignment and validation.
- Keep on-chain state minimal but auditable, while off-chain components handle execution complexity and local storage.
- Refactor the backend to TypeScript and use MariaDB as the canonical relational database for user, node, prompt, and execution-plan records.
- Validate users and nodes against the Solidity DAO before accepting them into the backend processes.

## References

- Petals project: https://petals.dev/
- Gensyn: https://www.gensyn.ai/
- Bittensor: https://www.bittensor.com/
- Relevant literature: Gpipe, Megatron-LM, PipeDream, Petals, Federated Learning work from McMahan et al.
