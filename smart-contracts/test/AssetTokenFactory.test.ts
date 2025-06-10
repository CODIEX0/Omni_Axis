import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetTokenFactory, AssetToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetTokenFactory", function () {
  let factory: AssetTokenFactory;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

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
    [owner, user1, feeRecipient] = await ethers.getSigners();

    const AssetTokenFactory = await ethers.getContractFactory("AssetTokenFactory");
    factory = await AssetTokenFactory.deploy(feeRecipient.address);
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct fee recipient", async function () {
      expect(await factory.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct creation fee", async function () {
      expect(await factory.creationFee()).to.equal(ethers.parseEther("0.1"));
    });

    it("Should grant correct roles to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await factory.DEFAULT_ADMIN_ROLE();
      const ASSET_CREATOR_ROLE = await factory.ASSET_CREATOR_ROLE();
      
      expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await factory.hasRole(ASSET_CREATOR_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Asset Token Creation", function () {
    it("Should create asset token with correct parameters", async function () {
      const creationFee = await factory.creationFee();
      
      const tx = await factory.createAssetToken(
        "Test Asset Token",
        "TAT",
        ethers.parseEther("10000"),
        sampleMetadata,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === 'AssetTokenCreated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      if (event) {
        const parsedEvent = factory.interface.parseLog(event);
        const tokenAddress = parsedEvent?.args[0];
        
        // Check if token is registered
        const tokenInfo = await factory.tokenRegistry(tokenAddress);
        expect(tokenInfo.creator).to.equal(owner.address);
        expect(tokenInfo.assetType).to.equal(sampleMetadata.assetType);
        expect(tokenInfo.active).to.be.true;
        
        // Check token contract
        const AssetToken = await ethers.getContractFactory("AssetToken");
        const assetToken = AssetToken.attach(tokenAddress) as AssetToken;
        
        expect(await assetToken.name()).to.equal("Test Asset Token");
        expect(await assetToken.symbol()).to.equal("TAT");
        expect(await assetToken.totalSupply()).to.equal(ethers.parseEther("10000"));
      }
    });

    it("Should require sufficient creation fee", async function () {
      const insufficientFee = ethers.parseEther("0.05");
      
      await expect(
        factory.createAssetToken(
          "Test Asset Token",
          "TAT",
          ethers.parseEther("10000"),
          sampleMetadata,
          { value: insufficientFee }
        )
      ).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should not allow non-creator to create tokens", async function () {
      const creationFee = await factory.creationFee();
      
      await expect(
        factory.connect(user1).createAssetToken(
          "Test Asset Token",
          "TAT",
          ethers.parseEther("10000"),
          sampleMetadata,
          { value: creationFee }
        )
      ).to.be.reverted;
    });

    it("Should transfer creation fee to fee recipient", async function () {
      const creationFee = await factory.creationFee();
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);
      
      await factory.createAssetToken(
        "Test Asset Token",
        "TAT",
        ethers.parseEther("10000"),
        sampleMetadata,
        { value: creationFee }
      );
      
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(creationFee);
    });
  });

  describe("Token Management", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const creationFee = await factory.creationFee();
      
      const tx = await factory.createAssetToken(
        "Test Asset Token",
        "TAT",
        ethers.parseEther("10000"),
        sampleMetadata,
        { value: creationFee }
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === 'AssetTokenCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = factory.interface.parseLog(event);
        tokenAddress = parsedEvent?.args[0];
      }
    });

    it("Should update token status", async function () {
      await factory.updateTokenStatus(tokenAddress, false);
      
      const tokenInfo = await factory.tokenRegistry(tokenAddress);
      expect(tokenInfo.active).to.be.false;
    });

    it("Should get all tokens", async function () {
      const allTokens = await factory.getAllTokens();
      expect(allTokens.length).to.equal(1);
      expect(allTokens[0]).to.equal(tokenAddress);
    });

    it("Should get active tokens", async function () {
      const activeTokens = await factory.getActiveTokens();
      expect(activeTokens.length).to.equal(1);
      expect(activeTokens[0]).to.equal(tokenAddress);
      
      // Deactivate token
      await factory.updateTokenStatus(tokenAddress, false);
      
      const activeTokensAfter = await factory.getActiveTokens();
      expect(activeTokensAfter.length).to.equal(0);
    });

    it("Should get tokens by type", async function () {
      const realEstateTokens = await factory.getTokensByType("real-estate");
      expect(realEstateTokens.length).to.equal(1);
      expect(realEstateTokens[0]).to.equal(tokenAddress);
      
      const artTokens = await factory.getTokensByType("art");
      expect(artTokens.length).to.equal(0);
    });

    it("Should get tokens by creator", async function () {
      const ownerTokens = await factory.getTokensByCreator(owner.address);
      expect(ownerTokens.length).to.equal(1);
      expect(ownerTokens[0]).to.equal(tokenAddress);
      
      const user1Tokens = await factory.getTokensByCreator(user1.address);
      expect(user1Tokens.length).to.equal(0);
    });
  });

  describe("Fee Management", function () {
    it("Should update creation fee", async function () {
      const newFee = ethers.parseEther("0.2");
      
      await factory.updateCreationFee(newFee);
      expect(await factory.creationFee()).to.equal(newFee);
    });

    it("Should update fee recipient", async function () {
      await factory.updateFeeRecipient(user1.address);
      expect(await factory.feeRecipient()).to.equal(user1.address);
    });

    it("Should not allow non-fee-manager to update fees", async function () {
      const newFee = ethers.parseEther("0.2");
      
      await expect(
        factory.connect(user1).updateCreationFee(newFee)
      ).to.be.reverted;
    });
  });
});