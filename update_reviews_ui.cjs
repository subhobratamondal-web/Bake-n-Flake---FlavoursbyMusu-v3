const fs = require('fs');

let content = fs.readFileSync('src/components/Reviews.tsx', 'utf8');

// Replace the name display to include recommends
const target = `<h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                            {t.lang === 'en' ? review.nameEn : review.nameBn}
                          </h4>`;
const replacement = `<h4 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                            {t.lang === 'en' ? review.nameEn : review.nameBn}
                            {review.recommends && (
                              <span className="font-normal text-slate-600 dark:text-slate-300 ml-1">
                                {t.lang === 'en' ? 'recommends Bake n\\' Flake - FlavoursbyMusu.' : 'Bake n\\' Flake - FlavoursbyMusu কে রেকমেন্ড করেছেন।'}
                              </span>
                            )}
                          </h4>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/Reviews.tsx', content);
