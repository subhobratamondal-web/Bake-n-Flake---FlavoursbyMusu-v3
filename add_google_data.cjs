const fs = require('fs');

let content = fs.readFileSync('src/components/CelebrationsModal.tsx', 'utf8');

// 1. Add states for google tasks and holidays
const targetStates = `  const [taskSyncingId, setTaskSyncingId] = useState<string | null>(null);`;
const replacementStates = `  const [taskSyncingId, setTaskSyncingId] = useState<string | null>(null);
  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [googleHolidays, setGoogleHolidays] = useState<any[]>([]);
  const [isFetchingGoogleData, setIsFetchingGoogleData] = useState(false);
`;
content = content.replace(targetStates, replacementStates);

// 2. Add fetch logic
const fetchLogic = `
  const fetchGoogleData = async () => {
    const token = getAccessToken();
    if (!token) return;
    setIsFetchingGoogleData(true);
    try {
      // Fetch Indian Holidays from Google Calendar
      const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?timeMin=' + new Date().toISOString() + '&maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        setGoogleHolidays(calData.items || []);
      }

      // Fetch Task Lists
      const tlRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (tlRes.ok) {
        const tlData = await tlRes.json();
        const lists = tlData.items || [];
        let allTasks = [];
        for (const list of lists.slice(0, 2)) {
           const tRes = await fetch(\`https://tasks.googleapis.com/tasks/v1/lists/\${list.id}/tasks?showCompleted=false&maxResults=5\`, {
             headers: { Authorization: \`Bearer \${token}\` }
           });
           if (tRes.ok) {
             const tData = await tRes.json();
             allTasks = [...allTasks, ...(tData.items || [])];
           }
        }
        setGoogleTasks(allTasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingGoogleData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGoogleData();
    }
  }, [isOpen]);
`;

content = content.replace(`  useEffect(() => {
    if (isOpen) {
      setCelebrations(getStoredCelebrations());
    }
  }, [isOpen]);`, `  useEffect(() => {
    if (isOpen) {
      setCelebrations(getStoredCelebrations());
    }
  }, [isOpen]);\n${fetchLogic}`);

content = content.replace(`        setGcalMsg(lang === 'en' ? 'Google Account connected! Google Calendar & Tasks sync is ready.' : 'গুগল অ্যাকাউন্ট কানেক্ট হয়েছে! ক্যালেন্ডার ও টাস্ক সিঙ্ক প্রস্তুত।');`, `        setGcalMsg(lang === 'en' ? 'Google Account connected! Google Calendar & Tasks sync is ready.' : 'গুগল অ্যাকাউন্ট কানেক্ট হয়েছে! ক্যালেন্ডার ও টাস্ক সিঙ্ক প্রস্তুত।');\n        fetchGoogleData();`);

// 3. Render holidays and tasks at the bottom of the list
const targetRender = `              </div>
            )}
          </div>
        </motion.div>
      </div>`;

const replacementRender = `              </div>
            )}
            
            {/* Google Holidays & Tasks View */}
            {(googleHolidays.length > 0 || googleTasks.length > 0) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                      <path fill="#34A853" d="M7 10h5v5H7z"/>
                  </svg>
                  {lang === 'en' ? 'Live Google Workspace Sync' : 'গুগল ওয়ার্কস্পেস সিঙ্ক'}
                </h4>
                
                {googleHolidays.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase">Upcoming Indian Holidays</h5>
                    <div className="space-y-2">
                      {googleHolidays.map((holiday, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-blue-500" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{holiday.summary}</p>
                               <p className="text-[10px] font-medium text-slate-500">{new Date(holiday.start?.date || holiday.start?.dateTime).toLocaleDateString()}</p>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {googleTasks.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase">Your Google Tasks</h5>
                    <div className="space-y-2">
                      {googleTasks.map((task, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <ListTodo size={14} className="text-emerald-500" />
                             <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.title}</p>
                               {task.due && <p className="text-[10px] font-medium text-slate-500">Due: {new Date(task.due).toLocaleDateString()}</p>}
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </motion.div>
      </div>`;

content = content.replace(targetRender, replacementRender);

fs.writeFileSync('src/components/CelebrationsModal.tsx', content);
