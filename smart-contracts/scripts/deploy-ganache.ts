import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Starting deployment to Ganache...");
  
  const [deployer, issuer, investor] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DecentralizedKYC first
  console.log("\n1. Deploying DecentralizedKYC...");
  const DecentralizedKYC = await ethers.getContractFactory("DecentralizedKYC");
  const kycContract = await DecentralizedKYC.deploy("DecentralizedKYC", "1.0");
  await kycContract.waitForDeployment();
  const kycAddress = await kycContract.getAddress();
  console.log("DecentralizedKYC deployed to:", kycAddress);

  // Deploy AssetMarketplace
  console.log("\n2. Deploying AssetMarketplace...");
  const AssetMarketplace = await ethers.getContractFactory("AssetMarketplace");
  const marketplaceContract = await AssetMarketplace.deploy(deployer.address, deployer.address);
  await marketplaceContract.waitForDeployment();
  const marketplaceAddress = await marketplaceContract.getAddress();
  console.log("AssetMarketplace deployed to:", marketplaceAddress);

  // Deploy a basic AssetToken for testing
  console.log("\n3. Deploying AssetToken...");
  const AssetToken = await ethers.getContractFactory("contracts/AssetToken.sol:AssetToken");
  const assetTokenContract = await AssetToken.deploy(
    "Test Real Estate Token",
    "TRET",
    issuer.address, // issuer
    kycAddress, // kyc contract
    deployer.address // compliance officer
  );
  await assetTokenContract.waitForDeployment();
  const assetTokenAddress = await assetTokenContract.getAddress();
  console.log("AssetToken deployed to:", assetTokenAddress);

  // Set up some initial KYC verifications for testing
  console.log("\n4. Setting up sample KYC verifications...");
  
  // Verify the deployer (admin)
  await kycContract.connect(deployer).adminSetKYC(
    deployer.address,
    2, // KYCLevel.ENHANCED
    1, // AMLRisk.LOW
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
    "US",
    "QmSampleKYCHashAdmin"
  );
  
  // Verify the issuer
  await kycContract.connect(deployer).adminSetKYC(
    issuer.address,
    1, // KYCLevel.BASIC
    1, // AMLRisk.LOW
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
    "US",
    "QmSampleKYCHash1"
  );
  
  // Verify the investor
  await kycContract.connect(deployer).adminSetKYC(
    investor.address,
    2, // KYCLevel.ENHANCED
    1, // AMLRisk.LOW
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
    "US",
    "QmSampleKYCHash2"
  );

  // Set KYC status in AssetToken contract
  console.log("\n5. Setting up KYC status in AssetToken...");
  await assetTokenContract.connect(deployer).setKYCStatus(
    deployer.address,
    true,
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
  );
  
  await assetTokenContract.connect(deployer).setKYCStatus(
    issuer.address,
    true,
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
  );
  
  await assetTokenContract.connect(deployer).setKYCStatus(
    investor.address,
    true,
    Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
  );

  console.log("✅ KYC verification completed for sample users");

  // Create deployment summary
  const deploymentInfo = {
    network: "ganache",
    chainId: 1337,
    deployer: deployer.address,
    contracts: {
      DecentralizedKYC: kycAddress,
      AssetMarketplace: marketplaceAddress,
      AssetToken: assetTokenAddress
    },
    testAccounts: {
      deployer: deployer.address,
      issuer: issuer.address,
      investor: investor.address
    },
    deploymentTime: new Date().toISOString()
  };

  // Save deployment info to file
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Update .env file with contract addresses
  const envPath = path.join(__dirname, "../../.env");
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace(
    /EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=".*"/,
    `EXPO_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="${marketplaceAddress}"`
  );
  envContent = envContent.replace(
    /EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS=".*"/,
    `EXPO_PUBLIC_ASSET_TOKEN_CONTRACT_ADDRESS="${assetTokenAddress}"`
  );
  
  // Add KYC contract address if not present
  if (!envContent.includes('EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS')) {
    envContent += `EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS="${kycAddress}"\n`;
  } else {
    envContent = envContent.replace(
      /EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS=".*"/,
      `EXPO_PUBLIC_DECENTRALIZED_KYC_ADDRESS="${kycAddress}"`
    );
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("📝 Updated .env file with contract addresses");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("===================");
  console.log("DecentralizedKYC:", kycAddress);
  console.log("AssetMarketplace:", marketplaceAddress);
  console.log("AssetToken:", assetTokenAddress);
  
  console.log("\nTest Accounts:");
  console.log("==============");
  console.log("Deployer/Admin:", deployer.address);
  console.log("Issuer (KYC Verified):", issuer.address);
  console.log("Investor (KYC Verified):", investor.address);
  
  console.log("\n🔗 You can now test the contracts using these addresses!");
  console.log("Connect your wallet to the Ganache network and interact with the deployed contracts.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
