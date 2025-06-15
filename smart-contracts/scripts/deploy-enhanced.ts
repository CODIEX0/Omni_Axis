import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting enhanced deployment to Ganache...");
  
  const [deployer, issuer, investor, admin] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

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

  // 3. Deploy AssetTokenFactory
  console.log("\n3️⃣ Deploying AssetTokenFactory...");
  const AssetTokenFactory = await ethers.getContractFactory("AssetTokenFactory");
  const factoryContract = await AssetTokenFactory.deploy(kycAddress, deployer.address);
  await factoryContract.waitForDeployment();
  const factoryAddress = await factoryContract.getAddress();
  deployedContracts.AssetTokenFactory = factoryAddress;
  console.log("✅ AssetTokenFactory deployed to:", factoryAddress);

  // 4. Deploy YieldDistribution
  console.log("\n4️⃣ Deploying YieldDistribution...");
  const YieldDistribution = await ethers.getContractFactory("YieldDistribution");
  const yieldContract = await YieldDistribution.deploy();
  await yieldContract.waitForDeployment();
  const yieldAddress = await yieldContract.getAddress();
  deployedContracts.YieldDistribution = yieldAddress;
  console.log("✅ YieldDistribution deployed to:", yieldAddress);

  // 5. Deploy EnhancedAssetMarketplace
  console.log("\n5️⃣ Deploying EnhancedAssetMarketplace...");
  const EnhancedAssetMarketplace = await ethers.getContractFactory("EnhancedAssetMarketplace");
  const marketplaceContract = await EnhancedAssetMarketplace.deploy(deployer.address, deployer.address);
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  deployedContracts.EnhancedAssetMarketplace = marketplaceAddress;
  console.log("✅ EnhancedAssetMarketplace deployed to:", marketplaceAddress);

  // Connect marketplace to KYC and Oracle
  await marketplaceContract.setKYCContract(kycAddress);
  await marketplaceContract.setPriceOracle(priceOracleAddress);
  console.log("✅ Marketplace connected to KYC and Oracle");

  // 6. Deploy a sample AssetToken
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

  // 7. Set up KYC verifications
  console.log("\n7️⃣ Setting up KYC verifications...");
  
  const accounts = [
    { address: deployer.address, name: "Admin", level: 2 },
    { address: issuer.address, name: "Issuer", level: 2 },
    { address: investor.address, name: "Investor", level: 1 },
    { address: admin.address, name: "Admin2", level: 2 }
  ];

  for (const account of accounts) {
    await kycContract.connect(deployer).adminSetKYC(
      account.address,
      account.level, // KYCLevel
      1, // AMLRisk.LOW
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
      "US",
      `QmSample${account.name}Hash`
    );
    console.log(`✅ KYC verified: ${account.name} (${account.address.slice(0, 10)}...)`);
  }

  // 8. Set up KYC status in AssetToken
  console.log("\n8️⃣ Setting up KYC status in AssetToken...");
  for (const account of accounts) {
    await assetTokenContract.connect(deployer).setKYCStatus(
      account.address,
      true,
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
    );
  }
  console.log("✅ KYC status set in AssetToken for all test accounts");

  // 9. Create a test yield distribution
  console.log("\n9️⃣ Creating test yield distribution...");
  const distributionAmount = ethers.parseEther("10"); // 10 ETH yield
  await yieldContract.connect(deployer).createDistribution(
    assetTokenAddress,
    distributionAmount,
    "Q1 2025 Rental Income Distribution",
    0, // Use default claim period
    { value: distributionAmount }
  );
  console.log("✅ Test yield distribution created");

  // 10. Create a test marketplace listing
  console.log("\n🔟 Creating test marketplace listing...");
  const listingAmount = ethers.parseEther("1000"); // 1000 tokens
  const pricePerToken = ethers.parseEther("0.1"); // 0.1 ETH per token
  
  // First approve the marketplace to spend tokens
  await assetTokenContract.connect(issuer).approve(marketplaceAddress, listingAmount);
  
  await marketplaceContract.connect(issuer).createListing(
    assetTokenAddress,
    listingAmount,
    pricePerToken,
    0, // FIXED_PRICE
    7 * 24 * 60 * 60, // 7 days duration
    0, // No min bid increment for fixed price
    true, // Requires KYC
    "ipfs://QmSampleListingMetadata"
  );
  console.log("✅ Test marketplace listing created");

  // 11. Save deployment information
  const deploymentInfo = {
    network: "ganache",
    chainId: 1337,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contracts: deployedContracts,
    testAccounts: {
      deployer: deployer.address,
      issuer: issuer.address,
      investor: investor.address,
      admin: admin.address
    },
    sampleData: {
      assetToken: {
        address: assetTokenAddress,
        name: "Premium Real Estate Token",
        symbol: "PRET",
        totalSupply: "1000000"
      },
      yieldDistribution: {
        id: 1,
        amount: "10 ETH",
        description: "Q1 2025 Rental Income Distribution"
      },
      marketplaceListing: {
        id: 1,
        amount: "1000 tokens",
        pricePerToken: "0.1 ETH"
      }
    }
  };

  // Save deployment info
  const deploymentPath = path.join(__dirname, "../enhanced-deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Enhanced deployment info saved to:", deploymentPath);

  // Update .env file
  const envPath = path.join(__dirname, "../../.env");
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update contract addresses
  const contractUpdates = [
    ['EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS', marketplaceAddress],
    ['EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS', assetTokenAddress],
    ['EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS', kycAddress],
    ['EXPO_PUBLIC_ASSET_TOKEN_FACTORY_ADDRESS', factoryAddress],
  ];

  for (const [key, value] of contractUpdates) {
    const regex = new RegExp(`${key}=".*"`);
    if (envContent.includes(key)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `${key}="${value}"\n`;
    }
  }

  // Add new contract addresses
  const newContracts = [
    ['EXPO_PUBLIC_CHAINLINK_PRICE_ORACLE_ADDRESS', priceOracleAddress],
    ['EXPO_PUBLIC_YIELD_DISTRIBUTION_ADDRESS', yieldAddress],
    ['EXPO_PUBLIC_ENHANCED_MARKETPLACE_ADDRESS', marketplaceAddress],
  ];

  for (const [key, value] of newContracts) {
    if (!envContent.includes(key)) {
      envContent += `${key}="${value}"\n`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("📝 Updated .env file with all contract addresses");

  // Final summary
  console.log("\n🎉 ENHANCED DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("\n📋 Contract Summary:");
  console.log("====================");
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  console.log("\n👥 Test Accounts:");
  console.log("=================");
  console.log("Deployer/Admin:", deployer.address);
  console.log("Asset Issuer:", issuer.address);
  console.log("Investor:", investor.address);
  console.log("Additional Admin:", admin.address);
  
  console.log("\n🔗 System Features:");
  console.log("==================");
  console.log("✅ Decentralized KYC/AML verification");
  console.log("✅ Asset token factory for dynamic creation");
  console.log("✅ Enhanced marketplace with auctions");
  console.log("✅ Yield distribution system");
  console.log("✅ Price oracle integration");
  console.log("✅ Sample data for testing");
  
  console.log("\n🚀 Ready for comprehensive testing and frontend integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Enhanced deployment failed:", error);
    process.exit(1);
  });
