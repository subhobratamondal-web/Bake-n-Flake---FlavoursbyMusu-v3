const fs = require('fs');

let content = fs.readFileSync('src/constants/fullGalleryBackup.ts', 'utf8');

const targetItem = `{
      "nameEn": "Butterscotch Cakes",`;

const replacementItem = `{
      "nameEn": "Chocolate Cakes",
      "nameBn": "চকলেট কেক",
      "section": "Signature Menu",
      "img": "https://i.ibb.co/S4MNP7Vf/Chocolate-Cakes.png"
    },
    {
      "nameEn": "Butterscotch Cakes",`;

content = content.replace(targetItem, replacementItem);
fs.writeFileSync('src/constants/fullGalleryBackup.ts', content);
