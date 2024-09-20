const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const contractAddress = "0xFaA06EeBcae68B9DEa91Ed746F873D0F1CCEA230";

  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = NFTMarketplace.attach(contractAddress);

  console.log("Interacting with NFTMarketplace at:", contractAddress);

  const tx1 = await nftMarketplace.mintNFT(deployer.address, "ipfs://QmaFcBAs3uhp62P3mKTY3cNLaZKvZh7ucNfeJCRdQi914d", 250);
  console.log("Waiting for transaction to be mined...");
  const receipt1 = await tx1.wait();
  console.log("Transaction Receipt:", JSON.stringify(receipt1, null, 2));

  console.log("Transaction mined. Receipt:", JSON.stringify(receipt1, null, 2));

  if (receipt1.events) {
    const mintedEvent = receipt1.events.find(event => event.event === 'NFTMinted');
    if (mintedEvent) {
      const tokenId = mintedEvent.args.tokenId.toString();
      console.log("Minted NFT with ID:", tokenId);
    } else {
      console.log("NFTMinted event not found in the receipt");
    }
  } else if (receipt1.logs) {
    console.log("Manually decoding logs...");

    const nftMarketplaceInterface = new ethers.Interface([
      "event NFTMinted(uint256 tokenId, address owner, string tokenURI, uint96 royaltyFee)"
    ]);

    receipt1.logs.forEach(log => {
      try {
        const parsedLog = nftMarketplaceInterface.parseLog(log);
        if (parsedLog.name === 'NFTMinted') {
          const tokenId = parsedLog.args.tokenId.toString();
          console.log("Minted NFT with ID:", tokenId);
        }
      } catch (error) {
        
      }
    });
  } else {
    console.log("No events or logs found in the transaction receipt.");
  }

  const listingPrice = ethers.parseEther("0.01");
  const tx2 = await nftMarketplace.listNFT(1, ethers.parseEther("1"), { value: listingPrice });
  await tx2.wait();
  console.log("Listed NFT Successfully");

  const listing = await nftMarketplace.getListingDetails(1);
  console.log("Listing details:", listing);

  // Buy the NFT (NOTE: do this from a different account)
//   const tx3 = await nftMarketplace.buyNFT(1, { value: ethers.parseEther("1") });
//   await tx3.wait();
//   console.log("Bought NFT with ID: 1");

  const newOwner = await nftMarketplace.ownerOf(1);
  console.log("New owner of NFT:", newOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });