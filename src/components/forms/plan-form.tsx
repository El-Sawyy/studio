"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import RichTextInput from '@/components/shared/rich-text-input';
import AITools from '@/components/shared/ai-tools';
import { Trash2 } from 'lucide-react';
import type { PerformancePlan, AreaOfFocus, QATarget } from '@/lib/types';

interface PlanFormProps {
    onSubmit: (data: Partial<PerformancePlan>) => void;
    onCancel: () => void;
    initialData?: PerformancePlan | null;
}

const getInitialFormData = (initialData?: PerformancePlan | null): Partial<PerformancePlan> => {
    const defaultState: Partial<PerformancePlan> = {
        type: 'PIP',
        managerName: '',
        startDate: '',
        endDate: '',
        introduction: '',
        empowermentStatement: '',
        areasOfFocus: [{ title: '', expectation: '', actionPlan: [{text: '', completed: false}], goal: '' }],
        supportPlan: '',
        consequences: '',
        qaTargets: [{ week: '', required: '', achieved: '' }]
    };

    if (!initialData) return defaultState;
    const normalizedData = { ...defaultState, ...initialData };

    if (initialData.areasOfFocus) {
        normalizedData.areasOfFocus = initialData.areasOfFocus.map(area => {
            if (typeof area.actionPlan === 'string') {
                return { ...area, actionPlan: [{ text: area.actionPlan, completed: false }] };
            }
            if (!Array.isArray(area.actionPlan) || area.actionPlan.length === 0) {
                 return { ...area, actionPlan: [{ text: '', completed: false }] };
            }
            return area;
        });
    }
    return normalizedData;
};

export default function PlanForm({ onSubmit, onCancel, initialData }: PlanFormProps) {
    const [formData, setFormData] = useState(getInitialFormData(initialData));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    
    const handleSelectChange = (name: string, value: string) => setFormData(p => ({ ...p, [name]: value }));

    const handleRichTextChange = (name: string, html: string) => setFormData(prev => ({ ...prev, [name]: html }));
    
    const handleDynamicChange = <T extends keyof PerformancePlan>(index: number, e: React.ChangeEvent<HTMLInputElement>, section: T) => {
        const list = [...(formData[section] as any[])];
        list[index][e.target.name] = e.target.value;
        setFormData(p => ({ ...p, [section]: list }));
    };
    
    const handleAreaRichTextChange = (index: number, name: keyof AreaOfFocus, html: string) => {
        const list = [...(formData.areasOfFocus || [])];
        (list[index] as any)[name] = html;
        setFormData(p => ({ ...p, areasOfFocus: list }));
    };

    const handleActionPlanChange = (areaIndex: number, taskIndex: number, newText: string) => {
        const updatedAreas = [...(formData.areasOfFocus || [])];
        if (!updatedAreas[areaIndex].actionPlan) updatedAreas[areaIndex].actionPlan = [];
        (updatedAreas[areaIndex].actionPlan![taskIndex] as { text: string }).text = newText;
        setFormData(prev => ({...prev, areasOfFocus: updatedAreas}));
    };

    const handleActionPlanCheck = (areaIndex: number, taskIndex: number, isChecked: boolean) => {
        const updatedAreas = [...(formData.areasOfFocus || [])];
        if (!updatedAreas[areaIndex].actionPlan) updatedAreas[areaIndex].actionPlan = [];
        (updatedAreas[areaIndex].actionPlan![taskIndex] as { completed: boolean }).completed = isChecked;
        setFormData(prev => ({...prev, areasOfFocus: updatedAreas}));
    };

    const addActionPlanItem = (areaIndex: number) => {
        const updatedAreas = [...(formData.areasOfFocus || [])];
        if (!updatedAreas[areaIndex].actionPlan) {
            updatedAreas[areaIndex].actionPlan = [];
        }
        updatedAreas[areaIndex].actionPlan!.push({ text: '', completed: false });
        setFormData(prev => ({...prev, areasOfFocus: updatedAreas}));
    };

    const removeActionPlanItem = (areaIndex: number, taskIndex: number) => {
        const updatedAreas = [...(formData.areasOfFocus || [])];
        updatedAreas[areaIndex].actionPlan!.splice(taskIndex, 1);
        setFormData(prev => ({...prev, areasOfFocus: updatedAreas}));
    };

    const addDynamicItem = <T extends keyof PerformancePlan>(section: T, item: any) => {
        const currentSection = formData[section] as any[] || [];
        setFormData(p => ({ ...p, [section]: [...currentSection, item] }));
    };
    
    const removeDynamicItem = <T extends keyof PerformancePlan>(index: number, section: T) => {
        const list = [...(formData[section] as any[])];
        list.splice(index, 1);
        setFormData(p => ({ ...p, [section]: list }));
    };

    const handleAiPopulate = (aiData: Partial<PerformancePlan>) => {
      setFormData(prev => ({...prev, ...aiData}));
    };

    return <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
        <AITools formType="plan" onPopulate={handleAiPopulate} disabled={false} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name</Label>
                <Input id="managerName" name="managerName" value={formData.managerName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="type">Plan Type</Label>
                <Select name="type" value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="PIP">PIP</SelectItem><SelectItem value="QIP">QIP</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
            </div>
        </div>
        <RichTextInput label="Introduction" value={formData.introduction || ''} onChange={(html) => handleRichTextChange('introduction', html)} />
        <RichTextInput label="Empowerment Statement" value={formData.empowermentStatement || ''} onChange={(html) => handleRichTextChange('empowermentStatement', html)} />
        
        <div className="space-y-2 p-3 border rounded-md">
            <h4 className="font-semibold text-foreground">Areas of Focus</h4>
            {(formData.areasOfFocus || []).map((area, index) => ( 
                <div key={index} className="space-y-3 p-3 border rounded-md relative">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicItem(index, 'areasOfFocus')} className="absolute top-1 right-1 h-6 w-6 text-destructive" disabled={(formData.areasOfFocus || []).length <= 1}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                    <RichTextInput label="Focus Title" value={area.title} onChange={(html) => handleAreaRichTextChange(index, 'title', html)} />
                    <RichTextInput label="Expectation" value={area.expectation} onChange={(html) => handleAreaRichTextChange(index, 'expectation', html)} />
                    
                    <div className="space-y-2">
                        <Label>Action Plan Checkpoints</Label>
                        {(area.actionPlan || []).map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-center gap-2">
                                <Checkbox checked={!!task.completed} onCheckedChange={(checked) => handleActionPlanCheck(index, taskIndex, !!checked)} />
                                <Input type="text" value={task.text} onChange={e => handleActionPlanChange(index, taskIndex, e.target.value)} placeholder="Action item..."/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeActionPlanItem(index, taskIndex)} className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                        <Button type="button" variant="link" onClick={() => addActionPlanItem(index)}>+ Add checkpoint</Button>
                    </div>

                    <RichTextInput label="Goal" value={area.goal} onChange={(html) => handleAreaRichTextChange(index, 'goal', html)} />
                </div> 
            ))}
            <Button type="button" variant="link" onClick={() => addDynamicItem('areasOfFocus', { title: '', expectation: '', actionPlan: [{text: '', completed: false}], goal: '' })}>+ Add Area</Button>
        </div>

        <RichTextInput label="Support Plan" value={formData.supportPlan || ''} onChange={(html) => handleRichTextChange('supportPlan', html)} />
        <RichTextInput label="Consequences" value={formData.consequences || ''} onChange={(html) => handleRichTextChange('consequences', html)} />
        
        <div className="space-y-2 p-3 border rounded-md">
            <h4 className="font-semibold text-foreground">QA Targets</h4>
            {(formData.qaTargets || []).map((target, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div className="space-y-2"><Label htmlFor={`week-${index}`}>Week</Label><Input id={`week-${index}`} name="week" value={target.week} onChange={e => handleDynamicChange(index, e, 'qaTargets')} /></div>
                    <div className="space-y-2"><Label htmlFor={`required-${index}`}>Required</Label><Input id={`required-${index}`} name="required" value={target.required} onChange={e => handleDynamicChange(index, e, 'qaTargets')} /></div>
                    <div className="space-y-2"><Label htmlFor={`achieved-${index}`}>Achieved</Label><Input id={`achieved-${index}`} name="achieved" value={target.achieved} onChange={e => handleDynamicChange(index, e, 'qaTargets')} /></div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicItem(index, 'qaTargets')} className="h-8 w-8 text-destructive" disabled={(formData.qaTargets || []).length <= 1}><Trash2 className="h-4 w-4"/></Button>
                </div>
            ))}
            <Button type="button" variant="link" onClick={() => addDynamicItem('qaTargets', { week: '', required: '', achieved: '' })}>+ Add Target</Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{initialData?.id ? 'Save Changes' : 'Create Plan'}</Button>
        </div>
    </form>;
}
