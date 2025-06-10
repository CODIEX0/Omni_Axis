import { expect } from "chai";
import { ethers } from "hardhat";
import { Marketplace, AssetToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace", function () {
  let marketplace: Marketplace;
  let assetToken: AssetToken;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
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
    [owner, buyer, seller, feeRecipient] = await ethers.getSigners();

    // Deploy AssetToken
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

    // Transfer tokens to seller
    await assetToken.transfer(seller.address, ethers.parseEther("1000"));

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(feeRecipient.address);
    await marketplace.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct fee recipient", async function () {
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct trading fee", async function () {
      expect(await marketplace.tradingFee()).to.equal(250); // 2.5%
    });
  });

  describe("Buy Orders", function () {
    it("Should place a limit buy order", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("1");
      const totalCost = amount * price;

      const tx = await marketplace.connect(buyer).placeBuyOrder(
        await assetToken.getAddress(),
        amount,
        price,
        0, // LIMIT order
        0, // No expiry
        { value: totalCost }
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return marketplace.interface.parseLog(log)?.name === 'OrderPlaced';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      if (event) {
        const parsedEvent = marketplace.interface.parseLog(event);
        const orderId = parsedEvent?.args[0];
        
        const order = await marketplace.orders(orderId);
        expect(order.trader).to.equal(buyer.address);
        expect(order.amount).to.equal(amount);
        expect(order.price).to.equal(price);
        expect(order.side).to.equal(0); // BUY
        expect(order.orderType).to.equal(1); // LIMIT
      }
    });

    it("Should require sufficient ETH for buy orders", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("1");
      const insufficientValue = ethers.parseEther("50");

      await expect(
        marketplace.connect(buyer).placeBuyOrder(
          await assetToken.getAddress(),
          amount,
          price,
          0, // LIMIT order
          0, // No expiry
          { value: insufficientValue }
        )
      ).to.be.revertedWith("Insufficient ETH sent");
    });
  });

  describe("Sell Orders", function () {
    beforeEach(async function () {
      // Approve marketplace to spend seller's tokens
      await assetToken.connect(seller).approve(
        await marketplace.getAddress(),
        ethers.parseEther("1000")
      );
    });

    it("Should place a limit sell order", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("1");

      const tx = await marketplace.connect(seller).placeSellOrder(
        await assetToken.getAddress(),
        amount,
        price,
        0, // LIMIT order
        0  // No expiry
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return marketplace.interface.parseLog(log)?.name === 'OrderPlaced';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      if (event) {
        const parsedEvent = marketplace.interface.parseLog(event);
        const orderId = parsedEvent?.args[0];
        
        const order = await marketplace.orders(orderId);
        expect(order.trader).to.equal(seller.address);
        expect(order.amount).to.equal(amount);
        expect(order.price).to.equal(price);
        expect(order.side).to.equal(1); // SELL
        expect(order.orderType).to.equal(1); // LIMIT
      }

      // Check that tokens were transferred to marketplace
      expect(await assetToken.balanceOf(await marketplace.getAddress())).to.equal(amount);
    });

    it("Should require token approval for sell orders", async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("1");

      // Remove approval
      await assetToken.connect(seller).approve(await marketplace.getAddress(), 0);

      await expect(
        marketplace.connect(seller).placeSellOrder(
          await assetToken.getAddress(),
          amount,
          price,
          0, // LIMIT order
          0  // No expiry
        )
      ).to.be.reverted;
    });
  });

  describe("Order Matching", function () {
    beforeEach(async function () {
      // Approve marketplace to spend seller's tokens
      await assetToken.connect(seller).approve(
        await marketplace.getAddress(),
        ethers.parseEther("1000")
      );
    });

    it("Should match compatible buy and sell orders", async function () {
      const amount = ethers.parseEther("100");
      const sellPrice = ethers.parseEther("1");
      const buyPrice = ethers.parseEther("1.1"); // Higher than sell price

      // Place sell order first
      await marketplace.connect(seller).placeSellOrder(
        await assetToken.getAddress(),
        amount,
        sellPrice,
        0, // LIMIT order
        0  // No expiry
      );

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(feeRecipient.address);

      // Place buy order that should match
      const totalCost = amount * buyPrice;
      const tx = await marketplace.connect(buyer).placeBuyOrder(
        await assetToken.getAddress(),
        amount,
        buyPrice,
        0, // LIMIT order
        0, // No expiry
        { value: totalCost }
      );

      // Check that trade was executed
      const buyerTokenBalance = await assetToken.balanceOf(buyer.address);
      expect(buyerTokenBalance).to.equal(amount);

      // Check that seller received payment (minus fees)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const tradingFee = await marketplace.tradingFee();
      const totalValue = amount * sellPrice;
      const fee = (totalValue * tradingFee) / 10000n;
      const expectedSellerReceives = totalValue - fee;
      
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedSellerReceives);

      // Check that fee recipient received fee
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(feeRecipient.address);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(fee);
    });

    it("Should not match incompatible orders", async function () {
      const amount = ethers.parseEther("100");
      const sellPrice = ethers.parseEther("1.5");
      const buyPrice = ethers.parseEther("1"); // Lower than sell price

      // Place sell order
      await marketplace.connect(seller).placeSellOrder(
        await assetToken.getAddress(),
        amount,
        sellPrice,
        0, // LIMIT order
        0  // No expiry
      );

      // Place buy order that should not match
      const totalCost = amount * buyPrice;
      await marketplace.connect(buyer).placeBuyOrder(
        await assetToken.getAddress(),
        amount,
        buyPrice,
        0, // LIMIT order
        0, // No expiry
        { value: totalCost }
      );

      // Check that no trade was executed
      const buyerTokenBalance = await assetToken.balanceOf(buyer.address);
      expect(buyerTokenBalance).to.equal(0);
    });
  });

  describe("Order Cancellation", function () {
    let orderId: bigint;

    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      const price = ethers.parseEther("1");
      const totalCost = amount * price;

      const tx = await marketplace.connect(buyer).placeBuyOrder(
        await assetToken.getAddress(),
        amount,
        price,
        0, // LIMIT order
        0, // No expiry
        { value: totalCost }
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return marketplace.interface.parseLog(log)?.name === 'OrderPlaced';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = marketplace.interface.parseLog(event);
        orderId = parsedEvent?.args[0];
      }
    });

    it("Should allow order owner to cancel order", async function () {
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).cancelOrder(orderId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should get refund minus gas costs
      const refundAmount = ethers.parseEther("100"); // 100 tokens * 1 ETH per token
      const expectedBalance = buyerBalanceBefore + refundAmount - gasUsed;
      expect(buyerBalanceAfter).to.equal(expectedBalance);

      // Order should be cancelled
      const order = await marketplace.orders(orderId);
      expect(order.status).to.equal(2); // CANCELLED
    });

    it("Should not allow non-owner to cancel order", async function () {
      await expect(
        marketplace.connect(seller).cancelOrder(orderId)
      ).to.be.revertedWith("Not order owner");
    });
  });

  describe("Fee Management", function () {
    it("Should update trading fee", async function () {
      const newFee = 500; // 5%
      
      await marketplace.updateTradingFee(newFee);
      expect(await marketplace.tradingFee()).to.equal(newFee);
    });

    it("Should not allow fee above 10%", async function () {
      const invalidFee = 1500; // 15%
      
      await expect(
        marketplace.updateTradingFee(invalidFee)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should update fee recipient", async function () {
      await marketplace.updateFeeRecipient(buyer.address);
      expect(await marketplace.feeRecipient()).to.equal(buyer.address);
    });
  });
});