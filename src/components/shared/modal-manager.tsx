"use client";

import type { User } from 'firebase/compat/app';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import AgentForm from '@/components/forms/agent-form';
import PlanForm from '@/components/forms/plan-form';
import WarningForm from '@/components/forms/warning-form';
import CoachingForm from '@/components/forms/coaching-form';
import CoachingTriadForm from '@/components/forms/coaching-triad-form';
import DocumentViewer from './document-viewer';
import CoachingViewer from './coaching-viewer';
import CoachDetailsViewer from './coach-details-viewer';
import type { Agent } from '@/lib/types';

interface ModalManagerProps {
    modal: { isOpen: boolean; type: string; data: any };
    closeModal: () => void;
    handleSaveData?: (type: string, data: any) => Promise<void>;
    selectedAgent: Agent | null;
    user: User;
    isAdmin?: boolean;
}

export default function ModalManager({ modal, closeModal, handleSaveData, selectedAgent, user, isAdmin = true }: ModalManagerProps) {
    if (!modal.isOpen) return null;

    const titles: { [key: string]: string } = {
        'EDIT_AGENT': modal.data?.id ? 'Edit Agent' : 'Add New Agent',
        'EDIT_PLAN': modal.data?.id ? 'Edit Plan' : 'Create New Plan',
        'EDIT_WARNING': modal.data?.id ? 'Edit Warning' : 'Create New Warning',
        'EDIT_COACHING': modal.data?.id ? 'Edit Coaching Session' : 'Create Coaching Session',
        'SCORE_COACHING': 'Coaching Triad Scorecard',
        'VIEW_PLAN': `Viewing Plan: ${modal.data?.type}`,
        'VIEW_WARNING': `Viewing Warning: ${modal.data?.type}`,
        'VIEW_COACHING': `Viewing Session: ${new Date(modal.data?.date).toLocaleDateString()}`,
        'COACH_DETAILS': `All Sessions by ${modal.data?.coachEmail}`,
        'CONFIRM_DELETE': modal.data?.title || 'Confirm Deletion',
    };
    
    const isLargeModal = modal.type.startsWith('VIEW') || modal.type === 'SCORE_COACHING' || modal.type === 'EDIT_PLAN';

    return (
        <Dialog open={modal.isOpen} onOpenChange={closeModal}>
            <DialogContent className={isLargeModal ? "max-w-4xl" : "max-w-2xl"} >
                <DialogHeader>
                    <DialogTitle>{titles[modal.type] || 'Modal'}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto p-1 pr-4">
                    {handleSaveData && modal.type === 'EDIT_AGENT' && <AgentForm onSubmit={(data) => handleSaveData('agent', {...data, id: modal.data?.id})} onCancel={closeModal} initialData={modal.data} />}
                    {handleSaveData && modal.type === 'EDIT_PLAN' && <PlanForm onSubmit={(data) => handleSaveData('plan', {...data, id: modal.data?.id})} onCancel={closeModal} initialData={modal.data} />}
                    {handleSaveData && modal.type === 'EDIT_WARNING' && <WarningForm onSubmit={(data) => handleSaveData('warning', {...data, id: modal.data?.id})} onCancel={closeModal} initialData={modal.data} />}
                    {handleSaveData && modal.type === 'EDIT_COACHING' && <CoachingForm onSubmit={(data) => handleSaveData('coaching', {...data, id: modal.data?.id})} onCancel={closeModal} initialData={modal.data} />}
                    {selectedAgent && modal.type === 'SCORE_COACHING' && <CoachingTriadForm session={modal.data} agentId={selectedAgent.id} onCancel={closeModal} user={user} />}
                    
                    {modal.type === 'COACH_DETAILS' && <CoachDetailsViewer data={modal.data} />}

                    {(modal.type === 'VIEW_PLAN' || modal.type === 'VIEW_WARNING') && selectedAgent && <DocumentViewer data={modal.data} type={modal.type.split('_')[1].toLowerCase()} agent={selectedAgent} user={user} isAdmin={isAdmin} />}
                    {modal.type === 'VIEW_COACHING' && <CoachingViewer data={modal.data} user={user} />}

                    {modal.type === 'CONFIRM_DELETE' && (
                       <div>
                           <p>{modal.data?.message || 'Are you sure you want to delete this item?'}</p>
                           <DialogFooter className="mt-4">
                               <Button variant="outline" onClick={closeModal}>Cancel</Button>
                               <Button variant="destructive" onClick={modal.data.onConfirm}>Delete</Button>
                           </DialogFooter>
                       </div>
                   )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
