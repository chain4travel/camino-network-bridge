# Deployments

Deployment artifacts for DvBridge contracts across networks. These are recommended
to be committed into Git when deployments are made.

## Files

- `hardhat.json` - Local Hardhat network
- `columbus.json` - Camino Columbus Testnet
- `camino.json` - Camino Mainnet
- `sepolia.json` - Ethereum Sepolia Testnet
- `ethereum.json` - Ethereum Mainnet
- `bscTestnet.json` - BNB Smart Chain Testnet
- `bsc.json` - BNB Smart Chain Mainnet

## Schema

```json
{
  "networkName": "sepolia",
  "description": "Ethereum Sepolia Testnet",
  "chainId": 11155111,
  "networkType": "testnet",
  "proxyAddress": "0x...",
  "implementationAddress": "0x...",
  "proxyTxHash": "0x...",
  "implementationTxHash": "0x...",
  "validatorFee": "5000000000000000000",
  "validatorFeeInEth": "5",
  "validators": ["0x...", "0x..."],
  "deployer": "0x...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Usage

```javascript
const { loadDeployment } = require("../scripts/utils/deployment");
const deployment = loadDeployment("sepolia");
```

## Git Tracking

By default, deployment files are tracked into Git except for the hardhat network.
Edit `.gitignore` file in `deployments` folder to change that.
