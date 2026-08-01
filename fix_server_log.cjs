const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const targetLog = `    const errorMsg = webhookErr.response?.data || webhookErr.message || webhookErr;
    console.warn('[Google Sheets Webhook] Sync failed:', errorMsg);`;

const replacementLog = `    let errorMsg = webhookErr.response?.data || webhookErr.message || webhookErr;
    if (typeof errorMsg === 'string' && errorMsg.includes('<html')) {
       errorMsg = 'HTML Response (Apps Script URL invalid or unavailable)';
    }
    console.warn('[Google Sheets Webhook] Sync failed:', errorMsg);`;

content = content.replace(targetLog, replacementLog);

fs.writeFileSync('server.ts', content);
