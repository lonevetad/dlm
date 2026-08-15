# Skill: Distributed LLM research and architecture

## Purpose

Use this skill when starting new research or architecture work for a distributed LLM project. It helps focus the work on the most relevant technical questions and prevents drifting into broad, low-priority design speculation.

## Core questions to answer

1. Which models are viable for sharding and distributed inference?
2. Which partitioning pattern fits the model best: layer, tensor, pipeline, or MoE-based distribution?
3. What is the minimal acceptable network design for a first prototype?
4. Which parts belong on-chain and which parts belong off-chain?
5. How are validation, security, incentives, and aggregation handled?

## Research checklist

- Market scan of direct competitors and adjacent ecosystems.
- Literature scan covering model parallelism, pipeline parallelism, tensor parallelism, distributed inference, and federated learning.
- LLM shortlist focused on shard-friendliness and open-source availability.
- Initial architecture split: DAO, scheduler, model execution, validation, and reward logic.

## Good initial assumptions

- Keep v1 smaller and safer rather than trying to fully decentralize the final output generation.
- Root nodes coordinate execution and trust-critical services.
- Use hashes and metadata on-chain; keep prompt payloads off-chain when sensitive.
- Model-specific sharding rules are necessary.

## Good output format

- One research summary file.
- One architecture plan file.
- One memory file summarizing status and assumptions.
- One task list with open questions and next actions.

## Typical deliverables

- market_and_competitors.md
- llm_partitioning_and_parallelism.md
- open_source_llms_for_sharding.md
- dao_implementation_plan.md
- server_implementation_plan.md
