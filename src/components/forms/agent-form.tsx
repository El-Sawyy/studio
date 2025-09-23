"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAMS } from '@/lib/constants';

interface AgentFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

export default function AgentForm({ onSubmit, onCancel, initialData }: AgentFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        employeeId: '',
        email: '',
        team: TEAMS[0],
        ...initialData
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, team: value }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" name="employeeId" type="text" value={formData.employeeId} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Agent's Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                 <Select name="team" value={formData.team} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                        {TEAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{initialData?.id ? 'Save Changes' : 'Add Agent'}</Button>
            </div>
        </form>
    );
}
