"use client";

import { useState } from 'react';
import type { User } from 'firebase/compat/app';
import { Button } from '@/components/ui/button';
import { Clipboard } from 'lucide-react';
import type { CoachingSession } from '@/lib/types';
import { Badge } from '../ui/badge';

interface CoachingViewerProps {
    data: CoachingSession;
    user: User;
}

const renderField = (label: string, value: string | undefined) => (
    <div className="flex flex-col sm:flex-row mb-2">
        <p className="w-full sm:w-1/4 font-semibold text-muted-foreground">{label}:</p>
        <p className="w-full sm:w-3/4">{value}</p>
    </div>
);

const renderSection = (title: string, content: string | undefined) => ( 
    <div className="mt-6">
        <h4 className="text-lg font-bold border-b pb-1 mb-2">{title}</h4>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content || 'N/A' }} />
    </div>
);

export default function CoachingViewer({ data, user }: CoachingViewerProps) {
    const [copySuccess, setCopySuccess] = useState('');

    const richTextToPlain = (html: string | undefined): string => {
        if (!html) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('li').forEach(li => { li.textContent = `• ${li.textContent}\n`; });
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const handleCopy = () => {
        let textToCopy = `
Coaching Session: ${new Date(data.date).toLocaleDateString()}
Coach: ${data.lastModifiedBy || data.createdBy || 'N/A'}
Coach Type: ${data.coachType || 'N/A'}
Session Type: ${data.sessionType}

${data.lastWeekPerformance ? `--- LAST WEEK'S PERFORMANCE ---\n${richTextToPlain(data.lastWeekPerformance)}\n` : ''}
${data.strengths ? `--- STRENGTHS ---\n${richTextToPlain(data.strengths)}\n` : ''}
${data.opportunities ? `--- OPPORTUNITIES ---\n${richTextToPlain(data.opportunities)}\n` : ''}
${data.actionPlan ? `--- ACTION PLAN ---\n${richTextToPlain(data.actionPlan)}\n` : ''}
${data.notes ? `--- NOTES ---\n${richTextToPlain(data.notes)}\n` : ''}
${data.context ? `--- CONTEXT ---\n${richTextToPlain(data.context)}\n` : ''}
${data.observedBehavior ? `--- OBSERVED BEHAVIOR ---\n${richTextToPlain(data.observedBehavior)}\n` : ''}
${data.impact ? `--- IMPACT ---\n${richTextToPlain(data.impact)}\n` : ''}
${data.nextSteps ? `--- NEXT STEPS ---\n${richTextToPlain(data.nextSteps)}\n` : ''}
        `.trim();
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-sm">
                {renderField("Date", new Date(data.date).toLocaleDateString())}
                {renderField("Coach Type", data.coachType || 'Not specified')}
                {renderField("Session Type", data.sessionType)}
                {renderField("Submitted By", data.lastModifiedBy || data.createdBy || 'N/A')}
            </div>
            
            {data.sessionType === 'Feedback' ? (
                <>
                    {renderSection("Context", data.context)}
                    {renderSection("Observed Behavior", data.observedBehavior)}
                    {renderSection("Impact", data.impact)}
                    {renderSection("Next Steps", data.nextSteps)}
                </>
            ) : (
                 <>
                    {data.lastWeekPerformance && renderSection("Last Week's Performance", data.lastWeekPerformance)}
                    {renderSection("Strengths", data.strengths)}
                    {renderSection("Opportunities", data.opportunities)}
                    {renderSection("Action Plan", data.actionPlan)}
                    {renderSection("Notes", data.notes)}
                </>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t">
                <Button onClick={handleCopy}>
                    <Clipboard className="mr-2 h-4 w-4" /> {copySuccess || 'Copy Content'}
                </Button>
            </div>
        </div>
    );
}
