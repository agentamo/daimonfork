import { createWalletClient, createPublicClient, http, parseAbi, getAddress } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const LOCKER = '0x63D2DfEA64b3433F4071A98665bcD7Ca14d93496';
const TOKEN = '0x98c51C8E958ccCD37F798b2B9332d148E2c05D57';
const REWARD_INDEX = 0n;
const NEW_FEE_PREF = 1; // 0=Both, 1=Paired (WETH), 2=Clanker

const abi = parseAbi([
  'function updateFeePreference(address token, uint256 rewardIndex, uint8 newFeePreference)',
  'function feePreferences(address token, uint256 index) view returns (uint8)',
]);

const key = process.env.PRIVATE_KEY;
if (!key) {
  console.error('Missing PRIVATE_KEY env var');
  process.exit(1);
}

const account = privateKeyToAccount(key);
const transport = http('https://mainnet.base.org');

const publicClient = createPublicClient({ chain: base, transport });
const walletClient = createWalletClient({ account, chain: base, transport });

// Pre-flight: check current fee preference
const currentPref = await publicClient.readContract({
  address: LOCKER,
  abi,
  functionName: 'feePreferences',
  args: [TOKEN, REWARD_INDEX],
});

const labels = ['Both', 'Paired (WETH)', 'Clanker'];
console.log(`Current fee preference: ${labels[currentPref]} (${currentPref})`);

if (currentPref === NEW_FEE_PREF) {
  console.log('Already set to Paired (WETH). Nothing to do.');
  process.exit(0);
}

// Send the transaction
console.log(`Switching to: ${labels[NEW_FEE_PREF]}...`);

const hash = await walletClient.writeContract({
  address: LOCKER,
  abi,
  functionName: 'updateFeePreference',
  args: [TOKEN, REWARD_INDEX, NEW_FEE_PREF],
});

console.log(`tx submitted: ${hash}`);
console.log('Waiting for confirmation...');

const receipt = await publicClient.waitForTransactionReceipt({ hash });

if (receipt.status === 'success') {
  console.log(`Confirmed in block ${receipt.blockNumber}. Fees now collected in WETH.`);
} else {
  console.error('Transaction reverted.');
  process.exit(1);
}
