CREATE DATABASE
IF NOT EXISTS dlm CHARACTER
SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dlm;

CREATE TABLE
IF NOT EXISTS users
(
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet VARCHAR
(128) NOT NULL UNIQUE,
  user_id VARCHAR
(128) NOT NULL,
  username VARCHAR
(128) NOT NULL DEFAULT 'anonymous',
  created_at BIGINT NOT NULL
);

CREATE TABLE
IF NOT EXISTS nodes
(
  id INT AUTO_INCREMENT PRIMARY KEY,
  wallet VARCHAR
(128) NOT NULL UNIQUE,
  node_id VARCHAR
(128) NOT NULL,
  role VARCHAR
(32) NOT NULL,
  ram_mb BIGINT NOT NULL,
  cpu_tflops DOUBLE NOT NULL,
  storage_gb BIGINT NOT NULL,
  bandwidth_mbps DOUBLE NOT NULL,
  status VARCHAR
(32) NOT NULL DEFAULT 'active',
  last_heartbeat BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE
IF NOT EXISTS prompts
(
  id VARCHAR
(128) PRIMARY KEY,
  user_id VARCHAR
(128) NOT NULL,
  wallet VARCHAR
(128) NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_hash VARCHAR
(255) NOT NULL,
  status VARCHAR
(32) NOT NULL DEFAULT 'submitted',
  assigned_node_set_hash VARCHAR
(255) NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE
IF NOT EXISTS execution_plans
(
  id VARCHAR
(128) PRIMARY KEY,
  prompt_id VARCHAR
(128) NOT NULL,
  model_version VARCHAR
(128) NOT NULL,
  node_set_hash VARCHAR
(255) NOT NULL,
  plan_json JSON NOT NULL,
  created_at BIGINT NOT NULL
);
