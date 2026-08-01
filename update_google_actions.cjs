const fs = require('fs');

let content = fs.readFileSync('src/components/CelebrationsModal.tsx', 'utf8');

const targetHoliday = `                           <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-blue-500" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{holiday.summary}</p>
                               <p className="text-[10px] font-medium text-slate-500">{new Date(holiday.start?.date || holiday.start?.dateTime).toLocaleDateString()}</p>
                             </div>
                           </div>
                        </div>`;

const replacementHoliday = `                           <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-blue-500 shrink-0" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{holiday.summary}</p>
                               <p className="text-[10px] font-medium text-slate-500">{new Date(holiday.start?.date || holiday.start?.dateTime).toLocaleDateString()}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-1">
                             <button 
                               onClick={() => {
                                 const newEvent = {
                                   id: holiday.id || 'h_' + Math.random(),
                                   personName: holiday.summary,
                                   relationship: 'Holiday',
                                   date: (holiday.start?.date || holiday.start?.dateTime || '').split('T')[0],
                                   type: 'other',
                                   notes: 'Imported from Google Calendar',
                                   isGoogleCalendar: true
                                 };
                                 const updated = [...celebrations, newEvent];
                                 setCelebrations(updated);
                                 saveStoredCelebrations(updated);
                                 setToast({ message: 'Saved to Dates!', visible: true });
                                 setTimeout(() => setToast({ message: '', visible: false }), 2000);
                               }}
                               className="px-2 py-1 bg-white/50 dark:bg-slate-800 rounded shadow-sm text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                             >
                               Save
                             </button>
                             {onOrderForCelebration && (
                               <button 
                                 onClick={() => {
                                   onOrderForCelebration({
                                     id: holiday.id, personName: holiday.summary, relationship: 'Holiday', date: (holiday.start?.date || holiday.start?.dateTime || '').split('T')[0], type: 'other', notes: 'Google Holiday'
                                   });
                                   onClose();
                                 }}
                                 className="px-2 py-1 bg-pink-500 text-white rounded shadow-sm text-[10px] font-bold hover:bg-pink-600 transition-colors"
                               >
                                 Order
                               </button>
                             )}
                           </div>
                        </div>`;

content = content.replace(targetHoliday, replacementHoliday);

const targetTask = `                           <div className="flex items-center gap-2">
                             <ListTodo size={14} className="text-emerald-500" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.title}</p>
                               {task.due && <p className="text-[10px] font-medium text-slate-500">Due: {new Date(task.due).toLocaleDateString()}</p>}
                             </div>
                           </div>
                        </div>`;

const replacementTask = `                           <div className="flex items-center gap-2">
                             <ListTodo size={14} className="text-emerald-500 shrink-0" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{task.title}</p>
                               {task.due && <p className="text-[10px] font-medium text-slate-500">Due: {new Date(task.due).toLocaleDateString()}</p>}
                             </div>
                           </div>
                           <div className="flex items-center gap-1 shrink-0">
                             <button 
                               onClick={() => {
                                 const newEvent = {
                                   id: task.id || 't_' + Math.random(),
                                   personName: task.title,
                                   relationship: 'Task',
                                   date: task.due ? task.due.split('T')[0] : new Date().toISOString().split('T')[0],
                                   type: 'other',
                                   notes: 'Imported from Google Tasks',
                                   isGoogleCalendar: true
                                 };
                                 const updated = [...celebrations, newEvent];
                                 setCelebrations(updated);
                                 saveStoredCelebrations(updated);
                                 setToast({ message: 'Saved to Dates!', visible: true });
                                 setTimeout(() => setToast({ message: '', visible: false }), 2000);
                               }}
                               className="px-2 py-1 bg-white/50 dark:bg-slate-800 rounded shadow-sm text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                             >
                               Save
                             </button>
                             {onOrderForCelebration && (
                               <button 
                                 onClick={() => {
                                   onOrderForCelebration({
                                     id: task.id, personName: task.title, relationship: 'Task', date: task.due ? task.due.split('T')[0] : new Date().toISOString().split('T')[0], type: 'other', notes: 'Google Task'
                                   });
                                   onClose();
                                 }}
                                 className="px-2 py-1 bg-pink-500 text-white rounded shadow-sm text-[10px] font-bold hover:bg-pink-600 transition-colors"
                               >
                                 Order
                               </button>
                             )}
                           </div>
                        </div>`;

content = content.replace(targetTask, replacementTask);

// Add setToast to CelebrationsModal if it doesn't exist
if (!content.includes('const [toast, setToast]')) {
  content = content.replace(
    'const [taskSyncingId, setTaskSyncingId] = useState<string | null>(null);',
    'const [taskSyncingId, setTaskSyncingId] = useState<string | null>(null);\n  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});'
  );
  
  // Add Toast render logic
  const renderToast = `
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
  `;
  content = content.replace('</AnimatePresence>\n);', '</AnimatePresence>\n' + renderToast + '\n);');
}

fs.writeFileSync('src/components/CelebrationsModal.tsx', content);
