const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stringsPath = path.join(__dirname, 'src', 'constants', 'strings.ts');
const stringsContent = fs.readFileSync(stringsPath, 'utf8');

// Find all export const XXX = { ... }
const exportRegex = /export\s+const\s+([A-Z_0-9]+)\s*=\s*{([^}]+)}/g;
let match;
const constants = {};

while ((match = exportRegex.exec(stringsContent)) !== null) {
  const objName = match[1];
  const objBody = match[2];
  
  // extract keys
  const keys = [];
  const keyRegex = /^\s*([A-Z_0-9]+)\s*:/gm;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(objBody)) !== null) {
    keys.push(keyMatch[1]);
  }
  
  constants[objName] = keys;
}

// Find export const XXX = [ ... ] (like OPTIONS, TRANSACTION_TYPE_OPTIONS)
const exportArrayRegex = /export\s+const\s+([A-Z_0-9]+)\s*=\s*\[/g;
while ((match = exportArrayRegex.exec(stringsContent)) !== null) {
  if (!constants[match[1]]) {
    constants[match[1]] = [];
  }
}

// Also standalone exports like export const SYSTEM_NAME = ...
const exportConstRegex = /export\s+const\s+([A-Z_0-9]+)\s*=/g;
const standalone = [];
while ((match = exportConstRegex.exec(stringsContent)) !== null) {
  const name = match[1];
  if (!constants[name]) {
    standalone.push(name);
  }
}

console.log('Checking usage in src/**/*.tsx and src/**/*.ts (excluding strings.ts)...');

const unused = [];

const checkUsage = (pattern) => {
  try {
    // using grep to find occurrences
    // -r recursive, -l files with matches, --include filter
    const result = execSync(`grep -rl --include="*.ts" --include="*.tsx" "${pattern}" src/ | grep -v "src/constants/strings.ts" | grep -v "src/constants/index.ts"`, { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (e) {
    return false; // grep returns exit code 1 if no match found
  }
};

for (const [objName, keys] of Object.entries(constants)) {
  if (keys.length === 0) {
    // Check the object itself
    if (!checkUsage(objName)) {
      unused.push(objName);
    }
  } else {
    // Check if the object is used directly
    const objUsed = checkUsage(objName);
    
    // Check each key
    for (const key of keys) {
      // Check if `objName.key` or just `key` is used? Usually it's `objName.key` because it's imported as `import { PAGE_NAMES } ... PAGE_NAMES.INVENTORY`
      const usagePattern = `${objName}\\.${key}`;
      if (!checkUsage(usagePattern)) {
        // sometimes they might destructure: const { INVENTORY } = PAGE_NAMES; 
        // let's do a fallback check if the key alone is used
        if (!checkUsage(key)) {
            unused.push(`${objName}.${key}`);
        } else {
            // key is used somewhere, but not as objName.key. Might be destructured. Let's assume used.
        }
      }
    }
  }
}

for (const name of standalone) {
  if (!checkUsage(name)) {
    unused.push(name);
  }
}

console.log('Unused Constants Found:');
console.log(unused.join('\n'));
