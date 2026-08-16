// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DLMDAO {
    enum NodeRole {
        None,
        Root,
        Normal
    }

    enum PromptStatus {
        Submitted,
        Accepted,
        Rejected,
        Queued,
        Assigned,
        Executing,
        Completed,
        Failed
    }

    struct NodeInfo {
        address wallet;
        string nodeId;
        NodeRole role;
        uint256 ramMb;
        uint256 cpuTflops;
        uint256 storageGb;
        uint256 bandwidthMbps;
        bool active;
        uint256 lastHeartbeat;
    }

    struct UserInfo {
        address wallet;
        string userId;
        string username;
        bool exists;
    }

    struct PromptInfo {
        uint256 promptId;
        address user;
        string userId;
        string hash;
        string promptRef;
        PromptStatus status;
        uint256 createdAt;
        uint256 feePaid;
        string assignedNodeSetHash;
    }

    mapping(address => NodeInfo) public nodes;
    mapping(address => UserInfo) public users;
    mapping(uint256 => PromptInfo) public prompts;

    uint256 public promptCount;
    address public admin;
    uint256 public constant PROMPT_FEE = 1 ether;

    event NodeRegistered(
        address indexed wallet,
        string nodeId,
        NodeRole role,
        uint256 ramMb,
        uint256 cpuTflops,
        uint256 storageGb,
        uint256 bandwidthMbps
    );

    event UserRegistered(
        address indexed wallet,
        string userId,
        string username
    );

    event PromptSubmitted(
        uint256 indexed promptId,
        address indexed user,
        string userId,
        string hash,
        uint256 feePaid
    );

    event PromptStatusUpdated(uint256 indexed promptId, PromptStatus status);

    event RewardAllocated(
        address indexed wallet,
        uint256 amount,
        string reason
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    function registerNode(
        string memory nodeId,
        NodeRole role,
        uint256 ramMb,
        uint256 cpuTflops,
        uint256 storageGb,
        uint256 bandwidthMbps
    ) external {
        require(bytes(nodeId).length > 0, "Node id required");
        require(
            nodes[msg.sender].wallet == address(0),
            "Node already registered"
        );

        nodes[msg.sender] = NodeInfo({
            wallet: msg.sender,
            nodeId: nodeId,
            role: role,
            ramMb: ramMb,
            cpuTflops: cpuTflops,
            storageGb: storageGb,
            bandwidthMbps: bandwidthMbps,
            active: true,
            lastHeartbeat: block.timestamp
        });

        emit NodeRegistered(
            msg.sender,
            nodeId,
            role,
            ramMb,
            cpuTflops,
            storageGb,
            bandwidthMbps
        );
    }

    function updateNodeHeartbeat() external {
        require(nodes[msg.sender].wallet != address(0), "Node not registered");
        nodes[msg.sender].lastHeartbeat = block.timestamp;
    }

    function registerUser(
        string memory userId,
        string memory username
    ) external {
        require(bytes(userId).length > 0, "User id required");
        require(!users[msg.sender].exists, "User already registered");

        users[msg.sender] = UserInfo({
            wallet: msg.sender,
            userId: userId,
            username: username,
            exists: true
        });

        emit UserRegistered(msg.sender, userId, username);
    }

    function submitPrompt(
        string memory userId,
        string memory promptHash,
        string memory promptRef
    ) external payable returns (uint256) {
        require(users[msg.sender].exists, "User not registered");
        require(msg.value >= PROMPT_FEE, "Prompt fee insufficient");
        require(bytes(promptHash).length > 0, "Prompt hash required");

        uint256 promptId = ++promptCount;
        prompts[promptId] = PromptInfo({
            promptId: promptId,
            user: msg.sender,
            userId: userId,
            hash: promptHash,
            promptRef: promptRef,
            status: PromptStatus.Submitted,
            createdAt: block.timestamp,
            feePaid: msg.value,
            assignedNodeSetHash: ""
        });

        emit PromptSubmitted(
            promptId,
            msg.sender,
            userId,
            promptHash,
            msg.value
        );
        return promptId;
    }

    function updatePromptStatus(
        uint256 promptId,
        PromptStatus status
    ) external onlyAdmin {
        require(prompts[promptId].promptId != 0, "Prompt not found");
        prompts[promptId].status = status;
        emit PromptStatusUpdated(promptId, status);
    }

    function setAssignedNodeSetHash(
        uint256 promptId,
        string memory nodeSetHash
    ) external onlyAdmin {
        require(prompts[promptId].promptId != 0, "Prompt not found");
        prompts[promptId].assignedNodeSetHash = nodeSetHash;
    }

    function distributeReward(
        address wallet,
        uint256 amount,
        string memory reason
    ) external onlyAdmin {
        require(wallet != address(0), "Invalid wallet");
        require(amount > 0, "Reward amount zero");
        emit RewardAllocated(wallet, amount, reason);
    }
}
