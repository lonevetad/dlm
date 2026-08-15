# dlm

## Brief overview

"DLM" (distributed language model) is a DAO-based LLM provider in which the language model(s) is sharded into pieces and distributed across multiple nodes, such that every node can contribute with its computational resources to serve a LLM's services, gaining some crypto tokens as a reward.
This project leverages (and it's aimed to be fully and deeply integrated with) the following project: "SIGNET-ETCH" ( https://github.com/SoweluAvanzo/signet-etch ).

### Inspiration

This project takes inspiration from:

- federated learning,
- the Bitcoin protocol (a collaborative version, rather than a competitive one),
- Edge Computing
- typical DAOs voting and participation systems
- and the "torrent" technology to share clones and shards of data/files across the nodes in the networks.

## Core

The model of a LLM (mostly, open source ones) is subdivided into pieces ("shards") and stored in the nodes. Each node can store multiple shards, depending on its computational capacity (especially, RAM).

The prompt computation is distributed across a randomly elected subset of computing nodes (similar to Bitcoin's "miners"), which earn tokens as a reward for the computation, and the partial computations are aggregated to produce the result to be sent back.

Assuming a large enough network, some nodes might share the same model shards with other nodes, therefore there might be some redundancy. The main benefits are parallelism and resilience towards nodes disconnection.
It also implies one problem: not all nodes are strictly required in each and every prompt computation, a subset of nodes is fairly enough to properly digest a prompt, therefore a methodology to elect such subset is required.
The first version of such election methodology is fairly simple: for each shard, a pre-established amount of nodes "N" (usually, 1-3) are randomly selected. Further improvements might cross validate the random selection across the "electing nodes" (the "root" nodes, see later) to ensure a fair and equal election opportunity across all nodes and time.
This implies the need of keeping a big enough mapping (shard index -> set of elected nodes), which requires a sufficiently large resources availability, therefore not all nodes can serve this purpose: only the "root" ones (see later).

### Node Types

The network nodes are divided into two different roles depending on their resources availability (mostly, RAM, computational power and internet bandwidth): the "root" and the "normal" nodes.

#### Root nodes

Some "root" nodes are known a priori (due to being owned by this very project) while others simply join the network, and all of them constitute the backbone of the whole network.

They absolves a lot of functionalities:

- hold most/all of an LLM's shards,
- collectively decide the shards allocation across the "normal" nodes (especially, those who recently joined the network); they might also keep an "inventory" to ensure the most equal and balanced shards replication across the whole network (i.e., the amount of nodes holding the "most common" shard should not differ much to the amount of nodes holding the "least common" shard)
- receive the prompts and initiate the whole process
- manage the prompt sharding and the partial results aggregation
- run the DAO managing the whole project:
  - bookkeeping all nodes identities (with some kind of login/registration and node identification [via an UUID]) and their roles/types
  - bookkeeping all registered users (and their wallets)
  - maintaining the history of the prompts execution (and the set of elected nodes)
  - mint the reward tokens
  - burn the users' tokens upon submitting a prompt
  - keeps a database with the prompts (due to security reasons), each properly encrypted

Root nodes might be further subdivided depending of their capabilities: some might just run the DAO (and its blockchain), others just store and provide the model shards, etc.

#### Normal nodes

The "normal" nodes simply hold one or more model shards, gets elected, receive a prompt, perform the actual computation and receive the tokens as a reward.
