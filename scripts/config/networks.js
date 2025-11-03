/**
 * Network-specific configuration for bridge deployments
 * Note: validatorFee is specified in ETH/CAM (will be converted to wei)
 */

// TODO: Update validator fees for mainnets

const NETWORK_CONFIG = {
  columbus: {
    chainId: 501,
    networkType: "testnet",
    validatorFee: "5", // CAM
    description: "Camino Columbus Testnet",
  },
  camino: {
    chainId: 500,
    networkType: "mainnet",
    validatorFee: "5", // CAM
    description: "Camino Mainnet",
  },
  sepolia: {
    chainId: 11155111,
    networkType: "testnet",
    validatorFee: "0.0001", // ETH
    description: "Ethereum Sepolia Testnet",
  },
  ethereum: {
    chainId: 1,
    networkType: "mainnet",
    validatorFee: "0.0001", // ETH
    description: "Ethereum Mainnet",
  },
  bscTestnet: {
    chainId: 97,
    networkType: "testnet",
    validatorFee: "0.0002", // tBNB
    description: "BNB Smart Chain Testnet",
  },
  bsc: {
    chainId: 56,
    networkType: "mainnet",
    validatorFee: "0.0002", // BNB
    description: "BNB Smart Chain Mainnet",
  },
  hardhat: {
    chainId: 31337,
    networkType: "local",
    validatorFee: "0.042", // ETH
    description: "Hardhat Local Network",
  },
};

/**
 * Validator configuration shared across network types
 * Override via environment variables:
 * - TESTNET_VALIDATORS for testnets
 * - MAINNET_VALIDATORS for mainnets
 * - LOCAL_VALIDATORS for hardhat (will use test accounts if not set)
 */
const VALIDATOR_CONFIG = {
  testnet: [
    "0x291981335f930c2a06499fa5fd6e380ea5d59d46", // Camino Network Foundation
    "0xb2bd61961963448210a5f3c2994ce935f7daae2c", // Chain4Travel
    "0xb53aded16afe08d14e5c95dbdba4e6b30d9f8319", // DeVest
  ],
  mainnet: [],
  local: [],
};

/**
 * Get configuration for a specific network
 * @param {string} networkName - Name of the network
 * @returns {object} Network configuration
 */
function getNetworkConfig(networkName) {
  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(
      `No configuration found for network: ${networkName}. ` +
        `Available networks: ${Object.keys(NETWORK_CONFIG).join(", ")}`,
    );
  }
  return { ...config }; // Return a copy to prevent mutation
}

/**
 * Check if a network is a testnet
 * @param {string} networkName - Name of the network
 * @returns {boolean} True if testnet
 */
function isTestnet(networkName) {
  const config = NETWORK_CONFIG[networkName];
  return config && config.networkType === "testnet";
}

/**
 * Check if a network is mainnet
 * @param {string} networkName - Name of the network
 * @returns {boolean} True if mainnet
 */
function isMainnet(networkName) {
  const config = NETWORK_CONFIG[networkName];
  return config && config.networkType === "mainnet";
}

/**
 * Get network type for validator configuration
 * @param {string} networkName - Name of the network
 * @returns {string} Network type: 'testnet', 'mainnet', or 'local'
 */
function getNetworkType(networkName) {
  const config = NETWORK_CONFIG[networkName];
  if (!config) {
    throw new Error(
      `No configuration found for network: ${networkName}. ` +
        `Available networks: ${Object.keys(NETWORK_CONFIG).join(", ")}`,
    );
  }
  return config.networkType;
}

/**
 * Get validators for a specific network type
 * @param {string} networkName - Name of the network
 * @returns {string[]} Array of validator addresses
 */
function getValidators(networkName) {
  const networkType = getNetworkType(networkName);
  return [...VALIDATOR_CONFIG[networkType]];
}

module.exports = {
  NETWORK_CONFIG,
  VALIDATOR_CONFIG,
  getNetworkConfig,
  getValidators,
  getNetworkType,
  isTestnet,
  isMainnet,
};
