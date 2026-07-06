const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory() && file !== 'node_modules' && file !== '.expo') {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(__dirname);
let totalChanges = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace <TouchableOpacity> that don't have activeOpacity
  content = content.replace(/<TouchableOpacity([\s\S]*?)>/g, (match, p1) => {
    // If it already has activeOpacity, skip
    if (p1.includes('activeOpacity')) {
      return match;
    }
    // Otherwise add activeOpacity={0.7}
    return `<TouchableOpacity activeOpacity={0.7}${p1}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Total files updated: ${totalChanges}`);
