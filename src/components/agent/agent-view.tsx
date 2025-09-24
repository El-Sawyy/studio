"use client"

import type { User } from 'firebase/compat/app';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { LogOut, MessageSquareIcon, FileTextIcon, AlertTriangleIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { ThemeToggleButton } from '@/components/shared/theme-toggle-button';
import ModalManager from '@/components/shared/modal-manager';
import type { Agent, CoachingSession, PerformancePlan, Warning, PerformanceData } from '@/lib/types';
import DashboardStats from '@/components/shared/dashboard-stats';
import CoachingListItem from '@/components/shared/coaching-list-item';
import DocumentListItem from '@/components/shared/document-list-item';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PerformanceTable from '../shared/performance-table';
import { getSheetData } from '@/ai/flows/getSheetData';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function AgentView({ user, agentId }: { user: User, agentId: string | null }) {
    const [agentData, setAgentData] = useState<Agent | null>(null);
    const [plans, setPlans] = useState<PerformancePlan[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<{ isOpen: boolean; type: string; data: any; }>({ isOpen: false, type: '', data: null });
    const [error, setError] = useState<string | null>(null);
    const [agentDashboardView, setAgentDashboardView] = useState('coaching');
    const [coachFilter, setCoachFilter] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [performanceLoading, setPerformanceLoading] = useState(true);
    const [performanceError, setPerformanceError] = useState<string|null>(null);

    const SPREADSHEET_ID = '19cxKHCERcPEgh3Z_QFh53thoRSYzmmBKrLKy868hao8';
    const SPREADSHEET_RANGE = 'Team Performance';
    
    const agentPerformanceData = useMemo(() => {
        if(!agentData) return [];
        return performanceData.filter(d => d.agentName === agentData.name);
    }, [agentData, performanceData]);

    const monthlyFilteredSessions = useMemo(() => {
        return coachingSessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate.getMonth() === selectedMonth && sessionDate.getFullYear() === selectedYear;
        });
    }, [coachingSessions, selectedMonth, selectedYear]);

    const coachTypes = useMemo(() => ['All', ...new Set(monthlyFilteredSessions.map(s => s.coachType).filter(Boolean))], [monthlyFilteredSessions]);
    
    const filteredCoachingSessions = useMemo(() => {
        if (coachFilter === 'All') return monthlyFilteredSessions;
        return monthlyFilteredSessions.filter(s => s.coachType === coachFilter);
    }, [coachFilter, monthlyFilteredSessions]);

    useEffect(() => {
        setPerformanceLoading(true);
        const fetchData = async () => {
            try {
                const data = await getSheetData({
                    spreadsheetId: SPREADSHEET_ID,
                    range: SPREADSHEET_RANGE,
                });
                if (data.length > 0) {
                    setPerformanceData(data);
                }
            } catch (error: any) {
                console.error("Failed to fetch sheet data", error);
                setPerformanceError(error.message || 'An unknown error occurred while fetching performance data.');
            } finally {
                setPerformanceLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!agentId) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        let unsubscribes: (() => void)[] = [];

        const agentDocRef = db.collection('agents').doc(agentId);
        unsubscribes.push(agentDocRef.onSnapshot(agentDoc => {
            setIsLoading(false);
            if (agentDoc.exists) {
                setAgentData({ id: agentDoc.id, ...agentDoc.data() } as Agent);
                
                unsubscribes.push(db.collection(`agents/${agentId}/plans`).orderBy('startDate', 'desc').onSnapshot(snap => setPlans(snap.docs.map(d => ({id:d.id, ...d.data()} as PerformancePlan)))));
                unsubscribes.push(db.collection(`agents/${agentId}/warnings`).orderBy('date', 'desc').onSnapshot(snap => setWarnings(snap.docs.map(d => ({id:d.id, ...d.data()} as Warning)))));
                unsubscribes.push(db.collection(`agents/${agentId}/coaching`).orderBy('date', 'desc').onSnapshot(snap => setCoachingSessions(snap.docs.map(d => ({id:d.id, ...d.data()} as CoachingSession)))));

            } else {
                setAgentData(null);
            }
        }, err => {
             console.error("Error fetching agent profile:", err);
             setError("Could not load your profile due to a database permissions error. Please contact an admin.");
             setIsLoading(false);
        }));

        return () => unsubscribes.forEach(unsub => unsub());
    }, [agentId]);
    
    const openModal = (type: string, data: any = null) => setModal({ isOpen: true, type, data });
    const closeModal = () => setModal({ isOpen: false, type: '', data: null });

    if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading Your Data...</div>;

    if (error) {
        return (
             <div className="flex items-center justify-center min-h-screen flex-col">
                 <p className="mb-4 text-destructive">{error}</p>
                 <Button onClick={() => auth.signOut()} variant="destructive"><LogOut className="mr-2"/>Log Out</Button>
             </div>
        );
    }

    if (!agentData) {
        return (
            <div className="flex items-center justify-center min-h-screen flex-col">
                <p className="mb-4">Your agent profile has not been set up by an administrator yet.</p>
                <Button onClick={() => auth.signOut()} variant="destructive"><LogOut className="mr-2"/>Log Out</Button>
            </div>
        );
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const allDocs = [...plans, ...warnings, ...coachingSessions];
    const years = [...new Set(allDocs.map(s => new Date(s.date || (s as PerformancePlan).startDate).getFullYear()))].sort((a,b) => b-a);
    if(years.length === 0) years.push(new Date().getFullYear());

    return (
         <div className="bg-background text-foreground min-h-screen font-sans transition-colors duration-300">
              <header className="bg-card shadow-sm p-4 flex justify-between items-center border-b">
                  <h1 className="text-xl font-bold text-card-foreground">Your Performance Dashboard</h1>
                   <div className="flex items-center gap-4">
                       <ThemeToggleButton />
                       <Button onClick={() => auth.signOut()} title="Log Out" variant="outline">
                           <LogOut className="mr-2 h-4 w-4" />
                           <span>Log Out</span>
                       </Button>
                   </div>
              </header>
              <main className="p-4 md:p-8">
                  <DashboardStats plans={plans} warnings={warnings} />
                  <div className="mb-6">
                    <div className="flex border rounded-md">
                        <Button onClick={() => setAgentDashboardView('coaching')} variant={agentDashboardView === 'coaching' ? 'secondary' : 'ghost'} className="w-1/4 rounded-r-none">Coaching</Button>
                        <Button onClick={() => setAgentDashboardView('plans')} variant={agentDashboardView === 'plans' ? 'secondary' : 'ghost'} className="w-1/4 rounded-none border-x">Plans</Button>
                        <Button onClick={() => setAgentDashboardView('warnings')} variant={agentDashboardView === 'warnings' ? 'secondary' : 'ghost'} className="w-1/4 rounded-none">Warnings</Button>
                        <Button onClick={() => setAgentDashboardView('performance')} variant={agentDashboardView === 'performance' ? 'secondary' : 'ghost'} className="w-1/4 rounded-l-none border-l">Performance</Button>
                    </div>
                  </div>
                  <div className="space-y-8">
                      {agentDashboardView === 'coaching' && (
                          <Card>
                              <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <div className="flex items-center gap-2"><MessageSquareIcon /> Your Coaching Sessions</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Filter by period:</span>
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
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {coachTypes.length > 1 && (
                                    <div className="flex flex-wrap gap-2 mb-4 border-b pb-4">
                                        {coachTypes.map(type => (
                                            <Button 
                                                key={type}
                                                onClick={() => setCoachFilter(type)}
                                                variant={coachFilter === type ? 'default' : 'outline'}
                                                size="sm"
                                            >
                                                {type}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                                {filteredCoachingSessions.length > 0 ? filteredCoachingSessions.map(session => (
                                    <CoachingListItem key={session.id} doc={session} onView={() => openModal('VIEW_COACHING', session)} user={user} />
                                )) : <p className="p-4 text-muted-foreground text-center">You have no coaching sessions for the selected period.</p>}
                              </CardContent>
                          </Card>
                      )}
                      {agentDashboardView === 'plans' && <DocumentListItem type="plan" items={plans} user={user} agent={agentData} openModal={openModal} />}
                      {agentDashboardView === 'warnings' && <DocumentListItem type="warning" items={warnings} user={user} agent={agentData} openModal={openModal} />}
                      {agentDashboardView === 'performance' && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp /> Your Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {performanceLoading ? (
                                    <p className="text-center">Loading performance data...</p>
                                ) : performanceError ? (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error Fetching Performance Data</AlertTitle>
                                        <AlertDescription>{performanceError}</AlertDescription>
                                    </Alert>
                                ) : agentPerformanceData.length > 0 ? (
                                    <PerformanceTable performanceData={agentPerformanceData} />
                                ) : (
                                    <p className="text-center text-muted-foreground">Your performance data is not available yet.</p>
                                )}
                            </CardContent>
                        </Card>
                      )}
                  </div>
              </main>
              <ModalManager modal={modal} closeModal={closeModal} user={user} selectedAgent={agentData} isAdmin={false} />
         </div>
    );
}
