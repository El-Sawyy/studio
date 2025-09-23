"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextInput from '@/components/shared/rich-text-input';
import AITools from '@/components/shared/ai-tools';
import type { Warning } from '@/lib/types';

interface WarningFormProps {
    onSubmit: (data: Partial<Warning>) => void;
    onCancel: () => void;
    initialData?: Warning | null;
}

export default function WarningForm({ onSubmit, onCancel, initialData }: WarningFormProps) {
    const [formData, setFormData] = useState({
        type: 'Verbal',
        manager: '',
        date: '',
        summaryOfConcerns: '',
        improvementActionPlan: '',
        nextAction: '',
        ...initialData
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(p => ({ ...p, type: value }));
    };

    const handleRichTextChange = (name: string, html: string) => {
        setFormData(prev => ({ ...prev, [name]: html }));
    };

    const handleAiPopulate = (aiData: Partial<Warning>) => {
      setFormData(prev => ({...prev, ...aiData}));
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
            <AITools formType="warning" onPopulate={handleAiPopulate} disabled={false} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Input id="manager" name="manager" value={formData.manager} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Warning Type</Label>
                    <Select name="type" value={formData.type} onValueChange={handleSelectChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Verbal">Verbal</SelectItem>
                            <SelectItem value="Written">Written</SelectItem>
                            <SelectItem value="Final Written Warning">Final Written Warning</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                </div>
            </div>
            <RichTextInput label="Summary of Concerns" value={formData.summaryOfConcerns} onChange={(html) => handleRichTextChange('summaryOfConcerns', html)} />
            <RichTextInput label="Improvement Action Plan" value={formData.improvementActionPlan} onChange={(html) => handleRichTextChange('improvementActionPlan', html)} />
            <RichTextInput label="Next Action" value={formData.nextAction} onChange={(html) => handleRichTextChange('nextAction', html)} />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{initialData?.id ? 'Save Changes' : 'Create Warning'}</Button>
            </div>
        </form>
    );
}
