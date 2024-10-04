# NFT Marketplace Smart Contract

## Overview

This project implements a decentralized NFT (Non-Fungible Token) marketplace on the Ethereum blockchain. It allows users to mint, list, buy, and sell unique digital assets as NFTs. The smart contract is written in Solidity and uses the ERC721 standard for non-fungible tokens.

# All Tests passed

![alt text](screenshots/image.png)

## Features

- Mint new NFTs with customizable metadata and royalty fees
- List NFTs for sale at a specified price
- Buy listed NFTs
- Cancel listings
- Royalty system for original creators
- Marketplace fee system (2.5% of sale price)
- Role-based access control for minting and administrative functions

## Technologies Used

- Solidity ^0.8.24
- Hardhat
- OpenZeppelin Contracts v5
- Ethers.js v6

## Prerequisites

- Node.js (v14+ recommended)
- npm (usually comes with Node.js)
- An Ethereum wallet (e.g., MetaMask)
- Lisk Sepolia testnet ETH (for deployment and testing)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/DonGuillotine/nft_marketplace_contract.git
   cd nft_marketplace_contract
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your configuration:
   ```
   LISK_SEPOLIA_URL=https://rpc.sepolia-api.lisk.com
   PRIVATE_KEY=your-wallet-private-key
   ETHERSCAN_API_KEY=your-etherscan-api-key
   ```

## Compilation

Compile the smart contracts:

```
npx hardhat compile
```

## Testing

Run the test suite:

```
npx hardhat test
```

## Deployment

Deploy to the Lisk Sepolia testnet:

```
npx hardhat run scripts/deploy.js --network lisk-sepolia
```

Make sure to note the deployed contract address for interaction.

## Interacting with the Contract

Use the `scripts/interact.js` script to interact with the deployed contract:

```
npx hardhat run scripts/interact.js --network lisk-sepolia
```

This script demonstrates minting an NFT, listing it for sale, and retrieving listing details.

You can also interact with the contract directly through Etherscan:
[Verified Contract on Etherscan](https://sepolia-blockscout.lisk.com/address/0xe667B9c840Cad2556F98306D49c14D165Ba7F1D2?tab=contract)

## Contract Functions

- `mintNFT(address recipient, string memory tokenURI, uint96 royaltyFee)`: Mint a new NFT with specified royalty fee
- `listNFT(uint256 tokenId, uint256 price)`: List an NFT for sale
- `buyNFT(uint256 listingId)`: Purchase a listed NFT, automatically distributing royalties and marketplace fees
- `cancelListing(uint256 listingId)`: Cancel an active listing
- `getListingDetails(uint256 listingId)`: Get details of a listing

## Security Considerations

- The contract uses OpenZeppelin's `ReentrancyGuard` to prevent reentrancy attacks
- Access control is implemented using OpenZeppelin's `AccessControl`
- Ensure proper access controls are set up after deployment

## Gas Optimization

- The contract uses OpenZeppelin's upgradeable contracts to minimize gas costs
- Batch minting can be implemented for further gas optimization when minting multiple NFTs

## Future Improvements

- Implement a frontend interface for easier interaction
- Add support for multiple payment tokens
- Implement batch transfers and listings
- Add an auction mechanism for NFTs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
