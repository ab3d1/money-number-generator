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
import { db, assignmentsCollection } from './firebase';
import { 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  writeBatch,
  getDocs
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

  // Real-time listener for Firebase assignments - FIXED VERSION
  useEffect(() => {
    console.log('Connecting to Firestore...');
    
    const q = query(assignmentsCollection, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Firestore data received:', snapshot.size, 'documents');
        const assignments: Assignment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          assignments.push({ 
            id: doc.id, 
            name: data.name,
            number: data.number,
            timestamp: data.timestamp,
            fortune: data.fortune
          });
        });
        
        // ✅ Validate data integrity - no duplicate numbers
        const numbers = assignments.map(a => a.number);
        const uniqueNumbers = new Set(numbers);
        if (numbers.length !== uniqueNumbers.size) {
          console.error('❌ DATABASE CORRUPTION: Duplicate numbers detected!', assignments);
        }
        
        setState(prev => ({ 
          ...prev, 
          assignments 
        }));
        setIsLoading(false);
      }, 
      (error) => {
        console.error('Firestore connection error:', error);
        setState(prev => ({
          ...prev,
          message: { 
            text: 'Connection to database lost. Check Firebase config.', 
            type: 'error' 
          }
        }));
        setIsLoading(false);
      }
    );

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
        message: { text: '❌ You must enter a name to proceed, Player 1.', type: 'error' }
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
          text: `⚠️ You already have number ${existingUserAssignment.number} assigned.`, 
          type: 'info' 
        }
      }));
      setInputName(''); // Clear input after showing message
      return;
    }

    // ✅ CRITICAL: Check if all numbers 1-9 are already taken
    if (state.assignments.length >= 9) {
      setState(prev => ({
        ...prev,
        message: { 
          text: '❌ All numbers (1-9) are already taken! Admin must reset the arena.', 
          type: 'error' 
        }
      }));
      return;
    }

    // ✅ Validate data integrity - check for duplicates in current state
    const duplicateCheck = state.assignments.reduce((acc, curr) => {
      acc[curr.number] = (acc[curr.number] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const duplicates = Object.entries(duplicateCheck).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.error('❌ Duplicate numbers detected:', duplicates);
      setState(prev => ({
        ...prev,
        message: { 
          text: '⚠️ System error: Duplicate numbers detected. Please contact admin.', 
          type: 'error' 
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, message: null }));

    // ✅ Get ALL currently taken numbers
    const takenNumbers = state.assignments.map(a => a.number);
    
    // ✅ Create array of available numbers (1-9 minus taken ones)
    const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const availableNumbers = allNumbers.filter(num => !takenNumbers.includes(num));
    
    if (availableNumbers.length === 0) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: '❌ No numbers available. System error.', 
          type: 'error' 
        }
      }));
      return;
    }
    
    // ✅ Pick random from available numbers only
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const rolledNumber = availableNumbers[randomIndex];

    // Small delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    // ✅ Final check (in case Firestore updated during delay)
    const existingNumberOwner = state.assignments.find(a => a.number === rolledNumber);
    
    if (existingNumberOwner) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: `❌ Number ${rolledNumber} was just taken by ${existingNumberOwner.name}. Try again!`, 
          type: 'error' 
        }
      }));
      return;
    }

    const fortune = await getGamerFortune(inputName.trim(), rolledNumber);

    const newAssignment = {
      name: inputName.trim(),
      number: rolledNumber,
      timestamp: Date.now(),
      fortune
    };

    try {
      console.log('✅ Saving to Firestore:', newAssignment);
      await addDoc(assignmentsCollection, newAssignment);
      
      // SUCCESS
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: `✅ Success! Number ${rolledNumber} assigned to ${inputName.trim()}.`, 
          type: 'success' 
        }
      }));
      
      setInputName('');
      
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        message: { 
          text: '❌ Failed to save to database. Please try again.', 
          type: 'error' 
        }
      }));
    }
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === ADMIN_SECRET) {
      setState(prev => ({ ...prev, isAdmin: true }));
      setShowAdminModal(false);
      setAdminPassInput('');
      setAdminError('');
    } else {
      setAdminError('❌ ACCESS DENIED: INVALID CORE OVERRIDE CODE');
    }
  };

  const handleResetClick = async () => {
    if (!state.isAdmin) {
      setShowAdminModal(true);
      return;
    }
    
    if (confirm("⚠️ ADMIN OVERRIDE: Purge all arena assignments from Firebase?")) {
      try {
        const batch = writeBatch(db);
        const assignmentsRef = assignmentsCollection;
        const snapshot = await getDocs(assignmentsRef);
        
        if (snapshot.empty) {
          setState(prev => ({
            ...prev,
            message: { 
              text: 'ℹ️ Database is already empty.', 
              type: 'info' 
            }
          }));
          return;
        }
        
        snapshot.docs.forEach((document) => {
          batch.delete(doc(db, 'assignments', document.id));
        });
        
        await batch.commit();
        
        setState(prev => ({
          ...prev,
          message: { 
            text: `✅ Arena purged. ${snapshot.size} assignment(s) cleared from database.`, 
            type: 'neutral' 
          }
        }));
        setInputName('');
      } catch (error) {
        console.error('❌ Error resetting database:', error);
        setState(prev => ({
          ...prev,
          message: { 
            text: '❌ Failed to reset database. Please try again.', 
            type: 'error' 
          }
        }));
      }
    }
  };

  const exportData = () => {
    if (state.assignments.length === 0) {
      setState(prev => ({
        ...prev,
        message: { 
          text: 'ℹ️ No data to export.', 
          type: 'info' 
        }
      }));
      return;
    }
    
    const data = {
      assignments: state.assignments.map(a => ({
        name: a.name,
        number: a.number,
        timestamp: a.timestamp,
        fortune: a.fortune
      })),
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
        text: `✅ Data exported (${state.assignments.length} players)`, 
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
        
        // ✅ Check for duplicate numbers in imported data
        const importedNumbers = importedData.assignments.map((a: any) => a.number);
        const duplicateNumbers = importedNumbers.filter((num: number, index: number) => 
          importedNumbers.indexOf(num) !== index
        );
        
        if (duplicateNumbers.length > 0) {
          setState(prev => ({
            ...prev,
            message: { 
              text: `❌ Import failed: Contains duplicate numbers (${duplicateNumbers.join(', ')})`, 
              type: 'error' 
            }
          }));
          return;
        }
        
        if (confirm(`⚠️ Import ${importedData.assignments.length} player(s)? This will replace current data in Firebase.`)) {
          // Clear existing data first
          const batch = writeBatch(db);
          const snapshot = await getDocs(assignmentsCollection);
          
          snapshot.docs.forEach((document) => {
            batch.delete(doc(db, 'assignments', document.id));
          });
          
          await batch.commit();
          
          // Add imported data
          for (const assignment of importedData.assignments) {
            // Remove any existing ID and save clean data
            const { id, ...assignmentData } = assignment;
            await addDoc(assignmentsCollection, assignmentData);
          }
          
          setState(prev => ({
            ...prev,
            message: { 
              text: `✅ Imported ${importedData.assignments.length} player(s) successfully!`, 
              type: 'success' 
            }
          }));
        }
      } catch (error) {
        console.error('❌ Import error:', error);
        setState(prev => ({
          ...prev,
          message: { 
            text: '❌ Failed to import: Invalid file format', 
            type: 'error' 
          }
        }));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Calculate available numbers for display
  const getAvailableNumbers = () => {
    const takenNumbers = state.assignments.map(a => a.number);
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(num => !takenNumbers.includes(num));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-emerald-400 animate-spin" />
          <p className="text-sm uppercase tracking-widest">Connecting to Money-Grid...</p>
          <p className="text-xs text-slate-400">Initializing Firebase connection</p>
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
            <div className="flex items-center gap-3 mt-1">
              {state.isAdmin && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  <Unlock className="w-3 h-3" /> System Admin Active
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                <Database className="w-3 h-3" />
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-1"></span>
                {state.assignments.length} player(s) • {getAvailableNumbers().length} number(s) available
              </div>
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
                  onKeyDown={(e) => e.key === 'Enter' && !state.isGenerating && handleGenerate()}
                  placeholder="e.g. Neo or Alice"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 font-bold gamer-glow ${
                    state.isDarkMode 
                      ? 'bg-slate-950 border-slate-800 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                  }`}
                  disabled={state.isGenerating}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !inputName.trim()}
              className={`w-full py-4 rounded-xl font-black font-display uppercase tracking-widest text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-xl ${
                !inputName.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                  : state.isGenerating
                  ? 'bg-emerald-600 text-slate-950 shadow-emerald-500/20'
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
                {state.message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : 
                 state.message.type === 'success' ? <ShieldCheck className="w-5 h-5 flex-shrink-0" /> :
                 <ShieldCheck className="w-5 h-5 flex-shrink-0" />}
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
              <span className="text-xs px-2 py-1 bg-slate-800 rounded-md font-mono">
                {state.assignments.length}/9 Slots 
                <span className={`ml-1 ${getAvailableNumbers().length === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ({getAvailableNumbers().length} available)
                </span>
              </span>
              {state.assignments.length > 0 && (
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  LIVE SYNC
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
                  key={assignment.id || assignment.timestamp} 
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
          
          {/* Number Availability Display */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h3 className="text-sm uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Number Availability
            </h3>
            <div className="grid grid-cols-9 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                const isTaken = state.assignments.some(a => a.number === num);
                const takenBy = state.assignments.find(a => a.number === num);
                
                return (
                  <div 
                    key={num}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                      isTaken 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                    title={isTaken ? `Taken by ${takenBy?.name}` : 'Available'}
                  >
                    <span className="font-black text-sm">{num}</span>
                    <span className={`text-[8px] ${isTaken ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isTaken ? '✗' : '✓'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {getAvailableNumbers().length === 0 
                ? '❌ All numbers 1-9 are taken!' 
                : `${getAvailableNumbers().length} numbers still available`}
            </p>
          </div>
          
          {state.assignments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3" />
                <span>Firebase Realtime Sync Active</span>
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
                <p className="text-[10px] opacity-20 mt-4 text-center italic uppercase">Hint: CALL</p>
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
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <p>Firebase Realtime • {state.assignments.length} players synced • {getAvailableNumbers().length} numbers available</p>
        </div>
        <div className="flex gap-4">
          <span>&copy; 2026 MONEY-GRID</span>
          <span>SYSTEM: ONLINE</span>
        </div>
        <div className="flex gap-4">
          <p>Powered by Ab3d1</p>
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
        .gamer-glow:focus {
          box-shadow: 0 0 15px rgba(52, 211, 153, 0.5);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default App;
