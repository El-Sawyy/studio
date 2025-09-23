"use client";

import type { User } from 'firebase/compat/app';
import { db, firebase } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Star, X } from 'lucide-react';
import type { CoachingSession } from '@/lib/types';
import { AUDITOR_EMAILS } from '@/lib/constants';

interface CoachingListItemProps {
    doc: CoachingSession;
    onView: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onScore?: () => void;
    userRole: string | null;
    user: User;
    agentId: string;
    openModal: (type: string, data: any) => void;
    closeModal: () => void;
}

export default function CoachingListItem({ doc, onView, onEdit, onDelete, onScore, userRole, user, agentId, openModal, closeModal }: CoachingListItemProps) {
    const isOwner = user && user.email === doc.createdBy;
    const scoreColor = doc.triadScore?.totalScore >= 85 ? 'text-green-500' : doc.triadScore?.totalScore >= 70 ? 'text-yellow-500' : 'text-red-500';
    const canDeleteScore = user.email && AUDITOR_EMAILS.includes(user.email) && doc.triadScore?.auditorEmail === user.email;

    const handleDeleteScore = (e: React.MouseEvent) => {
        e.stopPropagation();
        openModal('CONFIRM_DELETE', {
            title: 'Delete Audit Score',
            message: 'Are you sure you want to delete this audit score?',
            onConfirm: () => {
                db.collection(`agents/${agentId}/coaching`).doc(doc.id).update({
                    triadScore: firebase.firestore.FieldValue.delete()
                })
                .then(() => closeModal())
                .catch(err => {
                    console.error("Error deleting score:", err);
                    closeModal();
                });
            }
        });
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
            <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold uppercase text-primary">{doc.coachType} - {doc.sessionType}</p>
                <p className="font-semibold truncate">Session on {new Date(doc.date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">By: {doc.lastModifiedBy || doc.createdBy || 'N/A'}</p>
            </div>
            {doc.triadScore && 
                <div className="flex items-center gap-2">
                    <p className={`font-bold text-lg mx-4 ${scoreColor}`}>{doc.triadScore.totalScore}%</p>
                    {canDeleteScore && <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={handleDeleteScore}><X className="h-4 w-4"/></Button>}
                </div>
            }
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onView} className="h-8 w-8"><Eye className="h-4 w-4"/></Button>
                {user.email && AUDITOR_EMAILS.includes(user.email) && onScore &&
                    <Button variant="ghost" size="icon" onClick={onScore} className="h-8 w-8 text-yellow-500"><Star className="h-4 w-4"/></Button>
                }
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
