# dlm
"DLM" (distributed language model) is a DAO-based LLM provider in which the language model(s) is sharded into pieces and distributed across multiple nodes, such that every node can contribute with its computational resources to serve a LLM's services, gaining some crypto tokens as a reward.
This project leverages (and it's aimed to be fully and deeply integrated with) the folowing project: "SIGNET-ETCH" ( https://github.com/SoweluAvanzo/signet-etch ).
This project takes inspiration from:
- federated learning,
- the Bitcoin protocol (a collaborative version, rather than a competitive one),
- Edge Computing
- typical DAOs voting and participation systems
- and the "torrent" technology to share clones and shards of data/files across the nodes in the networks.

The prompt computation is distributed across a randomly elected subset of computing nodes (similar to Bitcoin's "miners"), which earn tokens as a reward for the computation, and the result is send back after aggregating the partial computations.

The model of a LLM (mostly, open source ones) is subdivided into pieces ("shards") and stored in the nodes. Each node can store multiple shards, depending on its computational capacity.
Some "root" nodes are a priori known, hold most/all of an LLM's shards, and constitute the backbone of the whole network; they are also the main sources of the LLM's shards that nodes new to the network can request.
There are two types of nodes: ; the normal nodes, which elect the subset of computing nodes to be assigned to digest a given prompt, perform the sharded computation, (the leader) aggregate the result and provide
