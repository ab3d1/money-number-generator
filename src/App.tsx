import React, { useState } from 'react';
import { Assignment, AppState } from './types';
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
  X
} from 'lucide-react';

const ADMIN_SECRET = "CYBER_ADMIN_2025";

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    assignments: [],
    currentUser: '',
    isDarkMode: true,
    isAdmin: false,
    message: null,
    isGenerating: false,
  });

  const [inputName, setInputName] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const getGamerFortune = async (name: string, number: number): Promise<string> => {
    // Local fortunes - no API needed
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
    
    const existingUserAssignment = state.assignments.find(a => a.name.toLowerCase() === normalizedName);
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

    const rolledNumber = Math.floor(Math.random() * 9) + 1;

    const existingNumberOwner = state.assignments.find(a => a.number === rolledNumber);
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (existingNumberOwner) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: `User ${existingNumberOwner.name} already has this money number. Try your luck again!`, 
          type: 'error' 
        }
      }));
      return;
    }

    const fortune = await getGamerFortune(inputName, rolledNumber);

    const newAssignment: Assignment = {
      name: inputName.trim(),
      number: rolledNumber,
      timestamp: Date.now(),
      fortune
    };

    setState(prev => ({
      ...prev,
      isGenerating: false,
      assignments: [newAssignment, ...prev.assignments],
      message: { 
        text: `Success! You rolled a ${rolledNumber}. Claim your destiny!`, 
        type: 'success' 
      }
    }));
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_SECRET) {
      setState(prev => ({ ...prev, isAdmin: true }));
      setShowAdminModal(false);
      setAdminPassInput('');
      setAdminError('');
    } else {
      setAdminError('ACCESS DENIED: INVALID CORE OVERRIDE CODE');
    }
  };

  const handleResetClick = () => {
    if (!state.isAdmin) {
      setShowAdminModal(true);
      return;
    }
    
    if (confirm("ADMIN OVERRIDE: Purge all arena assignments?")) {
      setState(prev => ({
        ...prev,
        assignments: [],
        message: { text: 'Arena purged. All slots now available.', type: 'neutral' }
      }));
      setInputName('');
    }
  };

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
          </div>
        </div>
        <div className="flex gap-2">
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
                  placeholder="e.g. Neo or Alice"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-bold gamer-glow ${
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

            {/* Message Display */}
            {state.message && (
              <div className={`p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                state.message.type === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                state.message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
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
            <span className="text-xs px-2 py-1 bg-slate-800 rounded-md font-mono">{state.assignments.length}/9 Slots</span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {state.assignments.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl opacity-40">
                <User className="w-8 h-8 mb-2" />
                <p className="text-sm uppercase tracking-widest italic">No players joined yet</p>
              </div>
            ) : (
              state.assignments.map((assignment, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border-l-4 animate-in slide-in-from-right-4 duration-300 flex items-center justify-between ${
                    state.isDarkMode ? 'bg-slate-950 border-emerald-500' : 'bg-slate-50 border-emerald-400 shadow-sm'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg uppercase tracking-tight">{assignment.name}</span>
                      <span className="text-[10px] opacity-40 font-mono">{new Date(assignment.timestamp).toLocaleTimeString()}</span>
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
            
            <form onSubmit={verifyAdmin} className="space-y-6">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest mb-4 opacity-60">Enter the secret Core Override Code to gain Admin privileges.</p>
                <input 
                  type="password"
                  autoFocus
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="********"
                  className={`w-full px-4 py-3 rounded-xl border-2 font-mono text-center tracking-[0.5em] text-lg gamer-glow ${
                    state.isDarkMode 
                      ? 'bg-slate-950 border-slate-800 focus:border-rose-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-rose-500'
                  }`}
                />
                {adminError && <p className="text-rose-400 text-[10px] font-black uppercase mt-2 text-center animate-pulse">{adminError}</p>}
                <p className="text-[10px] opacity-20 mt-4 text-center italic uppercase">Hint: CYBER_ADMIN_2025</p>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black font-display uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
              >
                Execute Authentication
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="mt-auto py-8 opacity-30 text-xs font-mono uppercase tracking-[0.2em] flex flex-col items-center gap-2">
        <p>Terminal v2.6.0-Admin // Secure Channel</p>
        <p>Powered by Ab3d1</p>
        <div className="flex gap-4">
          <span>&copy; 2026 MONEY-GRID</span>
          <span>SYSTEM: ONLINE</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>
    </div>
  );
};

export default App;
