const fs = require('fs');

let content = fs.readFileSync('src/components/CelebrationsModal.tsx', 'utf8');

const targetReturn = `    )}
  </AnimatePresence>

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold z-[100] shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
  
);`;

const replacementReturn = `    )}
  </AnimatePresence>

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold z-[100] shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
);`;

content = content.replace(targetReturn, replacementReturn);
content = content.replace('return (\n    <AnimatePresence>', 'return (\n    <>\n    <AnimatePresence>');

fs.writeFileSync('src/components/CelebrationsModal.tsx', content);
