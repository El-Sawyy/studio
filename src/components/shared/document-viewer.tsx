"use client";

import { useState } from 'react';
import type { User } from 'firebase/compat/app';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Clipboard, CheckCircle, Square, Trash2 } from 'lucide-react';
import RichTextInput from './rich-text-input';
import type { PerformancePlan, Warning, AreaOfFocus, Signature, Agent } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface DocumentViewerProps {
    data: PerformancePlan | Warning;
    type: 'plan' | 'warning';
    agent: Agent;
    user: User;
    isAdmin: boolean;
}

const renderField = (label: string, value: string | undefined) => (
    <div className="flex flex-col sm:flex-row mb-2">
        <p className="w-full sm:w-1/4 font-semibold text-muted-foreground">{label}:</p>
        <p className="w-full sm:w-3/4 text-foreground">{value}</p>
    </div>
);

const renderSection = (title: string, content: string | undefined) => ( 
    <div className="mt-6">
        <h4 className="text-lg font-bold border-b pb-1 mb-2">{title}</h4>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content || 'N/A' }} />
    </div>
);

export default function DocumentViewer({ data, type, agent, user, isAdmin }: DocumentViewerProps) {
    const [coachingNotes, setCoachingNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [agentSignName, setAgentSignName] = useState("");
    const [leaderSignName, setLeaderSignName] = useState("");
    const [copySuccess, setCopySuccess] = useState('');
    const docRef = agent && data?.id ? db.collection(`agents/${agent.id}/${type}s`).doc(data.id) : null;

    // This effect can be expanded to fetch coaching notes if needed for plans.
    // For now, it's kept simple.

    const handleSign = async (role: 'agent' | 'leader') => {
        if (!docRef) return;
        const name = role === 'agent' ? agentSignName : leaderSignName;
        if (!name.trim()) return;

        const signatureData: Signature = { name, date: new Date().toISOString() };
        await docRef.update(role === 'agent' ? { agentSignature: signatureData } : { leaderSignature: signatureData });
    };

    const richTextToPlain = (html: string | undefined): string => {
        if (!html) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('li').forEach(li => { li.textContent = `• ${li.textContent}\n`; });
        return tempDiv.textContent || tempDiv.innerText || '';
    };
    
    const handleCopy = () => {
        let textToCopy = '';
        if (type === 'plan') {
            const planData = data as PerformancePlan;
            textToCopy = `
Performance Improvement Plan (${planData.type})
-----------------------------------
Employee: ${agent.name}
Manager: ${planData.managerName}
Start Date: ${new Date(planData.startDate).toLocaleDateString()}
End Date: ${new Date(planData.endDate).toLocaleDateString()}

--- INTRODUCTION ---
${richTextToPlain(planData.introduction)}
... and so on for all fields ...
`.trim();
        } else if (type === 'warning') {
            const warningData = data as Warning;
            textToCopy = `
Warning (${warningData.type})
-----------------------------------
Employee: ${agent.name}
Manager: ${warningData.manager}
Date: ${new Date(warningData.date).toLocaleDateString()}
... and so on ...
`.trim();
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy.');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const normalizeActionPlan = (actionPlan: any) => {
        if (!actionPlan) return [];
        if (typeof actionPlan === 'string') {
            return actionPlan.split(/<li>|<\/li>/).filter(item => item && !item.startsWith('<ul') && !item.startsWith('</ul')).map(item => ({ text: item.replace(/<[^>]+>/g, '').trim(), completed: false }));
        }
        if (Array.isArray(actionPlan)) {
            return actionPlan;
        }
        return [];
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center capitalize">{type} Document</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-sm">
                {renderField("Employee Name", agent.name)}
                {renderField("Date", new Date(data.date || (data as PerformancePlan).startDate).toLocaleDateString())}
                {renderField("Manager", (data as Warning).manager || (data as PerformancePlan).managerName)}
                {type === 'plan' ? renderField("End Date", new Date((data as PerformancePlan).endDate).toLocaleDateString()) : renderField("Warning Type", data.type)}
            </div>
            
            {type === 'warning' && (
                <>
                    {renderSection("Summary of Concerns", (data as Warning).summaryOfConcerns)}
                    {renderSection("Improvement Action Plan", (data as Warning).improvementActionPlan)}
                    {renderSection("Next Action", (data as Warning).nextAction)}
                </>
            )}
            
            {type === 'plan' && (
                <>
                    {renderSection("Introduction", (data as PerformancePlan).introduction)}
                    {renderSection("Empowerment Statement", (data as PerformancePlan).empowermentStatement)}
                    <div className="mt-6">
                        <h4 className="text-lg font-bold border-b pb-1 mb-2">Areas of Focus</h4>
                        {(data as PerformancePlan).areasOfFocus?.map((area, index) => (
                            <div key={index} className="mb-4 p-2 border-l-2 border-primary pl-4">
                                <h5 className="font-bold prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${area.title}` }} />
                                <div className="mt-2"><strong className="block mb-1">Expectation:</strong> <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: area.expectation || ''}} /></div>
                                <div className="mt-2"><strong className="block mb-1">Action Plan:</strong>
                                    <div className="space-y-1 mt-1">
                                        {normalizeActionPlan(area.actionPlan).map((task: any, taskIndex: number) => (
                                            <div key={taskIndex} className={`flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Square className="h-4 w-4" />}
                                                <span>{task.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-2"><strong className="block mb-1">Goal:</strong> <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: area.goal || ''}} /></div>
                            </div>
                        ))}
                    </div>
                    {renderSection("Support Plan", (data as PerformancePlan).supportPlan)}
                    {renderSection("Consequences", (data as PerformancePlan).consequences)}
                    
                    {(data as PerformancePlan).qaTargets && (data as PerformancePlan).qaTargets.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-bold border-b pb-1 mb-2">QA Targets</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Week</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Achieved</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(data as PerformancePlan).qaTargets.map((target, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{target.week || 'N/A'}</TableCell>
                                            <TableCell>{target.required || 'N/A'}</TableCell>
                                            <TableCell>{target.achieved || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </>
            )}

            <div className="flex justify-between mt-16 pt-8 border-t">
                <div>
                    <Label>Employee's Signature</Label>
                    {data.agentSignature ? (
                        <div className="mt-2">
                            <p className="font-semibold text-lg">{data.agentSignature.name}</p>
                            <p className="text-xs text-muted-foreground">Signed on {new Date(data.agentSignature.date).toLocaleString()}</p>
                        </div>
                    ) : !isAdmin ? (
                        <div className="flex gap-2 items-center mt-2">
                            <Input placeholder="Type your full name" value={agentSignName} onChange={e => setAgentSignName(e.target.value)} />
                            <Button onClick={() => handleSign('agent')}>Sign</Button>
                        </div>
                    ) : <p className="mt-8 text-muted-foreground">____________________</p>}
                </div>
                <div>
                    <Label>Leader's Signature</Label>
                    {data.leaderSignature ? (
                        <div className="mt-2 text-right">
                            <p className="font-semibold text-lg">{data.leaderSignature.name}</p>
                            <p className="text-xs text-muted-foreground">Signed on {new Date(data.leaderSignature.date).toLocaleString()}</p>
                        </div>
                    ) : isAdmin ? (
                        <div className="flex gap-2 items-center mt-2">
                            <Input placeholder="Type your full name" value={leaderSignName} onChange={e => setLeaderSignName(e.target.value)} />
                            <Button onClick={() => handleSign('leader')}>Sign</Button>
                        </div>
                    ) : <p className="mt-8 text-muted-foreground text-right">____________________</p>}
                </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
                <Button onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" /> {copySuccess || 'Copy Content'}
                </Button>
            </div>
        </div>
    );
}
