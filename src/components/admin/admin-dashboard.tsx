"use client"

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import type { Agent, CoachingSession, PerformancePlan, Warning } from '@/lib/types';
import StatCard from '../shared/stat-card';
import { FileText, CheckCircle, X, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CoachPerformanceCard from './coach-performance-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface AdminDashboardProps {
    agents: Agent[];
    setSelectedAgent: (agent: Agent) => void;
    setView: (view: string) => void;
    setAgentDetailView: (view: string) => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    setExpandedTeams: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
    openModal: (type: string, data: any) => void;
}


export default function AdminDashboard({ agents, setSelectedAgent, setView, setAgentDetailView, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, setExpandedTeams, openModal }: AdminDashboardProps) {
    const [allPlans, setAllPlans] = useState<PerformancePlan[]>([]);
    const [allWarnings, setAllWarnings] = useState<Warning[]>([]);
    const [allCoaching, setAllCoaching] = useState<CoachingSession[]>([]);
    const [coachPerformance, setCoachPerformance] = useState<{ coach: string; total: number; sessions: CoachingSession[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('active');
    const [date, setDate] = useState<DateRange | undefined>(undefined);


    useEffect(() => {
        if (!agents.length) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const plansPromises = agents.map(agent => db.collection(`agents/${agent.id}/plans`).get().then(snap => snap.docs.map(doc => ({ ...doc.data(), id: doc.id, agentId: agent.id, agentName: agent.name } as PerformancePlan))));
        const warningsPromises = agents.map(agent => db.collection(`agents/${agent.id}/warnings`).get().then(snap => snap.docs.map(doc => ({ ...doc.data(), id: doc.id, agentId: agent.id, agentName: agent.name } as Warning))));
        const coachingPromises = agents.map(agent => db.collection(`agents/${agent.id}/coaching`).get().then(snap => snap.docs.map(doc => ({ ...doc.data(), id: doc.id, agentId: agent.id, agentName: agent.name } as CoachingSession))));

        Promise.all([Promise.all(plansPromises), Promise.all(warningsPromises), Promise.all(coachingPromises)])
            .then(([plansArrays, warningsArrays, coachingArrays]) => {
                setAllPlans(plansArrays.flat());
                setAllWarnings(warningsArrays.flat());
                setAllCoaching(coachingArrays.flat());
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching all agent data:", error);
                setLoading(false);
            });
    }, [agents]);
    
    useEffect(() => {
       if (selectedMonth === -1 && selectedYear === -1) {
           setDate(undefined);
       }
    }, [selectedMonth, selectedYear]);

    const filteredDataForStats = useMemo(() => {
        let plans = allPlans;
        let warnings = allWarnings;
        let coaching = allCoaching;

        if (date?.from && date?.to) {
            const dateFilter = (item: any) => {
                const itemDate = new Date(item.date || item.startDate);
                return itemDate >= date.from! && itemDate <= date.to!;
            }
            plans = plans.filter(dateFilter);
            warnings = warnings.filter(dateFilter);
            coaching = coaching.filter(dateFilter);
        } else if (date?.from) {
             const dateFilter = (item: any) => {
                const itemDate = new Date(item.date || item.startDate).toDateString();
                return itemDate === date.from?.toDateString();
            }
            plans = plans.filter(dateFilter);
            warnings = warnings.filter(dateFilter);
            coaching = coaching.filter(dateFilter);
        } else {
             if (selectedYear !== -1) {
                const yearFilter = (item: any) => new Date(item.date || item.startDate).getFullYear() === selectedYear;
                plans = plans.filter(yearFilter);
                warnings = warnings.filter(yearFilter);
                coaching = coaching.filter(yearFilter);
            }

            if (selectedMonth !== -1) {
                const monthFilter = (item: any) => new Date(item.date || item.startDate).getMonth() === selectedMonth;
                plans = plans.filter(monthFilter);
                warnings = warnings.filter(monthFilter);
                coaching = coaching.filter(monthFilter);
            }
        }
        

        return { plans, warnings, coaching };
    }, [allPlans, allWarnings, allCoaching, selectedYear, selectedMonth, date]);


    useEffect(() => {
        const performance: Record<string, { total: number; sessions: CoachingSession[] }> = {};
        filteredDataForStats.coaching.forEach(session => {
            const coach = session.lastModifiedBy || session.createdBy;
            if (!coach) return;
            if (!performance[coach]) {
                performance[coach] = { total: 0, sessions: [] };
            }
            performance[coach].total++;
            performance[coach].sessions.push(session);
        });
        setCoachPerformance(Object.entries(performance).map(([coach, data]) => ({ coach, ...data })));
    }, [filteredDataForStats]);

    const { totalPlans, passedPlans, failedPlans, activePlans, totalWarnings } = useMemo(() => {
        const { plans, warnings } = filteredDataForStats;
        return {
            totalPlans: plans.length,
            passedPlans: plans.filter(p => p.status === 'Passed').length,
            failedPlans: plans.filter(p => p.status === 'Failed').length,
            activePlans: plans.filter(p => p.status === 'Active').length,
            totalWarnings: warnings.length
        };
    }, [filteredDataForStats]);

    const goToAgent = (item: any, viewType: string) => {
        const agent = agents.find(a => a.id === item.agentId);
        if (agent) {
            const itemDate = new Date(item.date || item.startDate);
            setSelectedMonth(itemDate.getMonth());
            setSelectedYear(itemDate.getFullYear());
            setExpandedTeams(prev => ({...prev, [agent.team || 'Unassigned']: true}));
            setSelectedAgent(agent);
            setAgentDetailView(viewType);
            setView('tracker');
        }
    };

    const { title, items } = useMemo(() => {
        const filterMap = {
            'total': { title: 'All Plans', items: filteredDataForStats.plans },
            'passed': { title: 'Passed Plans', items: filteredDataForStats.plans.filter(p => p.status === 'Passed') },
            'failed': { title: 'Failed Plans', items: filteredDataForStats.plans.filter(p => p.status === 'Failed') },
            'warnings': { title: 'All Warnings', items: filteredDataForStats.warnings },
            'active': { title: 'Active Plans', items: filteredDataForStats.plans.filter(p => p.status === 'Active') }
        };
        return filterMap[filterType as keyof typeof filterMap] || filterMap.active;
    }, [filterType, filteredDataForStats]);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [...new Set(allCoaching.concat(allPlans as any[], allWarnings as any[]).map(s => s.date || s.startDate ? new Date(s.date || s.startDate).getFullYear() : new Date().getFullYear()))].sort((a, b) => b - a);
    if(years.length === 0) years.push(new Date().getFullYear());


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Filter by period:</span>
                    <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-[300px] justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                              date.to ? (
                                <>
                                  {format(date.from, "LLL dd, y")} -{" "}
                                  {format(date.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(date.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={(range) => {
                                setDate(range);
                                if (range?.from) {
                                    setSelectedMonth(-1);
                                    setSelectedYear(-1);
                                } else {
                                    setSelectedMonth(new Date().getMonth());
                                    setSelectedYear(new Date().getFullYear());
                                }
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    <Select value={String(selectedYear)} onValueChange={v => {setSelectedYear(Number(v)); setDate(undefined);}}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="-1">All Years</SelectItem>
                            {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedMonth)} onValueChange={v => {setSelectedMonth(Number(v)); setDate(undefined);}}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="-1">All Months</SelectItem>
                            {months.map((month, i) => <SelectItem key={month} value={String(i)}>{month}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mb-8">
                {loading ? <p>Loading stats...</p> :
                    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        <StatCard title="Total Plans" value={totalPlans} icon={<FileText />} color="text-muted-foreground" onClick={() => setFilterType('total')} isActive={filterType === 'total'} />
                        <StatCard title="Passed Plans" value={passedPlans} icon={<CheckCircle />} color="text-green-500" onClick={() => setFilterType('passed')} isActive={filterType === 'passed'} />
                        <StatCard title="Failed Plans" value={failedPlans} icon={<X />} color="text-red-500" onClick={() => setFilterType('failed')} isActive={filterType === 'failed'} />
                        <StatCard title="Active Plans" value={activePlans} icon={<FileText />} color="text-blue-500" onClick={() => setFilterType('active')} isActive={filterType === 'active'} />
                        <StatCard title="Total Warnings" value={totalWarnings} icon={<AlertTriangle />} color="text-yellow-500" onClick={() => setFilterType('warnings')} isActive={filterType === 'warnings'} />
                    </section>
                }
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <p>Loading data...</p> : items.length === 0 ? <p className="text-center text-muted-foreground">No items match criteria.</p> :
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {items.sort((a, b) => new Date(b.date || b.endDate || 0).getTime() - new Date(a.date || a.endDate || 0).getTime()).map(item => (
                                    <div key={item.id} onClick={() => goToAgent(item, filterType === 'warnings' ? 'warnings' : 'plans')} className="p-3 border rounded-md hover:bg-muted cursor-pointer">
                                        <p className="font-bold">{item.agentName}</p>
                                        <p className="text-sm">{item.type}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.startDate ? `Start: ${new Date(item.startDate).toLocaleDateString()}` : `Date: ${new Date(item.date).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        }
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Coach Performance</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? <p>Loading performance data...</p> : coachPerformance.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {coachPerformance.map(perf => <CoachPerformanceCard key={perf.coach} coachData={perf} openModal={openModal} />)}
                            </div>
                        ) : <p className="text-center text-muted-foreground">No coaching sessions for this period.</p>}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
