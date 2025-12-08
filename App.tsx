import React, { useState, useEffect, useMemo } from 'react';
import { Member, Expense, Group } from './types';
import { calculateBalances, calculateSettlements } from './utils';
import { Dashboard } from './components/Dashboard';
import { MembersManager } from './components/MembersManager';
import { AddExpense } from './components/AddExpense';
import { SettleUp } from './components/SettleUp';
import { ExpenseList } from './components/ExpenseList';
import { SettlementPlan } from './components/SettlementPlan';
import { GroupSelector } from './components/GroupSelector';
import { LayoutGrid, Users, BarChart3, History, PlusCircle, Banknote, LogOut, Home, Loader2, ArrowRight, Lock, KeyRound, AlertCircle, Hash, Trash2, AlertTriangle, X } from 'lucide-react';

// Firebase Imports
import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    where, 
    writeBatch,
    getDoc,
    setDoc
} from 'firebase/firestore';

type Tab = 'dashboard' | 'add_expense' | 'settle_up' | 'history' | 'roommates';

const App: React.FC = () => {
  // --- Auth / Room State ---
  const [roomId, setRoomId] = useState<string>(() => localStorage.getItem('chelavukal_roomId') || '');
  const [tempRoomId, setTempRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [authMode, setAuthMode] = useState<'join' | 'create'>('join');
  const [authError, setAuthError] = useState('');

  // --- App State ---
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeGroupId, setActiveGroupId] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  // --- Data State (Synced from Firestore) ---
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Real-time Data Sync ---
  useEffect(() => {
    if (!roomId) return;

    setLoading(true);

    // 1. Members Listener
    const membersQ = query(collection(db, 'members'), where('roomId', '==', roomId));
    const unsubMembers = onSnapshot(membersQ, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(data);
    });

    // 2. Groups Listener
    const groupsQ = query(collection(db, 'groups'), where('roomId', '==', roomId));
    const unsubGroups = onSnapshot(groupsQ, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
        setGroups(data);
    });

    // 3. Expenses Listener
    const expensesQ = query(collection(db, 'expenses'), where('roomId', '==', roomId));
    const unsubExpenses = onSnapshot(expensesQ, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setExpenses(data);
        setLoading(false);
    });

    return () => {
        unsubMembers();
        unsubGroups();
        unsubExpenses();
    };
  }, [roomId]);

  // --- Actions (Firebase) ---

  const handleJoinRoom = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      if (!tempRoomId.trim() || !password.trim()) return;
      
      setIsJoining(true);
      const cleanId = tempRoomId.trim().toUpperCase();

      try {
          const roomRef = doc(db, 'rooms', cleanId);
          const roomSnap = await getDoc(roomRef);

          if (!roomSnap.exists()) {
              setAuthError('Room not found. Please check the code.');
              setIsJoining(false);
              return;
          }

          const roomData = roomSnap.data();
          if (roomData.password !== password) {
              setAuthError('Incorrect password.');
              setIsJoining(false);
              return;
          }

          // Success
          localStorage.setItem('chelavukal_roomId', cleanId);
          setRoomId(cleanId);
      } catch (err) {
          console.error("Join Error:", err);
          setAuthError('Connection failed. Please try again.');
      } finally {
          setIsJoining(false);
      }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      if (!tempRoomId.trim()) {
          setAuthError('Please enter a House Code.');
          return;
      }
      if (!password.trim()) {
          setAuthError('Please set a password.');
          return;
      }

      setIsJoining(true);
      const cleanId = tempRoomId.trim().toUpperCase();

      try {
          // Check if room ID already exists
          const roomRef = doc(db, 'rooms', cleanId);
          const roomSnap = await getDoc(roomRef);

          if (roomSnap.exists()) {
              setAuthError(`House Code '${cleanId}' is already taken. Try another.`);
              setIsJoining(false);
              return;
          }

          // Create the room document with password
          await setDoc(doc(db, 'rooms', cleanId), {
              password: password,
              createdAt: Date.now()
          });
          
          localStorage.setItem('chelavukal_roomId', cleanId);
          setRoomId(cleanId);
      } catch (err) {
          console.error("Create Error:", err);
          setAuthError('Failed to create room.');
          setIsJoining(false);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('chelavukal_roomId');
      setRoomId('');
      setMembers([]);
      setGroups([]);
      setExpenses([]);
      setActiveTab('dashboard');
      setAuthMode('join');
      setTempRoomId('');
      setPassword('');
      setAuthError('');
  };

  const confirmDeleteRoom = async () => {
      if (!roomId) return;
      if (!deletePassword) {
          alert("Please enter the password.");
          return;
      }

      setLoading(true);

      try {
          // 1. Verify Password
          const roomRef = doc(db, 'rooms', roomId);
          const roomSnap = await getDoc(roomRef);

          if (!roomSnap.exists()) {
              alert("Room record not found.");
              setLoading(false);
              return;
          }

          if (roomSnap.data().password !== deletePassword) {
              alert("Incorrect password.");
              setLoading(false);
              return;
          }

          // 2. Batch Delete with chunking (Firestore limit is 500 ops per batch)
          // We need to delete expenses, members, groups, and the room itself.
          
          const allDeletions = [
              ...expenses.map(e => ({ type: 'expenses', id: e.id })),
              ...members.map(m => ({ type: 'members', id: m.id })),
              ...groups.map(g => ({ type: 'groups', id: g.id })),
          ];

          // Chunk array into size of 499 (leaving room for room delete in last batch if needed)
          const chunkSize = 490;
          const chunks = [];
          for (let i = 0; i < allDeletions.length; i += chunkSize) {
              chunks.push(allDeletions.slice(i, i + chunkSize));
          }

          // Process chunks
          for (const chunk of chunks) {
              const batch = writeBatch(db);
              chunk.forEach(item => {
                  batch.delete(doc(db, item.type, item.id));
              });
              await batch.commit();
          }

          // Finally delete the room
          await deleteDoc(roomRef);
          
          // Logout
          setShowDeleteModal(false);
          setDeletePassword('');
          handleLogout();
          
      } catch (error) {
          console.error("Error deleting room:", error);
          alert("An error occurred while deleting the room.");
      } finally {
          setLoading(false);
      }
  };

  const createGroup = async (name: string) => {
      try {
          await addDoc(collection(db, 'groups'), {
              name,
              roomId
          });
      } catch (e) {
          console.error("Error adding group: ", e);
      }
  };

  const deleteGroup = async (id: string) => {
      try {
          // 1. Delete the group doc
          await deleteDoc(doc(db, 'groups', id));
          
          // 2. Delete all expenses in that group
          const groupExpenses = expenses.filter(e => e.groupId === id);
          
          // Chunking for group deletion if needed (simplified here assuming <500 expenses per group usually)
          const batch = writeBatch(db);
          groupExpenses.forEach(exp => {
              const ref = doc(db, 'expenses', exp.id);
              batch.delete(ref);
          });
          await batch.commit();

          setActiveGroupId('all');
      } catch (e) {
          console.error("Error deleting group: ", e);
      }
  };

  const addMember = async (name: string) => {
      try {
          await addDoc(collection(db, 'members'), {
              name,
              roomId
          });
      } catch (e) {
          console.error("Error adding member: ", e);
      }
  };

  const removeMember = async (id: string) => {
      const isUsed = expenses.some(e => e.payerId === id || e.sharedByIds.includes(id));
      if (isUsed) {
          alert("Cannot remove this person because they are part of existing expenses. Delete the expenses first.");
          return;
      }
      try {
          await deleteDoc(doc(db, 'members', id));
      } catch (e) {
          console.error("Error removing member: ", e);
      }
  };

  const addExpense = async (title: string, amount: number, payerId: string, sharedByIds: string[], type: 'expense' | 'settlement' = 'expense', groupId: string) => {
      try {
          await addDoc(collection(db, 'expenses'), {
              title,
              amount,
              payerId,
              sharedByIds,
              date: Date.now(),
              type,
              groupId,
              roomId
          });
          setActiveTab('history');
      } catch (e) {
          console.error("Error adding expense: ", e);
      }
  };

  const handleSettleUp = (payerId: string, receiverId: string, amount: number) => {
      const gid = activeGroupId === 'all' ? 'general' : activeGroupId;
      addExpense('Settlement', amount, payerId, [receiverId], 'settlement', gid);
  };

  const deleteExpense = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'expenses', id));
      } catch (e) {
          console.error("Error deleting expense: ", e);
      }
  };

  // --- Derived Calculations ---
  
  const displayGroups = useMemo(() => {
      // Ensure 'General' is always present and first, effectively acting as a virtual group if not in DB
      const generalGroup = { id: 'general', name: 'General' };
      // Filter out 'general' if it exists in DB to prevent duplicates
      const otherGroups = groups.filter(g => g.id !== 'general');
      return [generalGroup, ...otherGroups];
  }, [groups]);

  const filteredExpenses = useMemo(() => {
      if (activeGroupId === 'all') return expenses;
      return expenses.filter(e => e.groupId === activeGroupId);
  }, [expenses, activeGroupId]);

  const balances = useMemo(() => calculateBalances(members, filteredExpenses), [members, filteredExpenses]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);

  // --- Sub-components for Tabs ---

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors border-b-2
        ${activeTab === id 
          ? 'border-olive-800 text-olive-900 bg-olive-50/50' 
          : 'border-transparent text-olive-600 hover:text-olive-800 hover:bg-olive-50/30'
        }
      `}
    >
      <Icon size={16} className={activeTab === id ? 'text-olive-800' : 'text-olive-500'} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden text-xs">{label.split(' ')[0]}</span>
    </button>
  );

  const MobileTabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform
        ${activeTab === id ? 'text-olive-900' : 'text-olive-500 hover:text-olive-700'}
      `}
    >
      <div className={`p-1 rounded-full ${activeTab === id ? 'bg-olive-100' : ''}`}>
        <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
      </div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );

  // --- Login / Room Selection View ---
  if (!roomId) {
      return (
          <div className="min-h-screen bg-[#f4f7f2] flex flex-col items-center justify-center p-4">
              <div className="bg-olive-900 p-3 rounded-xl shadow-lg mb-6 animate-in zoom-in duration-500">
                  <LayoutGrid className="text-olive-100" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-olive-900 mb-2 tracking-tight">Expense Splitter</h1>
              <p className="text-olive-600 mb-8 text-center max-w-xs">Smart shared expense tracking for any group.</p>
              
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-olive-200 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-olive-100">
                      <button 
                        onClick={() => {
                            setAuthMode('join');
                            setAuthError('');
                            setTempRoomId('');
                            setPassword('');
                        }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${authMode === 'join' ? 'bg-olive-50 text-olive-800 border-b-2 border-olive-800' : 'text-olive-400 hover:text-olive-600'}`}
                      >
                        Join House
                      </button>
                      <button 
                        onClick={() => {
                            setAuthMode('create');
                            setAuthError('');
                            setTempRoomId('');
                            setPassword('');
                        }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${authMode === 'create' ? 'bg-olive-50 text-olive-800 border-b-2 border-olive-800' : 'text-olive-400 hover:text-olive-600'}`}
                      >
                        Create New
                      </button>
                  </div>

                  <div className="p-6">
                    {/* Error Message */}
                    {authError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2 border border-red-100 animate-in slide-in-from-top-1">
                            <AlertCircle size={16} className="shrink-0" />
                            {authError}
                        </div>
                    )}

                    {authMode === 'join' ? (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                             <h2 className="text-lg font-bold text-olive-800 mb-4 flex items-center gap-2">
                                <Home size={18} />
                                Enter Credentials
                            </h2>
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-olive-600 mb-1">House Code</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={tempRoomId}
                                            onChange={(e) => setTempRoomId(e.target.value)}
                                            placeholder="e.g. 7A9X2B"
                                            className="w-full pl-10 pr-4 py-3 bg-olive-50 border border-olive-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-600 text-olive-900 font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-olive-300 transition-all"
                                            autoFocus
                                        />
                                        <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-olive-600 mb-1">Password</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••"
                                            className="w-full pl-10 pr-4 py-3 bg-olive-50 border border-olive-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-600 text-olive-900 placeholder:text-olive-300 transition-all"
                                        />
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!tempRoomId.trim() || !password.trim() || isJoining}
                                    className="w-full py-3 bg-olive-800 hover:bg-olive-900 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                                >
                                    {isJoining ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            Join House
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                             <h2 className="text-lg font-bold text-olive-800 mb-2 flex items-center gap-2">
                                <PlusCircle size={18} />
                                Setup New House
                            </h2>
                            <p className="text-xs text-olive-500 mb-4">
                                Create your own unique House Code and Password to share with roommates.
                            </p>

                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-olive-600 mb-1">Create House Code</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={tempRoomId}
                                            onChange={(e) => setTempRoomId(e.target.value)}
                                            placeholder="e.g. OURHOME"
                                            className="w-full pl-10 pr-4 py-3 bg-olive-50 border border-olive-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-600 text-olive-900 font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-olive-300 transition-all"
                                            autoFocus
                                        />
                                        <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
                                    </div>
                                    <p className="text-[10px] text-olive-400 mt-1 ml-1">Must be unique.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-olive-600 mb-1">Set Password</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a password"
                                            className="w-full pl-10 pr-4 py-3 bg-olive-50 border border-olive-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-600 text-olive-900 placeholder:text-olive-300 transition-all"
                                        />
                                        <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-400" />
                                    </div>
                                    <p className="text-[10px] text-olive-400 mt-1 ml-1">Roommates will need this to join.</p>
                                </div>
                                
                                <button 
                                    type="submit"
                                    disabled={!tempRoomId.trim() || !password.trim() || isJoining}
                                    className="w-full py-3 bg-olive-700 hover:bg-olive-800 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-2"
                                >
                                    {isJoining ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            Create House
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                  </div>
              </div>
              
              <p className="mt-8 text-xs text-olive-400 font-medium opacity-60">
                 Secure • Cloud Sync • Real-time
              </p>
          </div>
      );
  }

  // --- Main App View ---
  return (
    <div className="min-h-screen font-sans selection:bg-olive-200 bg-[#f4f7f2]">
      
      {/* Header */}
      <header className="bg-white border-b border-olive-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-olive-800 text-white p-1.5 rounded-lg shadow-sm">
                  <LayoutGrid size={18} />
              </div>
              <h1 className="text-lg font-bold text-olive-900 tracking-tight hidden xs:block">Expense Splitter</h1>
              <div className="bg-olive-100 text-olive-800 text-[10px] font-bold px-2 py-0.5 rounded border border-olive-200 uppercase tracking-wider flex items-center gap-1">
                  <span>{roomId}</span>
                  <Lock size={10} className="text-olive-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        setShowDeleteModal(true);
                        setDeletePassword('');
                    }}
                    className="p-2 text-olive-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Room Permanently"
                >
                    <Trash2 size={18} />
                </button>
                <div className="h-4 w-px bg-olive-200"></div>
                <button 
                    onClick={handleLogout}
                    className="text-olive-500 hover:text-olive-800 hover:bg-olive-50 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                    title="Logout / Change Room"
                >
                    <span className="hidden sm:inline">Change Room</span>
                    <LogOut size={16} />
                </button>
            </div>
          </div>
        </div>
        
        {/* Group Selector Bar */}
        <GroupSelector 
            groups={displayGroups} 
            activeGroupId={activeGroupId} 
            onSelectGroup={setActiveGroupId} 
            onCreateGroup={createGroup}
            onDeleteGroup={deleteGroup}
        />

        {/* Desktop Tabs Navigation (Hidden on Mobile) */}
        <div className="max-w-4xl mx-auto px-4 hidden sm:block">
            <nav className="flex w-full overflow-x-auto no-scrollbar -mb-px">
                <TabButton id="dashboard" label="Dashboard" icon={BarChart3} />
                <TabButton id="add_expense" label="Add Expense" icon={PlusCircle} />
                <TabButton id="settle_up" label="Settle Up" icon={Banknote} />
                <TabButton id="history" label="History" icon={History} />
                <TabButton id="roommates" label="People" icon={Users} />
            </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8 pb-24 sm:pb-8">
        
        {loading && (
            <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-olive-500" size={32} />
            </div>
        )}

        {!loading && (
            <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Dashboard balances={balances} members={members} />
                    <SettlementPlan settlements={settlements} members={members} />
                </div>
                )}

                {/* Add Expense Tab */}
                {activeTab === 'add_expense' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AddExpense 
                        members={members} 
                        groups={displayGroups}
                        activeGroupId={activeGroupId}
                        onAddExpense={addExpense} 
                    />
                </div>
                )}

                {/* Settle Up Tab */}
                {activeTab === 'settle_up' && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SettleUp members={members} onSettleUp={handleSettleUp} />
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ExpenseList 
                        expenses={filteredExpenses} 
                        members={members}
                        groups={displayGroups}
                        onDeleteExpense={deleteExpense}
                    />
                </div>
                )}

                {/* Roommates Tab */}
                {activeTab === 'roommates' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MembersManager 
                    members={members} 
                    expenses={filteredExpenses}
                    onAddMember={addMember} 
                    onRemoveMember={removeMember}
                    />
                </div>
                )}
            </>
        )}

      </main>

      {/* Mobile Bottom Navigation (Visible only on Mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-olive-200 z-50 pb-safe">
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
            <MobileTabButton id="dashboard" label="Home" icon={BarChart3} />
            <MobileTabButton id="history" label="History" icon={History} />
            <MobileTabButton id="add_expense" label="Add" icon={PlusCircle} />
            <MobileTabButton id="settle_up" label="Settle" icon={Banknote} />
            <MobileTabButton id="roommates" label="People" icon={Users} />
        </div>
      </nav>

      {/* Delete Room Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Delete Room Permanently</h3>
                        <p className="text-sm text-red-700 mt-1">
                            This action cannot be undone. All expenses, people, and groups associated with room <span className="font-mono font-bold bg-red-100 px-1 rounded">{roomId}</span> will be erased immediately.
                        </p>
                    </div>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Verify Password
                        </label>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter room password to confirm"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-gray-900"
                            autoFocus
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                        <button 
                            onClick={() => {
                                setShowDeleteModal(false);
                                setDeletePassword('');
                            }}
                            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDeleteRoom}
                            disabled={!deletePassword || loading}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    <Trash2 size={18} />
                                    Delete Room
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;