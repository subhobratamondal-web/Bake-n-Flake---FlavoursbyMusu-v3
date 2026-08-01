const fs = require('fs');

let content = fs.readFileSync('src/components/ProductReviewsModal.tsx', 'utf8');

const targetSubmit = `    // Sync product review to Google Sheets
    fetch('/api/sync-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: 'FAQ',
        orderId: 'REV-' + Date.now(),
        customerName: userName.trim(),
        items: \`PRODUCT REVIEW for \${product.nameEn}: \${userComment.trim()}\`,
        status: \`\${newRating}/5 Stars\`,
        notes: reviewPhoto ? \`Cake Photo Attached: \${reviewPhoto.slice(0, 100)}...\` : 'No photo',
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      })
    }).catch(err => console.warn('Review sync notice:', err));`;

const replacementSubmit = `    // Sync product review to Google Sheets
    import('../utils/googleSheetsSync').then(({ submitReviewToGoogleSheet }) => {
      submitReviewToGoogleSheet({
        name: userName.trim(),
        rating: newRating,
        text: \`[PRODUCT REVIEW for \${product.nameEn}] \${userComment.trim()}\`,
        source: 'web',
        photoUrls: reviewPhoto ? [reviewPhoto] : []
      }).catch(err => console.warn('Review sync notice:', err));
    });`;

content = content.replace(targetSubmit, replacementSubmit);
fs.writeFileSync('src/components/ProductReviewsModal.tsx', content);
