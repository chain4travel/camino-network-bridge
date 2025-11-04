const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");
const { ENV_VAR_MAP } = require("../config/networks");

/**
 * Validate that an address is a valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidAddress(address) {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate an array of validator addresses
 * @param {string[]} validators - Array of validator addresses
 * @throws {Error} If validation fails
 */
function validateValidators(validators) {
  if (!Array.isArray(validators)) {
    throw new Error("Validators must be an array");
  }

  if (validators.length === 0) {
    throw new Error("At least one validator is required");
  }

  const invalidAddresses = validators.filter((addr) => !isValidAddress(addr));
  if (invalidAddresses.length > 0) {
    throw new Error(`Invalid validator addresses found: ${invalidAddresses.join(", ")}`);
  }

  // Check for duplicates
  const uniqueValidators = new Set(validators.map((addr) => addr.toLowerCase()));
  if (uniqueValidators.size !== validators.length) {
    throw new Error("Duplicate validator addresses found");
  }
}

/**
 * Validate chain ID
 * @param {number} chainId - Chain ID to validate
 * @throws {Error} If validation fails
 */
function validateChainId(chainId) {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain ID: ${chainId}. Must be a positive integer.`);
  }
}

/**
 * Validate validator fee (in wei)
 * @param {string} validatorFee - Fee to validate (BigNumber string)
 * @throws {Error} If validation fails
 */
function validateValidatorFee(validatorFee) {
  try {
    const fee = ethers.BigNumber.from(validatorFee);
    if (fee.lt(0)) {
      throw new Error(`Invalid validator fee: ${validatorFee}. Must be non-negative.`);
    }
  } catch (error) {
    throw new Error(`Invalid validator fee: ${validatorFee}. ${error.message}`);
  }
}

/**
 * Parse and validate environment variables for deployment
 * @param {object} config - Network configuration
 * @param {string} networkName - Network name
 * @param {string} networkType - Network type (testnet, mainnet, local)
 * @param {string[]} defaultValidators - Default validators from config
 * @returns {object} Parsed configuration
 */
function parseDeploymentConfig(config, networkName, networkType, defaultValidators) {
  // Parse chain ID (env var overrides config)
  let chainId = config.chainId;
  if (process.env.CHAIN_ID) {
    const parsed = parseInt(process.env.CHAIN_ID);
    if (isNaN(parsed)) {
      throw new Error(`Invalid CHAIN_ID environment variable: ${process.env.CHAIN_ID}`);
    }
    chainId = parsed;
  }
  validateChainId(chainId);

  // Parse validator fee (env var overrides config)
  // Convert from ETH/CAM to wei
  let validatorFeeInEth = config.validatorFee;
  if (process.env.VALIDATOR_FEE) {
    validatorFeeInEth = process.env.VALIDATOR_FEE;
  }

  let validatorFee;
  try {
    validatorFee = ethers.utils.parseEther(validatorFeeInEth).toString();
  } catch (error) {
    throw new Error(
      `Invalid VALIDATOR_FEE: ${validatorFeeInEth}. Must be a valid ETH/CAM amount (e.g., "5" for 5 CAM).`,
    );
  }
  validateValidatorFee(validatorFee);

  // Parse validators based on network type
  let validators = defaultValidators;

  // Check for network-type-specific environment variables
  const envVar = ENV_VAR_MAP[networkType];
  if (process.env[envVar]) {
    validators = process.env[envVar].split(",").map((addr) => addr.trim());
  }

  return {
    chainId,
    validatorFee,
    validatorFeeInEth,
    validators,
    networkName,
    networkType,
  };
}

/**
 * Verify that the chain ID matches the network we're deploying to
 * @param {object} hre - Hardhat Runtime Environment
 * @param {number} expectedChainId - Expected chain ID from config
 * @returns {Promise<void>}
 */
async function verifyChainId(hre, expectedChainId) {
  const provider = hre.ethers.provider;
  const network = await provider.getNetwork();

  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Chain ID mismatch!\n` +
        `Expected: ${expectedChainId}\n` +
        `Connected to: ${network.chainId}\n` +
        `Network: ${hre.network.name}`,
    );
  }
}

/**
 * Save deployment information to a JSON file
 * @param {object} deploymentInfo - Deployment information to save
 * @param {string} networkName - Network name
 */
function saveDeployment(deploymentInfo, networkName) {
  const deploymentsDir = path.join(__dirname, "../../deployments");

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);

  // Add timestamp
  const deploymentData = {
    ...deploymentInfo,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2), "utf-8");

  console.log(`\nDeployment information saved to: ${deploymentPath}`);
}

/**
 * Load deployment information from a JSON file
 * @param {string} networkName - Network name
 * @returns {object|null} Deployment information or null if not found
 */
function loadDeployment(networkName) {
  const deploymentPath = path.join(__dirname, "../../deployments", `${networkName}.json`);

  if (!fs.existsSync(deploymentPath)) {
    return null;
  }

  const data = fs.readFileSync(deploymentPath, "utf-8");
  return JSON.parse(data);
}

/**
 * Format deployment information for console output
 * @param {object} deploymentData - Deployment information
 * @returns {string} Formatted output
 */
function formatDeploymentData(deploymentData) {
  const lines = [
    "\n" + "=".repeat(60),
    `DvBridge Deployment - ${deploymentData.networkName}`,
    "=".repeat(60),
    `Network: ${deploymentData.networkName} (${deploymentData.description})`,
    `Chain ID: ${deploymentData.chainId}`,
    `Proxy Address: ${deploymentData.proxyAddress}`,
    `Implementation Address: ${deploymentData.implementationAddress}`,
  ];

  // Add transaction hashes if available
  if (deploymentData.proxyTxHash) {
    lines.push(`Proxy Deployment Tx: ${deploymentData.proxyTxHash}`);
  }
  if (deploymentData.implementationTxHash) {
    lines.push(`Implementation Deployment Tx: ${deploymentData.implementationTxHash}`);
  }

  lines.push(
    `Validator Fee: ${deploymentData.validatorFeeInEth} (${deploymentData.validatorFee} wei)`,
    `Validators (${deploymentData.validators.length}):`,
    ...deploymentData.validators.map((v, i) => `  ${i + 1}. ${v}`),
    `Deployer: ${deploymentData.deployer}`,
    `Deployment Time: ${deploymentData.timestamp}`,
    "=".repeat(60) + "\n",
  );

  return lines.join("\n");
}

module.exports = {
  isValidAddress,
  validateValidators,
  validateChainId,
  validateValidatorFee,
  parseDeploymentConfig,
  verifyChainId,
  saveDeployment,
  loadDeployment,
  formatDeploymentData,
};
