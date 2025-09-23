"use client"

import { useMemo, useState, useEffect } from 'react';
import type { Agent, PerformanceData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PerformanceTable from '../shared/performance-table';
import { TrendingUp, Users } from 'lucide-react';
import { getSheetData } from '@/ai/flows/getSheetData';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { TEAMS } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '../ui/button';

interface PerformanceDashboardProps {
    agents: Agent[];
    setView: (view: string) => void;
    setSelectedAgent: (agent: Agent | null) => void;
    setAgentDetailView: (view: string) => void;
    setExpandedTeams: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
}

export default function PerformanceDashboard({ agents, setView, setSelectedAgent, setAgentDetailView, setExpandedTeams }: PerformanceDashboardProps) {
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardView, setDashboardView] = useState('agent');
    const [selectedTeam, setSelectedTeam] = useState('All Teams');
    
    const SPREADSHEET_ID = '19cxKHCERcPEgh3Z_QFh53thoRSYzmmBKrLKy868hao8';
    const SPREADSHEET_RANGE = 'Team Performance!A2:P100';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
                    setError("The application is not configured to connect to your Google Sheet yet. Please update the SPREADSHEET_ID and SPREADSHEET_RANGE in the code.");
                    setPerformanceData([]);
                    return;
                }
                const data = await getSheetData({
                    spreadsheetId: SPREADSHEET_ID,
                    range: SPREADSHEET_RANGE,
                });

                const enrichedData = data.map(sheetAgent => {
                    const matchingAgent = agents.find(a => a.name.toLowerCase().trim() === sheetAgent.agentName.toLowerCase().trim());
                    return {
                        ...sheetAgent,
                        team: matchingAgent ? matchingAgent.team : sheetAgent.team || 'Unassigned',
                    };
                });


                setPerformanceData(enrichedData);
            } catch (err: any) {
                console.error("Failed to fetch sheet data", err);
                setError(err.message || "An unknown error occurred while fetching data.");
                setPerformanceData([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (agents.length > 0) {
            fetchData();
        } else {
             setIsLoading(false);
        }
    }, [agents]);

    const teamFilteredData = useMemo(() => {
        if (dashboardView === 'team' && selectedTeam !== 'All Teams') {
            return performanceData.filter(d => d.team === selectedTeam);
        }
        return performanceData;
    }, [performanceData, dashboardView, selectedTeam]);

    const chartData = useMemo(() => {
        return teamFilteredData.map(d => ({
            name: d.agentName.split(' ')[0], // Use first name for brevity
            qaScore: d.quality.qaScore ? d.quality.qaScore * 100 : 0,
            productivity: d.productivity.total,
            dsat: d.csat.dsat,
        })).sort((a,b) => (b.productivity || 0) - (a.productivity || 0));
    }, [teamFilteredData]);

    const chartConfig: ChartConfig = {
        qaScore: {
            label: 'QA Score',
            color: 'hsl(var(--chart-1))',
        },
        productivity: {
            label: 'Productivity',
            color: 'hsl(var(--chart-2))',
        },
        dsat: {
            label: 'DSATs',
            color: 'hsl(var(--chart-5))',
        }
    };
    
    const chartHeight = useMemo(() => {
        const baseHeight = 300;
        const heightPerAgent = 30;
        const calculatedHeight = chartData.length * heightPerAgent;
        return Math.max(baseHeight, calculatedHeight);
    }, [chartData]);


    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 mb-4 md:mb-0">
                    <TrendingUp /> Agent Performance
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant={dashboardView === 'agent' ? 'secondary' : 'ghost'}
                        onClick={() => {setDashboardView('agent'); setSelectedTeam('All Teams');}}
                        className="gap-1"
                    >
                        <Users className="h-4 w-4" />
                        Agent View
                    </Button>
                    <Button
                        variant={dashboardView === 'team' ? 'secondary' : 'ghost'}
                        onClick={() => setDashboardView('team')}
                        className="gap-1"
                    >
                        <Users className="h-4 w-4" />
                        Team View
                    </Button>

                    {dashboardView === 'team' && (
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Teams">All Teams</SelectItem>
                                {TEAMS.map(team => (
                                    <SelectItem key={team} value={team}>{team}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                  <p className="text-center">Loading performance data from Google Sheet...</p>
                ) : error ? (
                     <Alert variant="destructive">
                        <AlertTitle>Error Fetching Data</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-8">
                        {dashboardView === 'team' && chartData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{selectedTeam} - Team Comparison</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} style={{ height: `${chartHeight}px` }} className="w-full">
                                        <ResponsiveContainer>
                                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                                                <CartesianGrid horizontal={false} />
                                                <XAxis type="number" />
                                                <YAxis 
                                                    dataKey="name" 
                                                    type="category" 
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={10}
                                                    width={80}
                                                />
                                                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
                                                <Legend />
                                                <Bar dataKey="productivity" fill="var(--color-productivity)" radius={4} />
                                                <Bar dataKey="qaScore" fill="var(--color-qaScore)" radius={4} />
                                                <Bar dataKey="dsat" fill="var(--color-dsat)" radius={4} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        )}
                         <PerformanceTable 
                            performanceData={teamFilteredData} 
                            agents={agents}
                            setView={setView}
                            setSelectedAgent={setSelectedAgent}
                            setAgentDetailView={setAgentDetailView}
                            setExpandedTeams={setExpandedTeams}
                          />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
