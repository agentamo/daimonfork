const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Find node_modules for imports
function findImports(importPath) {
  try {
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules', importPath);
    const source = fs.readFileSync(nodeModulesPath, 'utf8');
    return { contents: source };
  } catch (e) {
    return { error: 'File not found: ' + importPath };
  }
}

// Read the contract
const contractPath = path.join(__dirname, 'DaimonGenesis.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Prepare input for solc
const input = {
  language: 'Solidity',
  sources: {
    'DaimonGenesis.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

// Compile with import resolver
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

// Check for errors
if (output.errors) {
  output.errors.forEach(err => {
    console.error(err.formattedMessage || err);
  });
  if (output.errors.some(err => err.severity === 'error')) {
    process.exit(1);
  }
}

// Extract output
const contract = output.contracts['DaimonGenesis.sol']['DaimonGenesis'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

// Save ABI and bytecode
fs.writeFileSync(
  path.join(__dirname, 'DaimonGenesis.json'),
  JSON.stringify({ abi, bytecode: '0x' + bytecode }, null, 2)
);

console.log('Compiled successfully');
console.log('ABI saved to DaimonGenesis.json');
