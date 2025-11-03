const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const { getNetworkConfig, getValidators } = require("./config/networks");
const {
  validateValidators,
  parseDeploymentConfig,
  verifyChainId,
  saveDeployment,
  formatDeploymentData,
  loadDeployment,
} = require("./utils/deployment");

/**
 * Deploy the DvBridge contract with UUPS proxy pattern
 * @param {object} config - Deployment configuration
 * @returns {Promise<object>} Deployment information
 */
async function deployDvBridge(config) {
  const { chainId, validatorFee, validators, networkName } = config;

  console.log(`\nDeploying DvBridge to ${networkName}...`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Validator Fee: ${validatorFee}`);
  console.log(`Validators: ${validators.length}`);

  const DvBridge = await ethers.getContractFactory("DvBridge");

  console.log("\nDeploying UUPS proxy...");
  const proxy = await upgrades.deployProxy(DvBridge, [chainId, validatorFee, validators], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.deployed();
  console.log(`Proxy deployed to: ${proxy.address}`);

  const proxyTxHash = proxy.deployTransaction.hash;
  console.log(`Proxy deployment tx: ${proxyTxHash}`);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxy.address);
  console.log(`Implementation deployed to: ${implementationAddress}`);

  const provider = ethers.provider;
  let implementationTxHash = null;

  try {
    const currentBlock = await provider.getBlockNumber();
    for (let i = 0; i < 100; i++) {
      const blockNumber = currentBlock - i;
      const block = await provider.getBlockWithTransactions(blockNumber);

      for (const tx of block.transactions) {
        if (tx.to === null) {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          if (
            receipt.contractAddress &&
            receipt.contractAddress.toLowerCase() === implementationAddress.toLowerCase()
          ) {
            implementationTxHash = tx.hash;
            console.log(`Implementation deployment tx: ${implementationTxHash}`);
            break;
          }
        }
      }

      if (implementationTxHash) break;
    }
  } catch (error) {
    console.warn("Could not find implementation deployment transaction:", error.message);
  }

  return {
    proxyAddress: proxy.address,
    implementationAddress,
    proxyTxHash,
    implementationTxHash,
  };
}

/**
 * Main deployment function
 */
async function main() {
  const networkName = hre.network.name;
  console.log(`Starting deployment on network: ${networkName}`);

  // Get network configuration
  const networkConfig = getNetworkConfig(networkName);
  const networkType = networkConfig.networkType;
  const defaultValidators = getValidators(networkName);

  console.log(`Network: ${networkConfig.description}`);
  console.log(`Network Type: ${networkType}`);

  // Parse and validate deployment configuration
  let config = parseDeploymentConfig(networkConfig, networkName, networkType, defaultValidators);

  // For hardhat network, use test accounts if no validators provided
  if (networkName === "hardhat" && config.validators.length === 0) {
    console.log("\nUsing Hardhat test accounts as validators...");
    const [, addr1, addr2, addr3] = await ethers.getSigners();
    config.validators = [addr1.address, addr2.address, addr3.address];
  }

  // Validate validators
  if (config.validators.length === 0) {
    const envVarMap = {
      testnet: "TESTNET_VALIDATORS",
      mainnet: "MAINNET_VALIDATORS",
      local: "LOCAL_VALIDATORS",
    };
    const envVar = envVarMap[networkType];

    throw new Error(
      `No validators configured for ${networkType} networks.\n` +
        `Please set the ${envVar} environment variable with comma-separated addresses.\n` +
        `Example: ${envVar}=0x123...,0x456...,0x789...`,
    );
  }
  validateValidators(config.validators);

  // Verify we're connected to the correct chain
  console.log("\nVerifying chain ID...");
  await verifyChainId(hre, config.chainId);
  console.log("Chain ID verified successfully");

  // Get deployer information
  const [deployer] = await ethers.getSigners();

  // Check if we have the deployer account
  if (!deployer) {
    throw new Error("No deployer account found. Please set the PRIVATE_KEY environment variable.");
  }

  const deployerBalance = await deployer.getBalance();
  console.log(`\nDeployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.utils.formatEther(deployerBalance)} ETH`);

  // Warn for non-local deployments (mainnet and testnet)
  if (networkType !== "local") {
    console.log("\n" + "=".repeat(60));
    console.log(`WARNING: Deploying to ${networkType.toUpperCase()}`);
    console.log("Network:", networkConfig.description);
    console.log("Chain ID:", config.chainId);
    console.log("Validators:", config.validators.length);
    console.log("Validators:", config.validators);
    console.log("Validator Fee:", config.validatorFeeInEth, "ETH/CAM", `(${config.validatorFee} wei)`);
    console.log("=".repeat(60));

    // Prompt for confirmation
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('\nType "yes" to continue with deployment: ', (input) => {
        rl.close();
        resolve(input.trim().toLowerCase());
      });
    });

    if (answer !== "yes") {
      console.log("\nDeployment cancelled.");
      process.exit(0);
    }
    console.log("");
  }

  // Deploy the contract
  const deployment = await deployDvBridge(config);

  // Prepare deployment information
  const deploymentInfo = {
    networkName: config.networkName,
    description: networkConfig.description,
    chainId: config.chainId,
    networkType: config.networkType,
    proxyAddress: deployment.proxyAddress,
    implementationAddress: deployment.implementationAddress,
    proxyTxHash: deployment.proxyTxHash,
    implementationTxHash: deployment.implementationTxHash,
    validatorFee: config.validatorFee,
    validatorFeeInEth: config.validatorFeeInEth,
    validators: config.validators,
    deployer: deployer.address,
  };

  // Save deployment information
  saveDeployment(deploymentInfo, networkName);

  // Print formatted deployment information
  console.log(formatDeploymentData(loadDeployment(networkName)));

  console.log("Next: Don't forget to verify contracts on block explorer!\n");

  return deploymentInfo;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n" + "=".repeat(60));
    console.error("DEPLOYMENT FAILED");
    console.error("=".repeat(60));
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    console.error("=".repeat(60) + "\n");
    process.exit(1);
  });
