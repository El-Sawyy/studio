"use client";

import type { Agent, PerformanceData } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '../ui/button';

interface PerformanceTableProps {
    performanceData: PerformanceData[];
    agents?: Agent[];
    setView?: (view: string) => void;
    setSelectedAgent?: (agent: Agent | null) => void;
    setAgentDetailView?: (view: string) => void;
    setExpandedTeams?: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
}


const ScoreCell = ({ score }: { score: number | null }) => {
    if (score === null || score === undefined) return <TableCell className="text-center">-</TableCell>;
    const percentage = score * 100;
    let colorClass = '';
    if (percentage >= 95) colorClass = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
    else if (percentage >= 80) colorClass = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
    else colorClass = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';

    return <TableCell className={`text-center font-semibold ${colorClass}`}>{percentage.toFixed(0)}%</TableCell>
};

const CSatScoreCell = ({ score }: { score: number | null }) => {
    if (score === null || score === undefined) return <TableCell className="text-center">-</TableCell>;
    const percentage = score * 100;
    const colorClass = percentage >= 90 ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300';

    return <TableCell className={`text-center font-semibold ${colorClass}`}>{percentage.toFixed(0)}%</TableCell>;
};

const DsatCell = ({ dsat }: { dsat: number | null }) => {
    if (dsat === null || dsat === undefined) return <TableCell className="text-center">-</TableCell>;
    const colorClass = dsat > 0 ? 'text-red-500 font-bold' : '';
    return <TableCell className={`text-center ${colorClass}`}>{dsat}</TableCell>
}

const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value;
}

export default function PerformanceTable({ performanceData, agents, setView, setSelectedAgent, setAgentDetailView, setExpandedTeams }: PerformanceTableProps) {
    if (performanceData.length === 0) {
        return <p className="text-center text-muted-foreground">No performance data available.</p>;
    }

    const goToAgent = (agentName: string) => {
        if (!agents || !setView || !setSelectedAgent || !setAgentDetailView || !setExpandedTeams) return;

        const agent = agents.find(a => a.name === agentName);
        if (agent) {
            setExpandedTeams(prev => ({...prev, [agent.team || 'Unassigned']: true}));
            setSelectedAgent(agent);
            setView('tracker');
        }
    };
    
    const totals = performanceData.reduce((acc, curr) => {
        acc.audits += curr.quality.audits || 0;
        acc.qaScoreSum += (curr.quality.qaScore || 0) * (curr.quality.audits || 0);
        acc.qaScoreCount += (curr.quality.qaScore ? curr.quality.audits : 0) || 0;
        acc.emailsSent += curr.quality.emailsSent || 0;
        acc.chats += curr.productivity.chats || 0;
        acc.callsInbound += curr.productivity.callsInbound || 0;
        acc.callsOutbound += curr.productivity.callsOutbound || 0;
        acc.callsTotal += curr.productivity.callsTotal || 0;
        acc.prodTotal += curr.productivity.total || 0;
        acc.surveys += curr.csat.surveys || 0;
        acc.csat += curr.csat.csat || 0;
        acc.dsat += curr.csat.dsat || 0;
        acc.cSatScoreSum += (curr.csat.cSatScore || 0) * (curr.csat.surveys || 0);
        acc.cSatScoreCount += curr.csat.cSatScore ? curr.csat.surveys || 0 : 0;
        return acc;
    }, {
        audits: 0, qaScoreSum: 0, qaScoreCount: 0, emailsSent: 0, chats: 0,
        callsInbound: 0, callsOutbound: 0, callsTotal: 0, prodTotal: 0,
        surveys: 0, csat: 0, dsat: 0, cSatScoreSum: 0, cSatScoreCount: 0
    });

    const avgQaScore = totals.qaScoreCount > 0 ? totals.qaScoreSum / totals.qaScoreCount : null;
    const avgCSatScore = totals.cSatScoreCount > 0 ? totals.cSatScoreSum / totals.cSatScoreCount : null;


    return (
        <div className="border rounded-lg overflow-x-auto">
            <Table className="whitespace-nowrap">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead rowSpan={2} className="sticky left-0 bg-muted z-10 w-[200px]">Agent Name</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">Quality</TableHead>
                        <TableHead colSpan={6} className="text-center border-l">Productivity (Handled Volume)</TableHead>
                        <TableHead colSpan={2} className="text-center border-l">FRT</TableHead>
                        <TableHead colSpan={4} className="text-center border-l">CSAT</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                        <TableHead className="text-center border-l">Audits</TableHead>
                        <TableHead className="text-center">QA Score</TableHead>
                        <TableHead className="text-center border-l">E-mails Sent</TableHead>
                        <TableHead className="text-center">Chats</TableHead>
                        <TableHead className="text-center">Inbound</TableHead>
                        <TableHead className="text-center">Outbound</TableHead>
                        <TableHead className="text-center">Total Calls</TableHead>
                        <TableHead className="text-center font-bold">Total Prod.</TableHead>
                        <TableHead className="text-center border-l">Chats (sec.)</TableHead>
                        <TableHead className="text-center">E-mails (Hrs)</TableHead>
                        <TableHead className="text-center border-l">Surveys</TableHead>
                        <TableHead className="text-center">CSAT</TableHead>
                        <TableHead className="text-center">DSAT</TableHead>
                        <TableHead className="text-center">C-Sat Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {performanceData.map(data => {
                        const canNavigate = agents?.find(a => a.name === data.agentName) && setView;
                        return (
                            <TableRow key={data.agentId}>
                                <TableCell className="font-semibold sticky left-0 bg-background z-10">
                                     {canNavigate ? (
                                        <Button variant="link" onClick={() => goToAgent(data.agentName)} className="p-0 h-auto font-semibold">{data.agentName}</Button>
                                    ) : (
                                        <span>{data.agentName}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center border-l">{formatValue(data.quality.audits)}</TableCell>
                                <ScoreCell score={data.quality.qaScore} />
                                <TableCell className="text-center border-l">{formatValue(data.quality.emailsSent)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.productivity.chats)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.productivity.callsInbound)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.productivity.callsOutbound)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.productivity.callsTotal)}</TableCell>
                                <TableCell className="text-center font-bold">{formatValue(data.productivity.total)}</TableCell>
                                <TableCell className="text-center border-l">{formatValue(data.frt.chatsSec)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.frt.emailsHrs)}</TableCell>
                                <TableCell className="text-center border-l">{formatValue(data.csat.surveys)}</TableCell>
                                <TableCell className="text-center">{formatValue(data.csat.csat)}</TableCell>
                                <DsatCell dsat={data.csat.dsat} />
                                <CSatScoreCell score={data.csat.cSatScore} />
                            </TableRow>
                        )
                    })}
                </TableBody>
                 <tfoot className="font-bold bg-muted">
                    <TableRow>
                        <TableCell className="sticky left-0 bg-muted z-10">Total</TableCell>
                        <TableCell className="text-center border-l">{totals.audits}</TableCell>
                        <ScoreCell score={avgQaScore} />
                        <TableCell className="text-center border-l">{totals.emailsSent}</TableCell>
                        <TableCell className="text-center">{totals.chats}</TableCell>
                        <TableCell className="text-center">{totals.callsInbound}</TableCell>
                        <TableCell className="text-center">{totals.callsOutbound}</TableCell>
                        <TableCell className="text-center">{totals.callsTotal}</TableCell>
                        <TableCell className="text-center">{totals.prodTotal}</TableCell>
                        <TableCell className="text-center border-l">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center border-l">{totals.surveys}</TableCell>
                        <TableCell className="text-center">{totals.csat}</TableCell>
                        <TableCell className="text-center">{totals.dsat}</TableCell>
                        <CSatScoreCell score={avgCSatScore} />
                    </TableRow>
                </tfoot>
            </Table>
        </div>
    );
}
