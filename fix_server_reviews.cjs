const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const targetRowValues = `  const rowValues = [
    payload.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    orderId,
    payload.customerName || payload.name || "Valued Customer",
    payload.customerPhone || payload.phone || "",
    payload.customerEmail || payload.email || "",
    typeof payload.items === 'string' ? payload.items : JSON.stringify(payload.items || ''),
    payload.subtotal || payload.total || 0,
    payload.total || payload.price || 0,
    payload.deliveryDate || "",
    payload.deliveryAddress || payload.address || "Kolkata",
    payload.status || "Pending",
    payload.paymentMethod || "Cash on Delivery",
    payload.notes || payload.message || payload.requirements || ""
  ];`;

const replacementRowValues = `  let rowValues = [];
  
  if (requestedSheetName.toLowerCase() === 'reviews') {
    rowValues = [
      payload.name || "Anonymous", // 0: Name (En)
      payload.name || "Anonymous", // 1: Name (Bn)
      payload.rating || 5, // 2: Rating
      payload.text || "", // 3: Text (En)
      payload.text || "", // 4: Text (Bn)
      payload.timestamp || new Date().toISOString(), // 5: Date
      payload.avatar || 'https://i.ibb.co/XkYN11bL/PROFILE.jpg', // 6: Avatar
      "", // 7: Owner Reply (En)
      "", // 8: Owner Reply (Bn)
      payload.source || 'web', // 9: Source
      Array.isArray(payload.photoUrls) ? payload.photoUrls.join(',') : "" // 10: Images
    ];
  } else {
    rowValues = [
      payload.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      orderId,
      payload.customerName || payload.name || "Valued Customer",
      payload.customerPhone || payload.phone || "",
      payload.customerEmail || payload.email || "",
      typeof payload.items === 'string' ? payload.items : JSON.stringify(payload.items || ''),
      payload.subtotal || payload.total || 0,
      payload.total || payload.price || 0,
      payload.deliveryDate || "",
      payload.deliveryAddress || payload.address || "Kolkata",
      payload.status || "Pending",
      payload.paymentMethod || "Cash on Delivery",
      payload.notes || payload.message || payload.requirements || ""
    ];
  }`;

content = content.replace(targetRowValues, replacementRowValues);
fs.writeFileSync('server.ts', content);
