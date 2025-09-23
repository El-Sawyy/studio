"use client"

import type { User } from 'firebase/compat/app';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { ChevronDown, LogOut, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { ThemeToggleButton } from '@/components/shared/theme-toggle-button';
import AdminDashboard from './admin-dashboard';
import AuditDashboard from './audit-dashboard';
import ModalManager from '@/components/shared/modal-manager';
import type { Agent, CoachingSession, PerformancePlan, Warning } from '@/lib/types';
import DashboardStats from '@/components/shared/dashboard-stats';
import { CoachingSectionForAdmin } from './coaching-section-for-admin';
import DocumentListItem from '@/components/shared/document-list-item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PerformanceDashboard from './performance-dashboard';


export default function AdminView({ user, userRole }: { user: User; userRole: string | null }) {
    const [view, setView] = useState('dashboard');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [plans, setPlans] = useState<PerformancePlan[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<{ isOpen: boolean; type: string; data: any; }>({ isOpen: false, type: '', data: null });
    const [agentDetailView, setAgentDetailView] = useState('coaching');
    const [coachFilter, setCoachFilter] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

    const agentsPath = `agents`;
    const getPlansPath = (agentId: string) => `agents/${agentId}/plans`;
    const getWarningsPath = (agentId: string) => `agents/${agentId}/warnings`;
    const getCoachingPath = (agentId: string) => `agents/${agentId}/coaching`;
    
    const groupedAgents = useMemo(() => {
        const groups = agents.reduce((acc, agent) => {
            const team = agent.team || 'Unassigned';
            if (!acc[team]) {
                acc[team] = [];
            }
            acc[team].push(agent);
            return acc;
        }, {} as Record<string, Agent[]>);
        return Object.keys(groups).sort().reduce((acc, key) => ({...acc, [key]: groups[key]}), {});
    }, [agents]);
    
    const toggleTeam = (teamName: string) => {
        setExpandedTeams(prev => ({...prev, [teamName]: !prev[teamName]}));
    };

    const filteredPlans = useMemo(() => {
        if (!plans) return [];
        return plans.filter(p => {
            const itemDate = new Date(p.startDate || p.date);
            return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        });
    }, [plans, selectedMonth, selectedYear]);

    const filteredWarnings = useMemo(() => {
        if (!warnings) return [];
        return warnings.filter(w => {
            const itemDate = new Date(w.date);
            return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        });
    }, [warnings, selectedMonth, selectedYear]);

    const filteredCoaching = useMemo(() => {
        if (!coachingSessions) return [];
        return coachingSessions.filter(c => {
            const itemDate = new Date(c.date);
            return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
        });
    }, [coachingSessions, selectedMonth, selectedYear]);
    
    useEffect(() => {
        const unsubscribe = db.collection(agentsPath).onSnapshot((snapshot) => {
            setAgents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent)));
            setIsLoading(false);
        }, (error) => console.error("Error fetching agents:", error));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedAgent) { 
            setPlans([]); 
            setWarnings([]);
            setCoachingSessions([]); 
            return; 
        }
        setCoachFilter('All');

        const unsubPlans = db.collection(getPlansPath(selectedAgent.id)).orderBy('startDate', 'desc').onSnapshot((snapshot) => setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PerformancePlan))));
        const unsubWarnings = db.collection(getWarningsPath(selectedAgent.id)).orderBy('date', 'desc').onSnapshot((snapshot) => setWarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warning))));
        const unsubCoaching = db.collection(getCoachingPath(selectedAgent.id)).orderBy('date', 'desc').onSnapshot((snapshot) => setCoachingSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoachingSession))));
        return () => { unsubPlans(); unsubWarnings(); unsubCoaching(); };
    }, [selectedAgent]);

    const handleSaveData = async (type: string, data: any) => {
        const collectionMap: Record<string, string> = {
            'plan': getPlansPath(selectedAgent!.id),
            'warning': getWarningsPath(selectedAgent!.id),
            'coaching': getCoachingPath(selectedAgent!.id),
            'agent': agentsPath,
        };
        if (!collectionMap[type] || (type !== 'agent' && !selectedAgent)) return;
        
        const collectionRef = db.collection(collectionMap[type]);
        try {
            const dataToSave = { ...data };
            const id = data.id;
            delete dataToSave.id;
            
            if (id) {
                 await collectionRef.doc(id).update({...dataToSave, lastModifiedBy: user.email});
            } else {
                 const docRef = await collectionRef.add({ ...dataToSave, createdBy: user.email, createdAt: new Date().toISOString() });
                 
                 if (['coaching', 'plan', 'warning'].includes(type) && selectedAgent) {
                     const newDate = new Date(dataToSave.date || dataToSave.startDate);
                     setSelectedMonth(newDate.getMonth());
                     setSelectedYear(newDate.getFullYear());
                     
                 }
            }
            closeModal();
        } catch (error) { console.error(`Error saving ${type}:`, error); }
    };

    const handleDelete = async (type: string, id: string) => {
       if (!selectedAgent) return;
        const collectionMap: Record<string, string> = {
            'plan': getPlansPath(selectedAgent.id),
            'warning': getWarningsPath(selectedAgent.id),
            'coaching': getCoachingPath(selectedAgent.id),
        };
       openModal('CONFIRM_DELETE', { 
           title: `Delete ${type}`,
           message: `Are you sure you want to delete this ${type}?`,
           onConfirm: async () => {
               await db.collection(collectionMap[type]).doc(id).delete();
               closeModal();
           }
       });
    };

    const handleDeleteAgent = (agent: Agent) => {
        openModal('CONFIRM_DELETE', {
            title: `Delete Agent: ${agent.name}`,
            message: `This will also delete all associated plans, warnings, and coaching sessions. This cannot be undone.`,
            onConfirm: async () => {
                const plansSnapshot = await db.collection(getPlansPath(agent.id)).get();
                await Promise.all(plansSnapshot.docs.map(doc => doc.ref.delete()));
                const warningsSnapshot = await db.collection(getWarningsPath(agent.id)).get();
                await Promise.all(warningsSnapshot.docs.map(doc => doc.ref.delete()));
                const coachingSnapshot = await db.collection(getCoachingPath(agent.id)).get();
                await Promise.all(coachingSnapshot.docs.map(doc => doc.ref.delete()));
                
                await db.collection(agentsPath).doc(agent.id).delete();
                if (selectedAgent?.id === agent.id) setSelectedAgent(null);
                closeModal();
            }
        });
    };
    
    const openModal = (type: string, data: any = null) => setModal({ isOpen: true, type, data });
    const closeModal = () => setModal({ isOpen: false, type: '', data: null });
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const allDocs = [...plans, ...warnings, ...coachingSessions];
    const years = [...new Set(allDocs.map(s => new Date(s.date || (s as PerformancePlan).startDate).getFullYear()))].sort((a,b) => b-a);
    if(years.length === 0) years.push(new Date().getFullYear());


    return (
         <div className="bg-background text-foreground min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-300">
              <aside className="w-full md:w-72 bg-card p-4 border-r border-border flex-shrink-0">
                  <div className="flex justify-between items-center mb-4">
                      <h1 className="text-xl font-bold text-card-foreground">Admin Tracker</h1>
                       <div className="flex items-center gap-2">
                           <ThemeToggleButton />
                           <Button onClick={() => auth.signOut()} title="Log Out" variant="ghost" size="icon"><LogOut className="h-5 w-5" /></Button>
                       </div>
                  </div>
                  <div className="flex flex-col space-y-2 mb-4">
                        <Button onClick={() => setView('dashboard')} variant={view === 'dashboard' ? 'secondary': 'ghost'} className="w-full justify-start">Dashboard</Button>
                        <Button onClick={() => setView('tracker')} variant={view === 'tracker' ? 'secondary': 'ghost'} className="w-full justify-start">Agents</Button>
                        <Button onClick={() => setView('performance')} variant={view === 'performance' ? 'secondary': 'ghost'} className="w-full justify-start">Performance</Button>
                        <Button onClick={() => setView('audits')} variant={view === 'audits' ? 'secondary': 'ghost'} className="w-full justify-start">Audits</Button>
                   </div>
                  {view === 'tracker' && (
                      <nav className="space-y-1 overflow-y-auto">
                          <Button onClick={() => openModal('EDIT_AGENT')} className="w-full mb-4">
                              <UserIcon className="mr-2 h-4 w-4" /> Add New Agent
                          </Button>
                          {isLoading ? <p>Loading agents...</p> : Object.keys(groupedAgents).map(teamName => (
                              <div key={teamName}>
                                  <button onClick={() => toggleTeam(teamName)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left font-semibold">
                                      <span>{teamName}</span>
                                      <ChevronDown className={`transform transition-transform ${expandedTeams[teamName] ? 'rotate-180' : ''}`} />
                                  </button>
                                  {expandedTeams[teamName] && (
                                      <div className="pl-4">
                                          {groupedAgents[teamName].map(agent => (
                                              <div key={agent.id} className={`group flex items-center justify-between p-2 rounded-lg ${selectedAgent?.id === agent.id ? 'bg-sidebar-primary/20 text-sidebar-primary-foreground' : 'hover:bg-muted'}`}>
                                                  <button onClick={() => setSelectedAgent(agent)} className="flex items-center gap-3 flex-grow text-left">
                                                      <UserIcon className="h-5 w-5"/>
                                                      <div>
                                                          <span className="font-semibold">{agent.name}</span>
                                                          <span className="text-xs text-muted-foreground block">ID: {agent.employeeId}</span>
                                                      </div>
                                                  </button>
                                                  <div className="flex opacity-0 group-hover:opacity-100">
                                                      <Button variant="ghost" size="icon" onClick={() => openModal('EDIT_AGENT', agent)} className="h-7 w-7 text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></Button>
                                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAgent(agent)} className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </nav>
                  )}
              </aside>
              <main className="flex-1 p-4 md:p-8 overflow-auto">
                  {view === 'dashboard' && <AdminDashboard agents={agents} setSelectedAgent={setSelectedAgent} setView={setView} setAgentDetailView={setAgentDetailView} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} setSelectedYear={setSelectedYear} setExpandedTeams={setExpandedTeams} openModal={openModal} />}
                  {view === 'audits' && <AuditDashboard agents={agents} user={user} />}
                  {view === 'performance' && <PerformanceDashboard agents={agents} setView={setView} setSelectedAgent={setSelectedAgent} setAgentDetailView={setAgentDetailView} setExpandedTeams={setExpandedTeams} />}
                  {view === 'tracker' && ( selectedAgent ? (
                      <div>
                          <header className="mb-8">
                              <h2 className="text-3xl font-bold text-foreground mb-1">{selectedAgent.name}'s Dashboard</h2>
                              <p className="text-muted-foreground">Employee ID: {selectedAgent.employeeId}</p>
                          </header>
                          <DashboardStats plans={plans} warnings={warnings} />
                          <div className="flex justify-end items-center gap-2 mb-4">
                            <span className="text-sm font-medium text-muted-foreground">Filter by month:</span>
                            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {months.map((month, i) => <SelectItem key={month} value={String(i)}>{month}</SelectItem>)}
                                </SelectContent>
                            </Select>
                          </div>

                          <div className="mb-6">
                            <div className="flex border rounded-md">
                                <Button onClick={() => setAgentDetailView('coaching')} variant={agentDetailView === 'coaching' ? 'default' : 'ghost'} className={`w-1/3 rounded-r-none`}>Coaching</Button>
                                <Button onClick={() => setAgentDetailView('plans')} variant={agentDetailView === 'plans' ? 'default' : 'ghost'} className={`w-1/3 rounded-none border-x`}>Plans</Button>
                                <Button onClick={() => setAgentDetailView('warnings')} variant={agentDetailView === 'warnings' ? 'default' : 'ghost'} className={`w-1/3 rounded-l-none`}>Warnings</Button>
                            </div>
                          </div>
                          <div className="space-y-8">
                            {agentDetailView === 'coaching' && <CoachingSectionForAdmin user={user} userRole={userRole} agentId={selectedAgent.id} coachingSessions={filteredCoaching} coachFilter={coachFilter} setCoachFilter={setCoachFilter} openModal={openModal} handleDelete={handleDelete} />}
                            {agentDetailView === 'plans' && <DocumentListItem type="plan" items={filteredPlans} user={user} agent={selectedAgent} openModal={openModal} handleDelete={handleDelete} />}
                            {agentDetailView === 'warnings' && <DocumentListItem type="warning" items={filteredWarnings} user={user} agent={selectedAgent} openModal={openModal} handleDelete={handleDelete} />}
                          </div>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full"><div className="text-center"><h2 className="text-2xl font-semibold text-muted-foreground">Select an agent to view their details</h2></div></div>
                  ))}
              </main>
              <ModalManager modal={modal} closeModal={closeModal} handleSaveData={handleSaveData} selectedAgent={selectedAgent} user={user} />
         </div>
    )
}
