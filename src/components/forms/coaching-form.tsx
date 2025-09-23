"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextInput from '@/components/shared/rich-text-input';
import AITools from '@/components/shared/ai-tools';
import { COACH_TYPES } from '@/lib/constants';
import type { CoachingSession } from '@/lib/types';

interface CoachingFormProps {
    onSubmit: (data: Partial<CoachingSession>) => void;
    onCancel: () => void;
    initialData?: CoachingSession | null;
}

export default function CoachingForm({ onSubmit, onCancel, initialData }: CoachingFormProps) {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState<Partial<CoachingSession>>({
        date: today,
        sessionType: '1-to-1',
        coachType: 'Team Leader',
        lastWeekPerformance: '',
        strengths: '',
        opportunities: '',
        actionPlan: '',
        notes: '',
        context: '',
        observedBehavior: '',
        impact: '',
        nextSteps: '',
        ...initialData
    });

    useEffect(() => {
        if (initialData) return; 
        setFormData(prev => {
            if (prev.sessionType === 'Feedback') {
                return {
                    ...prev,
                    lastWeekPerformance: '',
                    strengths: '',
                    opportunities: '',
                    actionPlan: '',
                    notes: ''
                };
            } else {
                 return {
                    ...prev,
                    context: '',
                    observedBehavior: '',
                    impact: '',
                    nextSteps: ''
                };
            }
        });
    }, [formData.sessionType, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRichTextChange = (name: keyof CoachingSession, html: string) => {
        setFormData(prev => ({...prev, [name]: html}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    const handleAiPopulate = (aiData: Partial<CoachingSession>) => {
        setFormData(prev => ({...prev, ...aiData}));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <AITools formType="coaching" onPopulate={handleAiPopulate} disabled={false} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label>Coach Type</Label>
                    <Select name="coachType" value={formData.coachType} onValueChange={(v) => handleSelectChange('coachType', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {COACH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Session Type</Label>
                    <Select name="sessionType" value={formData.sessionType} onValueChange={(v) => handleSelectChange('sessionType', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1-to-1">1-to-1</SelectItem>
                            <SelectItem value="QA Coaching">QA Coaching</SelectItem>
                            <SelectItem value="Feedback">Feedback</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            { (formData.sessionType === '1-to-1' || formData.sessionType === 'QA Coaching') ? (
                <>
                    <RichTextInput label="Last Week's Performance" value={formData.lastWeekPerformance || ''} onChange={(html) => handleRichTextChange('lastWeekPerformance', html)} />
                    <RichTextInput label="Strengths" value={formData.strengths || ''} onChange={(html) => handleRichTextChange('strengths', html)} />
                    <RichTextInput label="Opportunities" value={formData.opportunities || ''} onChange={(html) => handleRichTextChange('opportunities', html)} />
                    <RichTextInput label="Action Plan" value={formData.actionPlan || ''} onChange={(html) => handleRichTextChange('actionPlan', html)} />
                    <RichTextInput label="Additional Notes" value={formData.notes || ''} onChange={(html) => handleRichTextChange('notes', html)} />
                </>
            ) : (
                <>
                    <RichTextInput label="Context" value={formData.context || ''} onChange={(html) => handleRichTextChange('context', html)} />
                    <RichTextInput label="Observed Behavior" value={formData.observedBehavior || ''} onChange={(html) => handleRichTextChange('observedBehavior', html)} />
                    <RichTextInput label="Impact" value={formData.impact || ''} onChange={(html) => handleRichTextChange('impact', html)} />
                    <RichTextInput label="Next Steps" value={formData.nextSteps || ''} onChange={(html) => handleRichTextChange('nextSteps', html)} />
                </>
            )}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{initialData?.id ? 'Save Changes' : 'Create Session'}</Button>
            </div>
        </form>
    );
}
