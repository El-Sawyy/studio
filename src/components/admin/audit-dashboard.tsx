"use client"

import { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/compat/app';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Agent, CoachingSession } from '@/lib/types';

interface AuditDashboardProps {
    agents: Agent[];
    user: User;
}

export default function AuditDashboard({ agents, user }: AuditDashboardProps) {
    const [allCoaching, setAllCoaching] = useState<CoachingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (!agents.length) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const coachingPromises = agents.map(agent =>
            db.collection(`agents/${agent.id}/coaching`).get().then(snapshot =>
                snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    agentName: agent.name,
                    agentId: agent.id
                } as CoachingSession & { agentName: string; agentId: string }))
            )
        );

        Promise.all(coachingPromises)
            .then(coachingArrays => {
                setAllCoaching(coachingArrays.flat());
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching all coaching data:", error);
                setLoading(false);
            });
    }, [agents]);

    const auditedSessions = useMemo(() => {
        return allCoaching
            .filter(session => session.triadScore)
            .filter(session => {
                const sessionDate = new Date(session.date);
                const yearMatch = sessionDate.getFullYear() === selectedYear;
                const monthMatch = selectedMonth === -1 || sessionDate.getMonth() === selectedMonth;
                return yearMatch && monthMatch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allCoaching, selectedMonth, selectedYear]);
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [...new Set(allCoaching.map(s => new Date(s.date).getFullYear()))].sort((a, b) => b - a);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Audit Dashboard</CardTitle>
                <div className="flex items-center gap-2">
                    <Select value={String(selectedMonth)} onValueChange={v => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="-1">All Months</SelectItem>
                            {months.map((month, i) => <SelectItem key={month} value={String(i)}>{month}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? <p>Loading audits...</p> : auditedSessions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead>Coach</TableHead>
                                <TableHead>Auditor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditedSessions.map(session => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-semibold">{(session as any).agentName}</TableCell>
                                    <TableCell>{session.createdBy}</TableCell>
                                    <TableCell>{session.triadScore!.auditorEmail}</TableCell>
                                    <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center font-bold text-lg">{session.triadScore!.totalScore}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-center text-muted-foreground">No audited sessions found for the selected period.</p>}
            </CardContent>
        </Card>
    );
}
