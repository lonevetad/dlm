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
Each node register itself by providing all of its maximum resources capabilities (for example: MegaBytes of available RAM, approximated CPU's teraflop count, available internal memory storage in GigaBytes ), all rounded down to the lowest integer, its MAC address, their current global IP address, and other data needed to uniquely identify them, and they get an identification number (an "UUID") as ID in return, which will be used during the login to create a logged session. During such logged sections, all devices ("nodes") must share their current resources availability to the "root" nodes in order to be properly elected in future/immediate computation rounds: this is required to avoid electing a node who can't currently sustain a computation request.
Similarly, all users (human, mostly) wanting to execute a prompt need to be properly logged in (the registration step requires an optional username, a mandatory email and a password; and the login process follows the best modern standard, like multi-factor authentication, using temporary and renewable session IDs, encryption, etc).

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

### Prompt submission

A registered and logged-in user can submit the computation of a prompt. In this first development steps, a prompt is textual only.
A prompt is submitted, under the hood, to the "root" nodes.

Several security checks are run against the submitted prompt, both at the very first steps (even before recording it) and after being accepted by the whole system.

Also, each user must wait at least 10 seconds (up to 30 seconds, if the prompt is very long) before submitting a new prompt, in order to avoid flooding and DOS attacks.

Submitting a prompt (after the first "free" ones, which can be configured: the limits could be, but are not limited to, "N each day", "M each week", "L each months", etc.) requires paying a certain amount of tokens. Longer prompts might require extra costs.
This both funds the node's executions and helps avoiding DOS and DDoS attacks

#### First checks

The first security checks are the most common, easies and cheapest checks; failing even a single one of them dooms a prompt to be entirely discarded (with an appropriated error message BUT without any sensitive details).
These first checks are, but not limited to, the following one:

- after-trimming length: a prompt can't exceed, for instance, 10 MB in size.
- any kind of "injection" (likely, SQL-injection)
- inappropriate content and spam (most likely, a dictionary-based check and a frequency analysis for dictionary-unknown words exceeding, for instance, 20% of the overall prompt's words count)

#### Deeper checks

After the prompt registration (see the next chapter), the non-"normal" nodes (at least, some of them) execute deeper checks and validations.
The following list enumerates a non-comprehensive list of checks:

- illegal prompts (for instance, the famous "recipe for building a bomb", or "pornographic content", or "recipe for drugs", etc.)
- unintelligible content (i.e., a prompt that no human would genuinely produce, unless due to some malevolent intentions like wasting node's resources and DoS/DDoS)
- binary representation of viruses
- some kind of injection
- other ways to hack the whole system (or parts of it)

#### Registering a prompt

Upon succeeding the first checks, a prompt is registered in the system and queued to be processed.
To register a prompt in the system, both a DAO (and its blockchain) and a server's subcomponent (equipped with a common database) are involved:

- the server's subcomponent:
  - it register the prompt's text in a textual file (the file's name is the timestamp in ISO format as the suffix and "p\_" as the prefix, and that file is stored in a folder whose name is the user's ID); the prompt (either encrypted or in plain-text) is saved for future safety checks that the Police (or other Government departments) might request.
  - the database register the user's ID, the timestamp mentioned above, and the prompt's hash; the original prompt's text can be retrieved by combining the with the first two information (therefore, by forming the "full file path"), while the hash is just kept for future usages.
  - the response is saved in a file, similarly to the prompt: the response's file name has "r\_" as the prefix and the same timestamp is the suffix.
- the DAO:
  - at first, it registers the prompt by registering the following information: the user's ID, the timestamp and the status of the prompt acceptance/elaboration (in Solidity, it would be a "map( UUID => map(string => PromptElaborationStatusEnum) )").
  - after the deeper checks, the prompt gets advanced towards the "election of set of computing nodes".
  - after the election of the set of computing nodes, such set is saved for transparency (either on the blockchain or in the database: it depends on the actual set's size and such decision must be taken at design level rather than at runtime level; if "database" is the choosen method, then the set's hash is saved in the DAO as well).
  - the prompt elaboration status is updated upon its ending

### Sharding and sharded computation

#### Sharding

This is the most complex section and, currently (15/08/2026), there are just few details about that.
In short, an LLM's model and its computation are divided into "pieces" ("shards"), which are spread and replicated across the network and are executed to produce all partial results and the final output of a given prompt.
This is not a small feat: matrices multiplication is one of the easiest substep to be divided into parallel computations ("GPU"s are already doing that, both in neural networks and videogames / image/video manipulation), but there are neural networks and LLMs with way more complex structures that a plain chain of matrices multiplications.
Future developments might require specific strategies' implementations for both specific models and specific models' versions: it all depend on how are flexible the models' implementation and structures and how automatically they can be fragmented; similarly, it also depends on how easy a computation could be fragmented and recombined to produce a coherent and correct result.
Also, some models might be involving multiple sub-structures to be run either in sequence on in a cyclic, recurrent graph-alike network; therefore, the "normal" nodes and the shards needs to be properly marked and invoked/run in order to respect the proper execution flow. This makes this project even more complex and engineering-challenging than expected. The best modern coding and engineering standards are required.

#### Sharded computation

Each node might be assigned to execute a prompt computation; "root" node might be configured to NOT being involved into prompts computations in order to save resources for other tasks (for instance: login acceptance, registration acceptance, running the blockchain's parts and/or DAOs, performing the voting rounds, keeping track of the "normal" nodes availabilities and current available resources, etc.).
A computation round has an UUID as its ID, a timestamp of
Upon being elected in a prompt computation round (each identified with a UUID)

### Joining the network

A new node joining a network will require to hold one or more of the models' shards in order to properly be part of the network and to make itself useful.
The nodes, upon logging in, contact both the a-priori known "root" nodes and all of the other "root" nodes (likely, in a broadcast manner) to both know their connection data (usually, their IP, so that they)

## Collaborations and Greetings

This project is meant to be part of the "Norta DeSyCo OÜ" Company ( https://nortadesyco.xyz/ ) portfolio, owned by Alex Norta ( alex.norta@nortadesyco.xyz ), Sowelu Elios Avanzo ( sowelu.avanzo@nortadesyco.xyz ) and Marco Ottina ( marco.ottina@nortadesyco.xyz ).
This project is also meant to be fully incorporated with Avanzo's project "SIGNET-ETCH" ( https://github.com/SoweluAvanzo/signet-etch ) into a single, coherent future project.

I, Marco Ottina, deeply thanks Alex and Sowelu for all the support during the beginning of this project's development and each following steps.

## Local test artifacts

Tests write temporary artifacts under `server/data/test-artifacts/` inside per-test subfolders. These folders are intentionally ignored by `.gitignore` to avoid committing generated files.

Updated tests that use per-test artifact folders:

- [tests/prompt-artifact-service.test.ts](tests/prompt-artifact-service.test.ts)
- [tests/execution-lifecycle.test.ts](tests/execution-lifecycle.test.ts)
- [tests/validators-regression.test.ts](tests/validators-regression.test.ts)

Inspect `server/data/test-artifacts/` when running tests locally.

### CI with transient MariaDB

For full integration tests we provide a GitHub Actions example that runs a transient MariaDB container and executes the test suite against it. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

DB selection: use the `DLM_DB_MODE` environment variable (or `--db-mode=` CLI flag) to pick the backend when running tests locally. Example values:

- `mock` — lightweight JSON-backed mock DB (local unit tests)
- `mariadb` — real MariaDB instance (CI/integration)

DB client implementations

- `JsonDbClient` — file-backed JSON mock (`DLM_DB_MODE=mock`).
- `MariaDbClient` — real MariaDB pool + schema creator (`DLM_DB_MODE=mariadb`).
- `SqliteDbClient` — SQLite in-memory for local SQL-like tests (`DLM_DB_MODE=sqlite`, requires `better-sqlite3`).
- `InMemoryDbClient` — volatile in-memory mock good for unit tests (`DLM_DB_MODE=memory`).

If you prefer running integration tests locally, you can run MariaDB in Docker with the same environment variables used in CI and execute `node --test`.
