import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Coins, 
  User, 
  Moon, 
  Sun, 
  RotateCcw, 
  Terminal, 
  Zap,
  ShieldCheck,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  X,
  Save,
  Database
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  where,
  writeBatch
} from 'firebase/firestore';
import { Assignment, AppState } from './types';

const ADMIN_SECRET = "callme4b3d1";
const ADMIN_STORAGE_KEY = 'money-number-admin-state';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    assignments: [],
    currentUser: '',
    isDarkMode: true,
    isAdmin: localStorage.getItem(ADMIN_STORAGE_KEY) === 'true',
    message: null,
    isGenerating: false,
  });
  
  const [inputName, setInputName] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener for Firebase assignments
  useEffect(() => {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assignmentsData: Assignment[] = [];
      snapshot.forEach((doc) => {
        assignmentsData.push({
          id: doc.id,
          ...doc.data()
        } as Assignment);
      });
      
      setState(prev => ({
        ...prev,
        assignments: assignmentsData
      }));
      
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to assignments:', error);
      setState(prev => ({
        ...prev,
        message: { 
          text: 'Error connecting to database. Please refresh.', 
          type: 'error' 
        }
      }));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save admin state to localStorage
  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, state.isAdmin.toString());
  }, [state.isAdmin]);

  const getGamerFortune = async (name: string, number: number): Promise<string> => {
    const fortunes = [
      `The digital winds favor your path, ${name}. Number ${number} aligns with quantum fortunes.`,
      `Cyberspace resonates at frequency ${number}. Your identity syncs with the money-grid.`,
      `Fortune ${number}: Code flows like currency. Your virtual wealth awaits.`,
      `Player ${name}, your algorithm converges on prosperity node ${number}.`,
      `The blockchain of destiny registers ${number} to your account. Hack the mainframe of luck.`,
      `Signal ${number} detected in the cyberstream. ${name}, your financial node is active.`,
      `Encryption key ${number} validates your wealth protocol, ${name}.`,
      `Neural link established. Number ${number} channels prosperity to ${name}.`,
      `Quantum ledger entry: ${name} allocated to fortune sector ${number}.`,
      `The matrix blesses ${name} with monetary frequency ${number}.`
    ];
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return fortunes[Math.floor(Math.random() * fortunes.length)];
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const handleGenerate = async () => {
    if (!inputName.trim()) {
      setState(prev => ({
        ...prev,
        message: { text: 'You must enter a name to proceed, Player 1.', type: 'error' }
      }));
      return;
    }

    const normalizedName = inputName.trim().toLowerCase();
    
    // Check if user already has a number (real-time data from Firebase)
    const existingUserAssignment = state.assignments.find(
      a => a.name.toLowerCase() === normalizedName
    );
    
    if (existingUserAssignment) {
      setState(prev => ({
        ...prev,
        message: { 
          text: `You already have number ${existingUserAssignment.number} assigned to you as your money number.`, 
          type: 'info' 
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, message: null }));

    // Generate random number between 1-9
    let rolledNumber: number;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      rolledNumber = Math.floor(Math.random() * 9) + 1;
      attempts++;
      
      // Safety check to prevent infinite loop
      if (attempts >= maxAttempts) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          message: { 
            text: 'All numbers (1-9) may be taken. Please check the Arena Log.', 
            type: 'error' 
          }
        }));
        return;
      }
    } while (state.assignments.some(a => a.number === rolledNumber));

    await new Promise(resolve => setTimeout(resolve, 800));

    // Double-check in real-time before saving
    const existingNumberOwner = state.assignments.find(a => a.number === rolledNumber);
    
    if (existingNumberOwner) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: `Number ${rolledNumber} was just taken by ${existingNumberOwner.name}. Rolling again...`, 
          type: 'error' 
        }
      }));
      // Retry automatically
      setTimeout(() => handleGenerate(), 1000);
      return;
    }

    const fortune = await getGamerFortune(inputName.trim(), rolledNumber);

    const newAssignment: Assignment = {
      name: inputName.trim(),
      number: rolledNumber,
      timestamp: Date.now(),
      fortune
    };

    try {
      // Save to Firebase
      await addDoc(collection(db, 'assignments'), newAssignment);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: `Success! You rolled a ${rolledNumber}. Claim your destiny!`, 
          type: 'success' 
        }
      }));
      setInputName('');
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: 'Failed to save to database. Please try again.', 
          type: 'error' 
        }
      }));
    }
  };

  const verifyAdmin = () => {
    if (adminPassInput === ADMIN_SECRET) {
      setState(prev => ({ ...prev, isAdmin: true }));
      setShowAdminModal(false);
      setAdminPassInput('');
      setAdminError('');
    } else {
      setAdminError('ACCESS DENIED: INVALID CORE OVERRIDE CODE');
    }
  };

  const handleResetClick = async () => {
    if (!state.isAdmin) {
      setShowAdminModal(true);
      return;
    }
    
    if (confirm("ADMIN OVERRIDE: Purge all arena assignments from Firebase?")) {
      try {
        const batch = writeBatch(db);
        const assignmentsRef = collection(db, 'assignments');
        const snapshot = await getDocs(assignmentsRef);
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        setState(prev => ({
          ...prev,
          message: { 
            text: 'Arena purged. All slots now available. Database cleared.', 
            type: 'neutral' 
          }
        }));
        setInputName('');
      } catch (error) {
        console.error('Error resetting database:', error);
        setState(prev => ({
          ...prev,
          message: { 
            text: 'Failed to reset database. Please try again.', 
            type: 'error' 
          }
        }));
      }
    }
  };

  const exportData = () => {
    const data = {
      assignments: state.assignments,
      exportDate: new Date().toISOString(),
      totalPlayers: state.assignments.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-number-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setState(prev => ({
      ...prev,
      message: { 
        text: `Data exported successfully (${state.assignments.length} players)`, 
        type: 'info' 
      }
    }));
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!state.isAdmin) {
      setShowAdminModal(true);
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (!importedData.assignments || !Array.isArray(importedData.assignments)) {
          throw new Error('Invalid data format');
        }
        
        if (confirm(`Import ${importedData.assignments.length} player(s)? This will replace current data in Firebase.`)) {
          // Clear existing data
          const batch = writeBatch(db);
          const assignmentsRef = collection(db, 'assignments');
          const snapshot = await getDocs(assignmentsRef);
          
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          
          // Add imported data
          for (const assignment of importedData.assignments) {
            const { id, ...assignmentData } = assignment;
            await addDoc(collection(db, 'assignments'), assignmentData);
          }
          
          setState(prev => ({
            ...prev,
            message: { 
              text: `Successfully imported ${importedData.assignments.length} player(s) to Firebase`, 
              type: 'success' 
            }
          }));
        }
      } catch (error) {
        console.error('Import error:', error);
        setState(prev => ({
          ...prev,
          message: { 
            text: 'Failed to import: Invalid file format or database error', 
            type: 'error' 
          }
        }));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-emerald-400 animate-spin" />
          <p className="text-sm uppercase tracking-widest">Connecting to Money-Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col items-center p-4 transition-all duration-500`}>
      
      {/* Background decoration */}
      <div className={`fixed inset-0 pointer-events-none opacity-10 overflow-hidden`}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center py-6 mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
            <Coins className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black font-display tracking-tighter uppercase italic">
              Get Your <span className="text-emerald-400">Money</span> Number
            </h1>
            {state.isAdmin && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                <Unlock className="w-3 h-3" /> System Admin Active
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
              <Database className="w-3 h-3" />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Firebase: {state.assignments.length} players synced
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {state.assignments.length > 0 && (
            <button 
              onClick={exportData}
              className={`p-2 rounded-full border ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'} ${state.isAdmin ? 'text-blue-400 border-blue-400/30' : ''}`}
              title="Export Data"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
          
          <label className={`p-2 rounded-full border ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'} ${state.isAdmin ? 'text-purple-400 border-purple-400/30 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`} title="Import Data">
            <input 
              type="file" 
              accept=".json" 
              onChange={importData} 
              className="hidden"
              disabled={!state.isAdmin}
            />
            <Database className="w-5 h-5" />
          </label>
          
          <button 
            onClick={() => state.isAdmin ? setState(s => ({...s, isAdmin: false})) : setShowAdminModal(true)}
            className={`p-2 rounded-full border ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'} ${state.isAdmin ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''}`}
            title={state.isAdmin ? "Logout Admin" : "Admin Login"}
          >
            {state.isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </button>
          <button 
            onClick={handleResetClick}
            className={`p-2 rounded-full border ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'} ${state.isAdmin ? 'text-rose-400 border-rose-400/30' : 'opacity-40 cursor-not-allowed'}`}
            title="Reset Arena (Admin Only)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full border ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}
          >
            {state.isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Input Section */}
        <section className={`p-8 rounded-2xl border ${state.isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl backdrop-blur-sm h-fit`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display uppercase tracking-widest mb-2 flex items-center gap-2">
              <Terminal className="text-emerald-400 w-5 h-5" /> Player Input
            </h2>
            <p className="text-sm opacity-60">Synchronize your identity to the money-grid.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase font-bold tracking-widest mb-2 opacity-70">Codename / Real Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input 
                  type="text" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. Neo or Alice"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-bold ${
                    state.isDarkMode 
                      ? 'bg-slate-950 border-slate-800 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !inputName.trim()}
              className={`w-full py-4 rounded-xl font-black font-display uppercase tracking-widest text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-xl ${
                !inputName.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
              }`}
            >
              {state.isGenerating ? (
                <>
                  <Zap className="animate-spin w-5 h-5" /> Rerolling Reality...
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5" /> Generate Number
                </>
              )}
            </button>

            {state.message && (
              <div className={`p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                state.message.type === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                state.message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                state.message.type === 'neutral' ? 'bg-slate-500/10 border border-slate-500/30 text-slate-400' :
                'bg-blue-500/10 border border-blue-500/30 text-blue-400'
              }`}>
                {state.message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 flex-shrink-0" />}
                <p className="text-sm font-semibold">{state.message.text}</p>
              </div>
            )}
          </div>
        </section>

        {/* History / Leaderboard Section */}
        <section className={`p-8 rounded-2xl border ${state.isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} shadow-2xl backdrop-blur-sm`}>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold font-display uppercase tracking-widest flex items-center gap-2">
              <Coins className="text-yellow-400 w-5 h-5" /> Arena Log
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 bg-slate-800 rounded-md font-mono">{state.assignments.length}/9 Slots</span>
              {state.assignments.length > 0 && (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Live
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {state.assignments.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl opacity-40">
                <User className="w-8 h-8 mb-2" />
                <p className="text-sm uppercase tracking-widest italic">No players joined yet</p>
                <p className="text-xs opacity-50 mt-2">Real-time sync across all devices</p>
              </div>
            ) : (
              state.assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className={`p-4 rounded-xl border-l-4 animate-in slide-in-from-right-4 duration-300 flex items-center justify-between ${
                    state.isDarkMode ? 'bg-slate-950 border-emerald-500' : 'bg-slate-50 border-emerald-400 shadow-sm'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg uppercase tracking-tight">{assignment.name}</span>
                      <span className="text-[10px] opacity-40 font-mono">
                        {new Date(assignment.timestamp).toLocaleDateString()} {new Date(assignment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    {assignment.fortune && (
                      <p className={`text-xs italic ${state.isDarkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                        "{assignment.fortune}"
                      </p>
                    )}
                  </div>
                  <div className="ml-4 w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 shadow-lg shadow-emerald-500/10">
                    <span className="text-2xl font-black font-display text-emerald-400">{assignment.number}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {state.assignments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3" />
                <span>Real-time Firebase sync</span>
              </div>
              <button 
                onClick={() => {
                  if (state.isAdmin) {
                    handleResetClick();
                  } else {
                    setShowAdminModal(true);
                  }
                }}
                className="text-rose-400 hover:text-rose-300 text-xs"
              >
                {state.isAdmin ? 'Clear All Data' : 'Admin: Clear Data'}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Admin Authentication Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`w-full max-w-md p-8 rounded-2xl border-2 animate-in zoom-in-95 duration-200 ${
            state.isDarkMode ? 'bg-slate-900 border-slate-800 shadow-emerald-500/10 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display uppercase tracking-widest flex items-center gap-2">
                <KeyRound className="text-rose-400 w-5 h-5" /> Admin Verification
              </h2>
              <button onClick={() => {setShowAdminModal(false); setAdminError('');}} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest mb-4 opacity-60">Enter the secret Core Override Code to gain Admin privileges.</p>
                <input 
                  type="password"
                  autoFocus
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()}
                  placeholder="********"
                  className={`w-full px-4 py-3 rounded-xl border-2 font-mono text-center tracking-[0.5em] text-lg ${
                    state.isDarkMode 
                      ? 'bg-slate-950 border-slate-800 focus:border-rose-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-rose-500'
                  }`}
                />
                {adminError && <p className="text-rose-400 text-[10px] font-black uppercase mt-2 text-center animate-pulse">{adminError}</p>}
                <p className="text-[10px] opacity-20 mt-4 text-center italic uppercase">Hint: CALL</p>
              </div>

              <button 
                onClick={verifyAdmin}
                className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black font-display uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
              >
                Execute Authentication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-auto py-8 opacity-30 text-xs font-mono uppercase tracking-[0.2em] flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <p>Firebase Realtime • {state.assignments.length} players synced</p>
        </div>
        <div className="flex gap-4">
          <span>&copy; 2026 MONEY-GRID</span>
          <span>SYSTEM: ONLINE</span>
        </div>
        <div className="flex gap-4">
          <p>Powered by Ab3d1</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
