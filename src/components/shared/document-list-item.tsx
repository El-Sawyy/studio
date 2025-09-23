"use client";

import type { User } from 'firebase/compat/app';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2, FileTextIcon, AlertTriangleIcon, PlusCircle } from 'lucide-react';
import type { PerformancePlan, Warning, Agent } from '@/lib/types';

interface DocumentListProps {
    type: 'plan' | 'warning';
    items: (PerformancePlan | Warning)[];
    user: User;
    agent: Agent;
    openModal: (type: string, data?: any) => void;
    handleDelete?: (type: string, id: string) => void;
}

export default function DocumentListItem({ type, items, user, agent, openModal, handleDelete }: DocumentListProps) {
    const isAdmin = handleDelete !== undefined;

    const handleUpdatePlanStatus = (planId: string, status: string) => {
        db.collection(`agents/${agent.id}/plans`).doc(planId).update({ status });
    };

    const statusColor: Record<string, string> = { Active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', Completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', Passed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', Failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', Extended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };

    const icon = type === 'plan' ? <FileTextIcon /> : <AlertTriangleIcon />;
    const title = type === 'plan' ? 'Plans (PIP/QIP)' : 'Warnings';
    const createButtonLabel = type === 'plan' ? 'Create Plan' : 'Create Warning';
    const createModalType = type === 'plan' ? 'EDIT_PLAN' : 'EDIT_WARNING';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
                {isAdmin && (
                    <Button onClick={() => openModal(createModalType)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {createButtonLabel}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <div className="space-y-2">
                        {items.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold">{doc.type}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(doc as PerformancePlan).startDate
                                            ? `Start: ${new Date((doc as PerformancePlan).startDate).toLocaleDateString()} | End: ${new Date((doc as PerformancePlan).endDate).toLocaleDateString()}`
                                            : `Date: ${new Date((doc as Warning).date).toLocaleDateString()}`}
                                    </p>
                                </div>
                                {type === 'plan' && (
                                    isAdmin ? (
                                        <Select value={(doc as PerformancePlan).status} onValueChange={(status) => handleUpdatePlanStatus(doc.id, status)}>
                                            <SelectTrigger className={`w-[120px] text-xs mx-4 ${statusColor[(doc as PerformancePlan).status]}`}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Passed">Passed</SelectItem>
                                                <SelectItem value="Failed">Failed</SelectItem>
                                                <SelectItem value="Extended">Extended</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full mx-4 ${statusColor[(doc as PerformancePlan).status]}`}>{(doc as PerformancePlan).status}</span>
                                    )
                                )}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="icon" onClick={() => openModal(`VIEW_${type.toUpperCase()}`, doc)} className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                                    {isAdmin && handleDelete && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => openModal(`EDIT_${type.toUpperCase()}`, doc)} className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(type, doc.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-center p-4">No {type}s for this agent for the selected period.</p>}
            </CardContent>
        </Card>
    );
}
