const fs = require('fs');

let content = fs.readFileSync('src/utils/googleSheetsSync.ts', 'utf8');

const targetLoop = `      chunk.forEach((sheetName, index) => {
        const catRows = categoryRowsList[index];
        if (catRows && catRows.length > 0) {
          const catImages: string[] = [];
          catRows.forEach(row => {
            row.forEach(cell => {
              if (cell && (cell.startsWith('http://') || cell.startsWith('https://') || cell.includes('drive.google.com') || cell.includes('ibb.co'))) {
                const converted = convertImageUrl(cell);
                if (converted && !catImages.includes(converted)) {
                  catImages.push(converted);
                }
              }
            });
          });
          if (catImages.length > 0) {
            result[sheetName] = catImages;
          }
        }
      });`;

const replacementLoop = `      chunk.forEach((sheetName, index) => {
        const catRows = categoryRowsList[index];
        if (catRows && catRows.length > 0) {
          const catImages: string[] = [];
          catRows.forEach(row => {
            row.forEach(cell => {
              if (cell && (cell.startsWith('http://') || cell.startsWith('https://') || cell.includes('drive.google.com') || cell.includes('ibb.co'))) {
                const converted = convertImageUrl(cell);
                if (converted && !catImages.includes(converted)) {
                  catImages.push(converted);
                }
              }
            });
          });
          if (catImages.length > 0) {
            result[sheetName] = catImages;
            
            // Auto-restore missing menu items if they exist as category tabs but were removed from Menu Database
            if (result.items && !result.items.find(it => it.nameEn.toLowerCase() === sheetName.toLowerCase())) {
              let section = 'Signature Menu';
              if (sheetName.toLowerCase().includes('gift') || sheetName.toLowerCase().includes('day') || sheetName.toLowerCase().includes('anniversary') || sheetName.toLowerCase().includes('birthday')) {
                section = 'Thoughtful Gifting';
              } else if (sheetName.toLowerCase().includes('theme') || sheetName.toLowerCase().includes('photo') || sheetName.toLowerCase().includes('combo') || sheetName.toLowerCase().includes('pizza')) {
                section = 'Explore More';
              }
              
              result.items.push({
                nameEn: sheetName,
                nameBn: sheetName,
                section: section,
                img: catImages[0]
              });
            }
          }
        }
      });`;

content = content.replace(targetLoop, replacementLoop);
fs.writeFileSync('src/utils/googleSheetsSync.ts', content);
