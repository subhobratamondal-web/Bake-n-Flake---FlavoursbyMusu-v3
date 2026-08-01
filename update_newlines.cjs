const fs = require('fs');

let content = fs.readFileSync('src/components/Reviews.tsx', 'utf8');

// replace textEn rendering
const targetText = `"{t.lang === 'en' ? review.textEn : review.textBn}"`;
const replacementText = `(t.lang === 'en' ? review.textEn : review.textBn).split('\\n').map((line, i) => (
                        <React.Fragment key={i}>{line}<br/></React.Fragment>
                      ))`;

content = content.replace(targetText, replacementText);

// replace ownerReply rendering
const targetReply = `{t.lang === 'en' ? review.ownerReplyEn : review.ownerReplyBn}`;
const replacementReply = `{(t.lang === 'en' ? review.ownerReplyEn : review.ownerReplyBn)?.split('\\n').map((line, i) => (
                            <React.Fragment key={i}>{line}<br/></React.Fragment>
                          ))}`;

content = content.replace(targetReply, replacementReply);

fs.writeFileSync('src/components/Reviews.tsx', content);
