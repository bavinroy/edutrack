const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\HP\\Desktop\\tail\\student\\app\\student';

const dashboardHeaderStr = `header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20, backgroundColor: '#F9FAFB' }`;

try {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Update container background colors safely
    content = content.replace(/(container:\s*\{.*?backgroundColor:\s*['"])(.*?)(['"])/s, '$1#F9FAFB$3');

    // Standardize header blocks if they exist
    // Careful: replacing the block up to the FIRST '}' after 'header: {'
    // It shouldn't match nested braces if we assume header has no nested braces.
    content = content.replace(/header:\s*\{[^}]*\}/, dashboardHeaderStr);

    // Update StatusBar safely
    content = content.replace(/<StatusBar\s+[^>]*\/>/g, '<StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />');
    
    // Update headerTitle slightly if needed to #111827
    content = content.replace(/(headerTitle:\s*\{.*?color:\s*['"])(.*?)(['"])/s, '$1#111827$3');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
} catch (e) {
  console.error(e);
}
