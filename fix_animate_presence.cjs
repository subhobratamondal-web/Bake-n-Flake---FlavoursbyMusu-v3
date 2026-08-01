const fs = require('fs');
let content = fs.readFileSync('src/components/Menu.tsx', 'utf8');

// Replace AnimatePresence around the grid
// From: <AnimatePresence mode="popLayout" initial={false}>
// To: <AnimatePresence>

content = content.replace(/<AnimatePresence mode="popLayout" initial=\{false\}>/g, '<AnimatePresence>');

fs.writeFileSync('src/components/Menu.tsx', content);
