const { ethers, upgrades } = require("hardhat");

async function main() {
  const chainId = process.env.CHAIN_ID || "123";
  const validatorFee = process.env.VALIDATOR_FEE || "0";
  const validators = process.env.VALIDATORS ? process.env.VALIDATORS.split(',') : [];

  const network = hre.network.name;
  
  if (network === 'hardhat') {
    let devValidators = validators;
    if (validators.length === 0) {
      // Use hardhat default accounts for development
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      devValidators = [addr1.address, addr2.address, addr3.address];
    }
    
    const DvBridge = await ethers.getContractFactory("DvBridge");
    const proxy = await upgrades.deployProxy(DvBridge, [
      parseInt(chainId),
      parseInt(validatorFee),
      devValidators
    ], { initializer: 'initialize',
      kind: 'uups'
    });

    await proxy.deployed();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxy.address);

    console.log('\n=== DvBridge Deployment (Development) ===');
    console.log('Proxy Address:', proxy.address);
    console.log('Implementation Address:', implementationAddress);
    console.log('Chain ID:', chainId);
    console.log('Validator Fee:', validatorFee);
    console.log('Validators:', devValidators);
    console.log('=========================================\n');
  } else {
    // Production deployment
    if (validators.length === 0) {
      throw new Error('VALIDATORS environment variable must be set for production deployment');
    }
    
    const DvBridge = await ethers.getContractFactory("DvBridge");
    const proxy = await upgrades.deployProxy(DvBridge, [
      parseInt(chainId),
      parseInt(validatorFee),
      validators
    ], { initializer: 'initialize',
      kind: 'uups'
    });

    await proxy.deployed();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxy.address);

    console.log('\n=== DvBridge Deployment (Production) ===');
    console.log('Proxy Address:', proxy.address);
    console.log('Implementation Address:', implementationAddress);
    console.log('Chain ID:', chainId);
    console.log('Validator Fee:', validatorFee);
    console.log('Validators:', validators);
    console.log('Network:', network);
    console.log('========================================\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
