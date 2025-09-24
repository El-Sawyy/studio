"use client";

import type { User } from 'firebase/compat/app';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareIcon, PlusCircle } from 'lucide-react';
import CoachingListItem from '../shared/coaching-list-item';
import type { CoachingSession } from '@/lib/types';
import { AUDITOR_EMAILS } from '@/lib/constants';

interface CoachingSectionForAdminProps {
    user: User;
    userRole: string | null;
    agentId: string;
    coachingSessions: CoachingSession[];
    coachFilter: string;
    setCoachFilter: (filter: string) => void;
    openModal: (type: string, data?: any) => void;
    handleDelete: (type: string, id: string) => void;
}

export function CoachingSectionForAdmin({ user, userRole, agentId, coachingSessions, coachFilter, setCoachFilter, openModal, handleDelete }: CoachingSectionForAdminProps) {
    const coachTypes = useMemo(() => ['All', ...new Set(coachingSessions.map(s => s.coachType).filter(Boolean))], [coachingSessions]);
    
    const filteredCoachingSessions = useMemo(() => {
        if (coachFilter === 'All') return coachingSessions;
        return coachingSessions.filter(s => s.coachType === coachFilter);
    }, [coachFilter, coachingSessions]);

    const canCreateSession = userRole === 'admin' || (user.email && AUDITOR_EMAILS.includes(user.email));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><MessageSquareIcon /> Coaching Sessions</CardTitle>
                {canCreateSession &&
                    <Button onClick={() => openModal('EDIT_COACHING')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Session
                    </Button>
                }
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
                {filteredCoachingSessions.length > 0 ? (
                    <div className="space-y-2">
                        {filteredCoachingSessions.map(session => (
                            <CoachingListItem 
                                key={session.id} 
                                doc={session} 
                                onEdit={() => openModal('EDIT_COACHING', session)} 
                                onView={() => openModal('VIEW_COACHING', session)} 
                                onDelete={() => handleDelete('coaching', session.id)}
                                user={user}
                            />
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-center p-4">No coaching sessions match the current filter.</p>}
            </CardContent>
        </Card>
    );
}
