const fs = require('fs');

let content = fs.readFileSync('src/utils/googleSheetsSync.ts', 'utf8');

const targetParse = `        return {
          nameEn, nameBn, rating, textEn, textBn,
          date: new Date(dateStr || Date.now()),
          avatar, ownerReplyEn, ownerReplyBn, source,
          images: reviewImages
        };`;

const replacementParse = `        return {
          nameEn, nameBn, rating, textEn, textBn,
          date: new Date(dateStr || Date.now()),
          timeEn: dateStr || 'Recently',
          timeBn: dateStr || 'সম্প্রতি',
          avatar, ownerReplyEn, ownerReplyBn, source,
          images: reviewImages
        };`;

content = content.replace(targetParse, replacementParse);
fs.writeFileSync('src/utils/googleSheetsSync.ts', content);
