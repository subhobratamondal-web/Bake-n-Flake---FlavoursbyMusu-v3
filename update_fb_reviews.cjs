const fs = require('fs');

const facebookReviews = [
  { 
    nameEn: "Esha Nath", nameBn: "এশা নাথ", rating: 5, 
    textEn: "in love with her cakes!! ❤️❤️ teste amezing 😍 looking forward to buy more cakes from you🙈❤️ Much love ❤️", 
    textBn: "in love with her cakes!! ❤️❤️ teste amezing 😍 looking forward to buy more cakes from you🙈❤️ Much love ❤️", 
    source: "facebook", timeEn: "8 February 2021", timeBn: "৮ ফেব্রুয়ারি ২০২১",
    recommends: true,
    ownerReplyEn: "Thank You So Much 💋", ownerReplyBn: "Thank You So Much 💋"
  },
  { 
    nameEn: "Riya Das", nameBn: "রিয়া দাস", rating: 5, 
    textEn: "I ordered many cakes from Bake n' flake.The cake was beautiful and so tasty...Thank you so much for your beautiful creation...The cake was FANTASTIC... I have to tell you, the flavour was outstanding.❤️", 
    textBn: "I ordered many cakes from Bake n' flake.The cake was beautiful and so tasty...Thank you so much for your beautiful creation...The cake was FANTASTIC... I have to tell you, the flavour was outstanding.❤️", 
    source: "facebook", timeEn: "8 February 2021", timeBn: "৮ ফেব্রুয়ারি ২০২১",
    recommends: true,
    ownerReplyEn: "Thank you so much babu!❤️💋\nYou're welcome divai ❤️😘", ownerReplyBn: "Thank you so much babu!❤️💋\nYou're welcome divai ❤️😘"
  },
  { 
    nameEn: "Po PY", nameBn: "Po PY", rating: 5, 
    textEn: "taste is awesome ... mio amore fail\nand design ??\nas same as you want", 
    textBn: "taste is awesome ... mio amore fail\nand design ??\nas same as you want", 
    source: "facebook", timeEn: "8 February 2021", timeBn: "৮ ফেব্রুয়ারি ২০২১",
    recommends: true,
    ownerReplyEn: "Thank You So Much❤️😘\nBake n' Flake keep it up sister 👍", ownerReplyBn: "Thank You So Much❤️😘\nBake n' Flake keep it up sister 👍"
  },
  { 
    nameEn: "Sunny Gomez", nameBn: "সানি গোমেজ", rating: 5, 
    textEn: "❤️❤️❤️❤️❤️❤️❤️❤️🎂🍕🍩🍭🍦🍰🥧\nGreat for children - Delicious pastries - Large menu - Best biscuits - Tasty cupcakes", 
    textBn: "❤️❤️❤️❤️❤️❤️❤️❤️🎂🍕🍩🍭🍦🍰🥧\nGreat for children - Delicious pastries - Large menu - Best biscuits - Tasty cupcakes", 
    source: "facebook", timeEn: "8 February 2021", timeBn: "৮ ফেব্রুয়ারি ২০২১",
    recommends: true
  },
  { 
    nameEn: "Jy Ö Ti", nameBn: "Jy Ö Ti", rating: 5, 
    textEn: "Ami 3 te cake order krechilm🎂 cake gulo jmon testy❤️🥰jini baniyechen tar babohar o samon misti😘 abr nebo onek gulo 🛍️❤️", 
    textBn: "Ami 3 te cake order krechilm🎂 cake gulo jmon testy❤️🥰jini baniyechen tar babohar o samon misti😘 abr nebo onek gulo 🛍️❤️", 
    source: "facebook", timeEn: "8 February 2021", timeBn: "৮ ফেব্রুয়ারি ২০২১",
    recommends: true,
    ownerReplyEn: "Hamu nau😘❤️", ownerReplyBn: "Hamu nau😘❤️"
  },
  { 
    nameEn: "Tina Mukherjee", nameBn: "টিনা মুখার্জী", rating: 5, 
    textEn: "I wanted to order from her for a very long time and somehow couldn't, this Christmas I got the chance an ordered the Coffee walnut cake from her. My god! it was the best...", 
    textBn: "I wanted to order from her for a very long time and somehow couldn't, this Christmas I got the chance an ordered the Coffee walnut cake from her. My god! it was the best...", 
    source: "facebook", timeEn: "3 years ago", timeBn: "৩ বছর আগে",
    recommends: true
  },
  { 
    nameEn: "Tuli Das", nameBn: "তুলি দাস", rating: 5, 
    textEn: "Highly recommended ❤️❤️❤️ she made the cake exactly what I wanted for my fiance's Birthday. Thank you so much for making our celebration greater indeed. ❤️...", 
    textBn: "Highly recommended ❤️❤️❤️ she made the cake exactly what I wanted for my fiance's Birthday. Thank you so much for making our celebration greater indeed. ❤️...", 
    source: "facebook", timeEn: "3 years ago", timeBn: "৩ বছর আগে",
    recommends: true
  },
  { 
    nameEn: "Saheli Dey", nameBn: "সহেলী দে", rating: 5, 
    textEn: "1st impression wow 💖 taste at per .. look much larger than any other home bakery cake size I have ordered till now.. highly recommended.. smooth delivery 💕", 
    textBn: "1st impression wow 💖 taste at per .. look much larger than any other home bakery cake size I have ordered till now.. highly recommended.. smooth delivery 💕", 
    source: "facebook", timeEn: "1 year ago", timeBn: "১ বছর আগে",
    recommends: true
  },
  { 
    nameEn: "Meruna Subhadeep Nej", nameBn: "মেরুনা শুভদীপ নেজ", rating: 5, 
    textEn: "Highly recommend 🔥 everything was perfect 🥰 decoration, test ,all was amazing 👏 keep it up Muskaan", 
    textBn: "Highly recommend 🔥 everything was perfect 🥰 decoration, test ,all was amazing 👏 keep it up Muskaan", 
    source: "facebook", timeEn: "1 year ago", timeBn: "১ বছর আগে",
    recommends: true
  }
];

let content = fs.readFileSync('src/constants/data.ts', 'utf8');
content = content.replace(/export const facebookReviewsData: Review\[\] = \[[\s\S]*?\];/g, `export const facebookReviewsData: Review[] = ${JSON.stringify(facebookReviews, null, 2)};`);
fs.writeFileSync('src/constants/data.ts', content);
