import { ethers, upgrades } from "hardhat";
import { AssetToken, AssetTokenFactory, Marketplace, ChainlinkPriceOracle } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AssetToken implementation (for factory)
  console.log("\n1. Deploying AssetToken implementation...");
  const AssetToken = await ethers.getContractFactory("AssetToken");
  const assetTokenImpl = await AssetToken.deploy();
  await assetTokenImpl.waitForDeployment();
  console.log("AssetToken implementation deployed to:", await assetTokenImpl.getAddress());

  // Deploy AssetTokenFactory
  console.log("\n2. Deploying AssetTokenFactory...");
  const AssetTokenFactory = await ethers.getContractFactory("AssetTokenFactory");
  const feeRecipient = deployer.address; // Use deployer as fee recipient for now
  const assetTokenFactory = await AssetTokenFactory.deploy(feeRecipient);
  await assetTokenFactory.waitForDeployment();
  console.log("AssetTokenFactory deployed to:", await assetTokenFactory.getAddress());

  // Deploy Marketplace
  console.log("\n3. Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(feeRecipient);
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  // Deploy ChainlinkPriceOracle
  console.log("\n4. Deploying ChainlinkPriceOracle...");
  const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
  const priceOracle = await ChainlinkPriceOracle.deploy();
  await priceOracle.waitForDeployment();
  console.log("ChainlinkPriceOracle deployed to:", await priceOracle.getAddress());

  // Setup roles and permissions
  console.log("\n5. Setting up roles and permissions...");
  
  // Grant ASSET_CREATOR_ROLE to deployer in factory
  const ASSET_CREATOR_ROLE = await assetTokenFactory.ASSET_CREATOR_ROLE();
  await assetTokenFactory.grantRole(ASSET_CREATOR_ROLE, deployer.address);
  console.log("Granted ASSET_CREATOR_ROLE to deployer");

  // Grant OPERATOR_ROLE to deployer in marketplace
  const OPERATOR_ROLE = await marketplace.OPERATOR_ROLE();
  await marketplace.grantRole(OPERATOR_ROLE, deployer.address);
  console.log("Granted OPERATOR_ROLE to deployer");

  // Grant ORACLE_MANAGER_ROLE to deployer in price oracle
  const ORACLE_MANAGER_ROLE = await priceOracle.ORACLE_MANAGER_ROLE();
  await priceOracle.grantRole(ORACLE_MANAGER_ROLE, deployer.address);
  console.log("Granted ORACLE_MANAGER_ROLE to deployer");

  // Create a sample asset token for testing
  console.log("\n6. Creating sample asset token...");
  
  const sampleAssetMetadata = {
    name: "Manhattan Office Building",
    description: "Prime commercial real estate in Manhattan financial district",
    assetType: "real-estate",
    location: "New York, NY",
    totalValue: ethers.parseEther("2500000"), // $2.5M
    ipfsHash: "QmSampleHashForTesting123456789",
    createdAt: 0, // Will be set by contract
    verified: false
  };

  const creationFee = await assetTokenFactory.creationFee();
  const tx = await assetTokenFactory.createAssetToken(
    "Manhattan Office Token",
    "MOT",
    ethers.parseEther("20000"), // 20,000 tokens
    sampleAssetMetadata,
    { value: creationFee }
  );
  
  const receipt = await tx.wait();
  const event = receipt?.logs.find(log => {
    try {
      return assetTokenFactory.interface.parseLog(log)?.name === 'AssetTokenCreated';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsedEvent = assetTokenFactory.interface.parseLog(event);
    const sampleTokenAddress = parsedEvent?.args[0];
    console.log("Sample asset token created at:", sampleTokenAddress);
  }

  // Summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("AssetToken Implementation:", await assetTokenImpl.getAddress());
  console.log("AssetTokenFactory:", await assetTokenFactory.getAddress());
  console.log("Marketplace:", await marketplace.getAddress());
  console.log("ChainlinkPriceOracle:", await priceOracle.getAddress());
  console.log("Fee Recipient:", feeRecipient);

  // Save deployment addresses to file
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      AssetTokenImplementation: await assetTokenImpl.getAddress(),
      AssetTokenFactory: await assetTokenFactory.getAddress(),
      Marketplace: await marketplace.getAddress(),
      ChainlinkPriceOracle: await priceOracle.getAddress(),
    },
    feeRecipient,
    deploymentTime: new Date().toISOString(),
  };

  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nDeployment info saved to:", deploymentFile);
  console.log("\n=== DEPLOYMENT COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });