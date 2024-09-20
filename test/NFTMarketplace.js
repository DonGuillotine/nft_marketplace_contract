const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  let NFTMarketplace, nftMarketplace, owner, addr1, addr2, addr3;
  let listingFee, marketplaceFee;

  beforeEach(async function () {
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.waitForDeployment();

    listingFee = await nftMarketplace.LISTING_FEE();
    marketplaceFee = await nftMarketplace.MARKETPLACE_FEE();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftMarketplace.hasRole(await nftMarketplace.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should grant the MINTER_ROLE to the owner", async function () {
      expect(await nftMarketplace.hasRole(await nftMarketplace.MINTER_ROLE(), owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minting by accounts with MINTER_ROLE", async function () {
      await nftMarketplace.mintNFT(addr1.address, "ipfs://tokenURI", 250);
      expect(await nftMarketplace.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should not allow minting by accounts without MINTER_ROLE", async function () {
        await expect(nftMarketplace.connect(addr1).mintNFT(addr1.address, "ipfs://tokenURI", 250))
          .to.be.revertedWithCustomError(nftMarketplace, "AccessControlUnauthorizedAccount")
          .withArgs(addr1.address, await nftMarketplace.MINTER_ROLE());
      });

    it("Should set correct royalty information", async function () {
      await nftMarketplace.mintNFT(addr1.address, "ipfs://tokenURI", 250);
      const [receiver, royaltyAmount] = await nftMarketplace.royaltyInfo(1, 10000);
      expect(receiver).to.equal(addr1.address);
      expect(royaltyAmount).to.equal(250);
    });
  });

  describe("Listing", function () {
    beforeEach(async function () {
      await nftMarketplace.mintNFT(addr1.address, "ipfs://tokenURI", 250);
    });

    it("Should allow listing by the NFT owner", async function () {
      await nftMarketplace.connect(addr1).listNFT(1, ethers.parseEther("1"), { value: listingFee });
      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.seller).to.equal(addr1.address);
      expect(listing.price).to.equal(ethers.parseEther("1"));
      expect(listing.active).to.be.true;
    });

    it("Should not allow listing by non-owners", async function () {
      await expect(nftMarketplace.connect(addr2).listNFT(1, ethers.parseEther("1"), { value: listingFee }))
        .to.be.revertedWith("You must own the NFT to list it");
    });

    it("Should require the correct listing fee", async function () {
      await expect(nftMarketplace.connect(addr1).listNFT(1, ethers.parseEther("1"), { value: 0 }))
        .to.be.revertedWith("Listing fee required");
    });

    it("Should not allow listing with zero price", async function () {
      await expect(nftMarketplace.connect(addr1).listNFT(1, 0, { value: listingFee }))
        .to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("Buying", function () {
    beforeEach(async function () {
      await nftMarketplace.mintNFT(addr1.address, "ipfs://tokenURI", 250);
      await nftMarketplace.connect(addr1).listNFT(1, ethers.parseEther("1"), { value: listingFee });
    });

    it("Should allow buying a listed NFT", async function () {
      await nftMarketplace.connect(addr2).buyNFT(1, { value: ethers.parseEther("1") });
      expect(await nftMarketplace.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should not allow buying an unlisted NFT", async function () {
      await nftMarketplace.connect(addr1).cancelListing(1);
      await expect(nftMarketplace.connect(addr2).buyNFT(1, { value: ethers.parseEther("1") }))
        .to.be.revertedWith("Listing is not active");
    });

    it("Should require the correct price", async function () {
      await expect(nftMarketplace.connect(addr2).buyNFT(1, { value: ethers.parseEther("0.5") }))
        .to.be.revertedWith("Incorrect price");
    });
  });

  describe("Cancelling Listing", function () {
    beforeEach(async function () {
      await nftMarketplace.mintNFT(addr1.address, "ipfs://tokenURI", 250);
      await nftMarketplace.connect(addr1).listNFT(1, ethers.parseEther("1"), { value: listingFee });
    });

    it("Should allow the seller to cancel the listing", async function () {
      await nftMarketplace.connect(addr1).cancelListing(1);
      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.active).to.be.false;
    });

    it("Should not allow non-sellers to cancel the listing", async function () {
      await expect(nftMarketplace.connect(addr2).cancelListing(1))
        .to.be.revertedWith("Only the seller can cancel the listing");
    });

    it("Should not allow cancelling an inactive listing", async function () {
      await nftMarketplace.connect(addr1).cancelListing(1);
      await expect(nftMarketplace.connect(addr1).cancelListing(1))
        .to.be.revertedWith("Listing is not active");
    });
  });

  describe("Access Control", function () {
    it("Should allow the admin to grant MINTER_ROLE", async function () {
      await nftMarketplace.grantRole(await nftMarketplace.MINTER_ROLE(), addr1.address);
      expect(await nftMarketplace.hasRole(await nftMarketplace.MINTER_ROLE(), addr1.address)).to.be.true;
    });

    it("Should not allow non-admins to grant MINTER_ROLE", async function () {
      await expect(nftMarketplace.connect(addr1).grantRole(await nftMarketplace.MINTER_ROLE(), addr2.address))
        .to.be.reverted;
    });
  });

  describe("Marketplace Wallet", function () {
    it("Should allow the admin to set a new marketplace wallet", async function () {
      await nftMarketplace.setMarketplaceWallet(addr3.address);
      expect(await nftMarketplace.marketplaceWallet()).to.equal(addr3.address);
    });

    it("Should not allow non-admins to set a new marketplace wallet", async function () {
      await expect(nftMarketplace.connect(addr1).setMarketplaceWallet(addr3.address))
        .to.be.reverted;
    });
  });
});