import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetToken", function () {
  let assetToken: AssetToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const sampleMetadata = {
    name: "Test Real Estate",
    description: "A test property for tokenization",
    assetType: "real-estate",
    location: "Test City",
    totalValue: ethers.parseEther("1000000"),
    ipfsHash: "QmTestHash123",
    createdAt: 0,
    verified: false
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AssetToken = await ethers.getContractFactory("AssetToken");
    assetToken = await AssetToken.deploy();
    await assetToken.waitForDeployment();

    await assetToken.initialize(
      "Test Asset Token",
      "TAT",
      ethers.parseEther("10000"),
      owner.address,
      sampleMetadata
    );
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await assetToken.name()).to.equal("Test Asset Token");
      expect(await assetToken.symbol()).to.equal("TAT");
      expect(await assetToken.totalSupply()).to.equal(ethers.parseEther("10000"));
      expect(await assetToken.balanceOf(owner.address)).to.equal(ethers.parseEther("10000"));
    });

    it("Should set asset metadata correctly", async function () {
      const metadata = await assetToken.getAssetMetadata();
      expect(metadata.name).to.equal(sampleMetadata.name);
      expect(metadata.description).to.equal(sampleMetadata.description);
      expect(metadata.assetType).to.equal(sampleMetadata.assetType);
      expect(metadata.location).to.equal(sampleMetadata.location);
      expect(metadata.totalValue).to.equal(sampleMetadata.totalValue);
      expect(metadata.verified).to.equal(false);
    });

    it("Should grant correct roles to owner", async function () {
      const DEFAULT_ADMIN_ROLE = await assetToken.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await assetToken.MINTER_ROLE();
      const PAUSER_ROLE = await assetToken.PAUSER_ROLE();
      const ASSET_MANAGER_ROLE = await assetToken.ASSET_MANAGER_ROLE();

      expect(await assetToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await assetToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await assetToken.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await assetToken.hasRole(ASSET_MANAGER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await assetToken.mint(user1.address, mintAmount);
      
      expect(await assetToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await assetToken.totalSupply()).to.equal(ethers.parseEther("11000"));
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        assetToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.reverted;
    });
  });

  describe("Pausing", function () {
    it("Should allow pauser to pause and unpause", async function () {
      await assetToken.pause();
      expect(await assetToken.paused()).to.be.true;

      await assetToken.unpause();
      expect(await assetToken.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await assetToken.transfer(user1.address, ethers.parseEther("100"));
      
      await assetToken.pause();
      
      await expect(
        assetToken.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Asset Management", function () {
    it("Should allow asset manager to update metadata", async function () {
      const newIpfsHash = "QmNewHash456";
      await assetToken.updateAssetMetadata(newIpfsHash);
      
      const metadata = await assetToken.getAssetMetadata();
      expect(metadata.ipfsHash).to.equal(newIpfsHash);
    });

    it("Should allow asset manager to verify asset", async function () {
      await assetToken.verifyAsset(true);
      
      const metadata = await assetToken.getAssetMetadata();
      expect(metadata.verified).to.be.true;
    });

    it("Should not allow non-asset-manager to update metadata", async function () {
      await expect(
        assetToken.connect(user1).updateAssetMetadata("QmNewHash")
      ).to.be.reverted;
    });
  });

  describe("Dividend Distribution", function () {
    beforeEach(async function () {
      // Transfer some tokens to users for testing
      await assetToken.transfer(user1.address, ethers.parseEther("1000"));
      await assetToken.transfer(user2.address, ethers.parseEther("2000"));
    });

    it("Should distribute dividends correctly", async function () {
      const dividendAmount = ethers.parseEther("1");
      
      await assetToken.distributeDividend(dividendAmount, { value: dividendAmount });
      
      const dividendInfo = await assetToken.getDividendInfo();
      expect(dividendInfo.totalDividends).to.equal(dividendAmount);
    });

    it("Should calculate pending dividends correctly", async function () {
      const dividendAmount = ethers.parseEther("1");
      
      await assetToken.distributeDividend(dividendAmount, { value: dividendAmount });
      
      // user1 has 1000 tokens out of 10000 total, so should get 0.1 ETH
      const user1Pending = await assetToken.pendingDividends(user1.address);
      expect(user1Pending).to.equal(ethers.parseEther("0.1"));
      
      // user2 has 2000 tokens out of 10000 total, so should get 0.2 ETH
      const user2Pending = await assetToken.pendingDividends(user2.address);
      expect(user2Pending).to.equal(ethers.parseEther("0.2"));
    });

    it("Should allow users to claim dividends", async function () {
      const dividendAmount = ethers.parseEther("1");
      
      await assetToken.distributeDividend(dividendAmount, { value: dividendAmount });
      
      const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
      const tx = await assetToken.connect(user1).claimDividends();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
      
      // User1 should receive 0.1 ETH minus gas costs
      const expectedReceived = ethers.parseEther("0.1");
      const actualReceived = user1BalanceAfter - user1BalanceBefore + gasUsed;
      expect(actualReceived).to.equal(expectedReceived);
    });

    it("Should update pending dividends on token transfer", async function () {
      const dividendAmount = ethers.parseEther("1");
      
      await assetToken.distributeDividend(dividendAmount, { value: dividendAmount });
      
      // Transfer tokens from user1 to user2
      await assetToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      
      // Distribute another dividend
      await assetToken.distributeDividend(dividendAmount, { value: dividendAmount });
      
      // user1 now has 500 tokens, should get 0.1 ETH from first dividend + 0.05 ETH from second
      const user1Pending = await assetToken.pendingDividends(user1.address);
      expect(user1Pending).to.equal(ethers.parseEther("0.15"));
      
      // user2 now has 2500 tokens, should get 0.2 ETH from first dividend + 0.25 ETH from second
      const user2Pending = await assetToken.pendingDividends(user2.address);
      expect(user2Pending).to.equal(ethers.parseEther("0.45"));
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-admin to grant roles", async function () {
      const MINTER_ROLE = await assetToken.MINTER_ROLE();
      
      await expect(
        assetToken.connect(user1).grantRole(MINTER_ROLE, user2.address)
      ).to.be.reverted;
    });

    it("Should allow admin to grant and revoke roles", async function () {
      const MINTER_ROLE = await assetToken.MINTER_ROLE();
      
      await assetToken.grantRole(MINTER_ROLE, user1.address);
      expect(await assetToken.hasRole(MINTER_ROLE, user1.address)).to.be.true;
      
      await assetToken.revokeRole(MINTER_ROLE, user1.address);
      expect(await assetToken.hasRole(MINTER_ROLE, user1.address)).to.be.false;
    });
  });
});