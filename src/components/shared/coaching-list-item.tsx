"use client";

import type { User } from 'firebase/compat/app';
import { db, firebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { CoachingSession } from '@/lib/types';
import { AUDITOR_EMAILS } from '@/lib/constants';

interface CoachingListItemProps {
    doc: CoachingSession;
    onView: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    user: User;
}

export default function CoachingListItem({ doc, onView, onEdit, onDelete, user }: CoachingListItemProps) {
    const isOwner = user && user.email === doc.createdBy;

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold uppercase text-primary">{doc.coachType} - {doc.sessionType}</p>
                <p className="font-semibold truncate">Session on {new Date(doc.date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">By: {doc.lastModifiedBy || doc.createdBy || 'N/A'}</p>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onView} className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                
                {isOwner && onEdit && onDelete && (
                    <>
                        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                    </>
                )}
            </div>
        </div>
    );
}
