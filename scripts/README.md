# Deployment Scripts

## Environment Variables

Most of the config options can be set with environment variables. But it's
recommended to set them in `hardhat.config.js` and `networks.js` instead. Except the
`PRIVATE_KEY` of course.

```bash
PRIVATE_KEY=0x...        # This account will be the deployer of the contracts

# Optional: Override RPC URLs
SEPOLIA_RPC_URL=https://...
ETHEREUM_RPC_URL=https://...
BSC_TESTNET_RPC_URL=https://...
BSC_RPC_URL=https://...

# Optional: Override defaults
CHAIN_ID=11155111
VALIDATOR_FEE=5          # In ETH/CAM (e.g., "5" = 5 CAM = 5000000000000000000 wei)

# Validators by network type. It's better to set them in the `networks.js` config file
# but you can also set them via a env variable.
TESTNET_VALIDATORS=0x...,0x...,0x...   # For columbus, sepolia, bscTestnet
MAINNET_VALIDATORS=0x...,0x...,0x...   # For camino, ethereum, bsc
LOCAL_VALIDATORS=0x...,0x...,0x...     # For hardhat (optional, uses test accounts if not set)
```

## Configuration

Network-specific defaults in `config/networks.js` can be overridden via environment variables.

**Validator Configuration:**

- Validators are configured by network type (testnet/mainnet/local), not per-network
- Set validators in `config/networks.js` under `VALIDATOR_CONFIG` or use environment variables

Deployment information is saved to `deployments/{network}.json` with:

- Contract addresses and deployment tx hashes
- Validator configuration
- Deployer and timestamp

## Adding Networks

1. Add to `hardhat.config.js`:

```javascript
myNetwork: {
  url: process.env.MY_NETWORK_RPC_URL || "https://...",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 12345,
}
```

2. Add to `config/networks.js` NETWORK_CONFIG:

```javascript
myNetwork: {
  chainId: 12345,
  networkType: "testnet",  // or "mainnet" or "local"
  validatorFee: "0",
  description: "My Custom Network",
}
```

## Deployment

### Local (Hardhat)

```bash
npx hardhat run scripts/1_deploy_contracts.js --network hardhat
```

Export `PRIVATE_KEY` variable, setting it to the private key of the deployer account (for testnets and mainnets).

### Testnets

```bash
npx hardhat run scripts/1_deploy_contracts.js --network columbus

npx hardhat run scripts/1_deploy_contracts.js --network sepolia

npx hardhat run scripts/1_deploy_contracts.js --network bscTestnet
```

### Mainnets

```bash
npx hardhat run scripts/1_deploy_contracts.js --network camino

npx hardhat run scripts/1_deploy_contracts.js --network ethereum

npx hardhat run scripts/1_deploy_contracts.js --network bsc
```
