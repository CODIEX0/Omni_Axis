import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting simple enhanced deployment...");
  
  const [deployer, issuer, investor] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy the contracts we know work
  const deployedContracts: any = {};

  // 1. Deploy DecentralizedKYC
  console.log("\n1️⃣ Deploying DecentralizedKYC...");
  const DecentralizedKYC = await ethers.getContractFactory("DecentralizedKYC");
  const kycContract = await DecentralizedKYC.deploy("DecentralizedKYC", "1.0");
  await kycContract.waitForDeployment();
  const kycAddress = await kycContract.getAddress();
  deployedContracts.DecentralizedKYC = kycAddress;
  console.log("✅ DecentralizedKYC deployed to:", kycAddress);

  // 2. Deploy ChainlinkPriceOracle
  console.log("\n2️⃣ Deploying ChainlinkPriceOracle...");
  const ChainlinkPriceOracle = await ethers.getContractFactory("ChainlinkPriceOracle");
  const priceOracleContract = await ChainlinkPriceOracle.deploy();
  await priceOracleContract.waitForDeployment();
  const priceOracleAddress = await priceOracleContract.getAddress();
  deployedContracts.ChainlinkPriceOracle = priceOracleAddress;
  console.log("✅ ChainlinkPriceOracle deployed to:", priceOracleAddress);

  // 3. Deploy YieldDistribution
  console.log("\n3️⃣ Deploying YieldDistribution...");
  const YieldDistribution = await ethers.getContractFactory("YieldDistribution");
  const yieldContract = await YieldDistribution.deploy();
  await yieldContract.waitForDeployment();
  const yieldAddress = await yieldContract.getAddress();
  deployedContracts.YieldDistribution = yieldAddress;
  console.log("✅ YieldDistribution deployed to:", yieldAddress);

  // 4. Deploy AssetTokenFactory
  console.log("\n4️⃣ Deploying AssetTokenFactory...");
  const AssetTokenFactory = await ethers.getContractFactory("AssetTokenFactory");
  const factoryContract = await AssetTokenFactory.deploy(kycAddress, deployer.address);
  await factoryContract.waitForDeployment();
  const factoryAddress = await factoryContract.getAddress();
  deployedContracts.AssetTokenFactory = factoryAddress;
  console.log("✅ AssetTokenFactory deployed to:", factoryAddress);

  // 5. Deploy AssetMarketplace (original)
  console.log("\n5️⃣ Deploying AssetMarketplace...");
  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");
  const marketplaceContract = await AssetMarketplace.deploy(deployer.address, deployer.address);
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  deployedContracts.AssetMarketplace = marketplaceAddress;
  console.log("✅ AssetMarketplace deployed to:", marketplaceAddress);

  // 6. Deploy sample AssetToken
  console.log("\n6️⃣ Deploying sample AssetToken...");
  const AssetToken = await ethers.getContractFactory("contracts/AssetToken.sol:AssetToken");
  const assetTokenContract = await AssetToken.deploy(
    "Premium Real Estate Token",
    "PRET",
    issuer.address,
    kycAddress,
    deployer.address
  );
  await assetTokenContract.waitForDeployment();
  const assetTokenAddress = await assetTokenContract.getAddress();
  deployedContracts.AssetToken = assetTokenAddress;
  console.log("✅ AssetToken deployed to:", assetTokenAddress);

  // Set up KYC
  console.log("\n7️⃣ Setting up KYC verifications...");
  const accounts = [
    { address: deployer.address, name: "Admin" },
    { address: issuer.address, name: "Issuer" },
    { address: investor.address, name: "Investor" }
  ];

  for (const account of accounts) {
    await kycContract.connect(deployer).adminSetKYC(
      account.address,
      2, // KYCLevel.ENHANCED
      1, // AMLRisk.LOW
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      "US",
      `QmSample${account.name}Hash`
    );
    console.log(`✅ KYC verified: ${account.name}`);
  }

  // Set up KYC in AssetToken
  console.log("\n8️⃣ Setting up KYC in AssetToken...");
  for (const account of accounts) {
    await assetTokenContract.connect(deployer).setKYCStatus(
      account.address,
      true,
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
    );
  }
  console.log("✅ KYC status set in AssetToken");

  // Create test yield distribution
  console.log("\n9️⃣ Creating test yield distribution...");
  const distributionAmount = ethers.parseEther("5"); // 5 ETH
  await yieldContract.connect(deployer).createDistribution(
    assetTokenAddress,
    distributionAmount,
    "Q1 2025 Rental Income",
    0,
    { value: distributionAmount }
  );
  console.log("✅ Test yield distribution created");

  // Save deployment info
  const deploymentInfo = {
    network: "ganache",
    chainId: 1337,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: deployedContracts,
    testAccounts: {
      deployer: deployer.address,
      issuer: issuer.address,
      investor: investor.address
    }
  };

  const deploymentPath = path.join(__dirname, "../final-deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  // Update .env
  const envPath = path.join(__dirname, "../../.env");
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  const updates = [
    ['EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS', marketplaceAddress],
    ['EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS', assetTokenAddress],
    ['EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS', kycAddress],
    ['EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS', factoryAddress],
    ['EXPO_PUBLIC_CHAINLINK_PRICE_ORACLE_ADDRESS', priceOracleAddress],
    ['EXPO_PUBLIC_YIELD_DISTRIBUTION_ADDRESS', yieldAddress]
  ];

  for (const [key, value] of updates) {
    const regex = new RegExp(`${key}=".*"`);
    if (envContent.includes(key)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `${key}="${value}"\n`;
    }
  }
  
  fs.writeFileSync(envPath, envContent);

  console.log("\n🎉 DEPLOYMENT COMPLETED!");
  console.log("\n📋 Contract Addresses:");
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  console.log("\n🚀 Ready for frontend integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
