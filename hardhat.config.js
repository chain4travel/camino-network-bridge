require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    columbus: {
      url: process.env.TESTNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.CHAIN_ID) || 1,
    },
    camino: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.CHAIN_ID) || 1,
    },
  },
  etherscan: {
    apiKey: {
      columbus: "abc",
      camino: "abc",
    },
    customChains: [
      {
        network: "columbus",
        chainId: 501,
        urls: {
          apiURL: "https://columbus.caminoscan.com/api",
          browserURL: "https://columbus.caminoscan.com",
        },
      },
      {
        network: "camino",
        chainId: 500,
        urls: {
          apiURL: "https://caminoscan.com/api",
          browserURL: "https://caminoscan.com",
        },
      },
    ],
  },
};
