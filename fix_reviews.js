const fs = require('fs');
let content = fs.readFileSync('src/components/Reviews.tsx', 'utf8');
content = content.replace(/b\.date\.getTime\(\) - a\.date\.getTime\(\)/g, '(b.date?.getTime() || 0) - (a.date?.getTime() || 0)');
fs.writeFileSync('src/components/Reviews.tsx', content);
