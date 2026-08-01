const fs = require('fs');
let content = fs.readFileSync('src/components/Reviews.tsx', 'utf8');

// target for textEn
const targetText = `                      (t.lang === 'en' ? review.textEn : review.textBn).split('\\n').map((line, i) => (
                        <React.Fragment key={i}>{line}<br/></React.Fragment>
                      ))`;
const replacementText = `                      {(t.lang === 'en' ? review.textEn : review.textBn).split('\\n').map((line, i) => (
                        <React.Fragment key={i}>{line}<br/></React.Fragment>
                      ))}`;

content = content.replace(targetText, replacementText);

fs.writeFileSync('src/components/Reviews.tsx', content);
