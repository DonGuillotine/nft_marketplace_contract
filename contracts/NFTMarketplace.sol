// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ERC721URIStorage, ERC2981, AccessControl, ReentrancyGuard {
    uint256 private _tokenIds;
    uint256 private _listingIds;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant LISTING_FEE = 0.01 ether;
    uint256 public constant MARKETPLACE_FEE = 250;

    address public marketplaceWallet;

    struct Listing {
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => address) public tokenCreators;

    event NFTMinted(uint256 tokenId, address owner, string tokenURI, uint96 royaltyFee);
    event NFTListed(uint256 listingId, uint256 tokenId, uint256 price, address seller);
    event NFTSold(uint256 listingId, uint256 tokenId, uint256 price, address seller, address buyer);
    event ListingCancelled(uint256 listingId);
    event RoyaltyPaid(uint256 tokenId, address creator, uint256 royaltyAmount);
    event MarketplaceFeePaid(uint256 amount);

    constructor() ERC721("NFTMarketplace", "NFTM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        marketplaceWallet = msg.sender; 
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, ERC2981, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mintNFT(address recipient, string memory tokenURI, uint96 royaltyFee) public onlyRole(MINTER_ROLE) returns (uint256) {
        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;

        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _setTokenRoyalty(newTokenId, recipient, royaltyFee);
        tokenCreators[newTokenId] = recipient;

        emit NFTMinted(newTokenId, recipient, tokenURI, royaltyFee);

        return newTokenId;
    }

    function listNFT(uint256 tokenId, uint256 price) public payable {
        require(ownerOf(tokenId) == msg.sender, "You must own the NFT to list it");
        require(msg.value == LISTING_FEE, "Listing fee required");
        require(price > 0, "Price must be greater than zero");

        _listingIds += 1;
        uint256 listingId = _listingIds;

        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            active: true
        });

        emit NFTListed(listingId, tokenId, price, msg.sender);
    }

    function buyNFT(uint256 listingId) public payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.value == listing.price, "Incorrect price");

        listing.active = false;

        uint256 royaltyAmount = 0;
        address creator = tokenCreators[listing.tokenId];
        if (creator != address(0)) {
            (address receiver, uint256 royaltyFee) = royaltyInfo(listing.tokenId, listing.price);
            royaltyAmount = royaltyFee;
            payable(receiver).transfer(royaltyAmount);
            emit RoyaltyPaid(listing.tokenId, receiver, royaltyAmount);
        }

        uint256 marketplaceFee = (listing.price * MARKETPLACE_FEE) / 10000;
        payable(marketplaceWallet).transfer(marketplaceFee);
        emit MarketplaceFeePaid(marketplaceFee);

        uint256 sellerProceeds = listing.price - royaltyAmount - marketplaceFee;
        listing.seller.transfer(sellerProceeds);

        _transfer(listing.seller, msg.sender, listing.tokenId);

        emit NFTSold(listingId, listing.tokenId, listing.price, listing.seller, msg.sender);
    }

    function cancelListing(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Only the seller can cancel the listing");
        require(listing.active, "Listing is not active");

        listing.active = false;

        emit ListingCancelled(listingId);
    }

    function setMarketplaceWallet(address newWallet) public onlyRole(DEFAULT_ADMIN_ROLE) {
        marketplaceWallet = newWallet;
    }

    function getListingDetails(uint256 listingId) public view returns (Listing memory) {
        return listings[listingId];
    }

    function withdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}