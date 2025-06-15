import { ethers } from "hardhat";

async function main() {
  console.log("Testing deployed contracts...");
  
  const [deployer, issuer, investor] = await ethers.getSigners();
  
  // Contract addresses from deployment
  const kycAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
  const marketplaceAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const assetTokenAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
  
  // Get contract instances
  const kycContract = await ethers.getContractAt("DecentralizedKYC", kycAddress);
  const marketplaceContract = await ethers.getContractAt("AssetMarketplace", marketplaceAddress);
  const assetTokenContract = await ethers.getContractAt("contracts/AssetToken.sol:AssetToken", assetTokenAddress);
  
  console.log("\n=== Testing KYC Contract ===");
  
  // Test KYC verification status
  const isDeployerVerified = await kycContract.isKYCVerified(deployer.address);
  const isIssuerVerified = await kycContract.isKYCVerified(issuer.address);
  const isInvestorVerified = await kycContract.isKYCVerified(investor.address);
  
  console.log("Deployer KYC verified:", isDeployerVerified);
  console.log("Issuer KYC verified:", isIssuerVerified);
  console.log("Investor KYC verified:", isInvestorVerified);
  
  console.log("\n=== Testing AssetToken Contract ===");
  
  // Check token details
  const tokenName = await assetTokenContract.name();
  const tokenSymbol = await assetTokenContract.symbol();
  const totalSupply = await assetTokenContract.totalSupply();
  const issuerBalance = await assetTokenContract.balanceOf(issuer.address);
  
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Total Supply:", ethers.formatEther(totalSupply));
  console.log("Issuer Balance:", ethers.formatEther(issuerBalance));
  
  // Check KYC status in AssetToken
  const issuerKycStatus = await assetTokenContract.kycVerified(issuer.address);
  const investorKycStatus = await assetTokenContract.kycVerified(investor.address);
  
  console.log("Issuer KYC in AssetToken:", issuerKycStatus);
  console.log("Investor KYC in AssetToken:", investorKycStatus);
  
  console.log("\n=== Testing Token Transfer ===");
  
  try {
    // Try to transfer tokens from issuer to investor
    const transferAmount = ethers.parseEther("100");
    const tx = await assetTokenContract.connect(issuer).transfer(investor.address, transferAmount);
    await tx.wait();
    
    const investorBalance = await assetTokenContract.balanceOf(investor.address);
    console.log("✅ Transfer successful! Investor balance:", ethers.formatEther(investorBalance));
  } catch (error) {
    console.log("❌ Transfer failed:", error.message);
  }
  
  console.log("\n=== Testing AssetMarketplace Contract ===");
  
  // Check marketplace details
  const feeRecipient = await marketplaceContract.feeRecipient();
  const platformFeeRate = await marketplaceContract.platformFeeRate();
  
  console.log("Fee Recipient:", feeRecipient);
  console.log("Platform Fee Rate:", platformFeeRate.toString(), "basis points");
  
  console.log("\n🎉 All tests completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
