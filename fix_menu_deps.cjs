const fs = require('fs');

let content = fs.readFileSync('src/components/Menu.tsx', 'utf8');

content = content.replace(
  /const baseSections = \[([\s\S]*?)\];/g,
  `const baseSections = React.useMemo(() => [\n$1\n  ], [t]);`
);

content = content.replace(
  /const activeSectionIds = \['Signature', 'Gifting', 'More Items'\];/g,
  `const activeSectionIds = React.useMemo(() => ['Signature', 'Gifting', 'More Items'], []);`
);

fs.writeFileSync('src/components/Menu.tsx', content);
