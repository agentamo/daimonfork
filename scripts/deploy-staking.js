/**
 * Deploy DaimonStaking contract
 * 
 * Usage: node scripts/deploy-staking.js
 * 
 * Requires DAIMON_WALLET_KEY and BASE_RPC env vars
 */

const { createWalletClient, http } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');

async function main() {
  const account = privateKeyToAccount(process.env.DAIMON_WALLET_KEY);
  const client = createWalletClient({
    account,
    chain: base,
    transport: http(process.env.BASE_RPC || 'https://mainnet.base.org')
  });

  console.log('Deploying DaimonStaking...');
  console.log('Deployer:', account.address);

  const { abi, bytecode } = JSON.parse(fs.readFileSync('contracts/DaimonStaking.json', 'utf8'));

  const hash = await client.deployContract({
    abi,
    bytecode,
    args: []
  });

  console.log('Deployment tx:', hash);
  
  // Wait for confirmation
  const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC || 'https://mainnet.base.org')
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('Deployed at:', receipt.contractAddress);
  
  // Save deployment info
  fs.writeFileSync('scripts/DaimonStaking-deployment.json', JSON.stringify({
    network: 'base',
    address: receipt.contractAddress,
    deployer: account.address,
    txHash: hash,
    deployedAt: new Date().toISOString()
  }, null, 2));
  
  console.log('Deployment saved to scripts/DaimonStaking-deployment.json');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
