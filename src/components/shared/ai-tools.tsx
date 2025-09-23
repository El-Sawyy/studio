"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { autoFillFormFields } from '@/ai/flows/auto-fill-form-fields';
import type { PerformancePlan, Warning, CoachingSession } from '@/lib/types';


interface AIToolsProps {
    formType: 'plan' | 'warning' | 'coaching';
    onPopulate: (data: any) => void;
    disabled: boolean;
}

export default function AITools({ formType, onPopulate, disabled }: AIToolsProps) {
    const [mode, setMode] = useState<'fill' | 'generate' | null>(null);
    const [text, setText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleProcess = async () => {
        setIsProcessing(true);
        setError('');
        
        try {
            const result = await autoFillFormFields({
                formType,
                mode,
                text,
            });

            if (!result) {
                 throw new Error("No content from API.");
            }

            onPopulate(result);
            setMode(null);
            setText("");
        } catch (err: any) {
            setError(`Failed. ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mode) {
        return (
            <div className="my-4 pt-4 border-t flex gap-2">
                <Button type="button" onClick={() => setMode('fill')} className="w-full" variant="outline" disabled={disabled}>
                    <Sparkles className="mr-2 h-4 w-4" /> Auto-fill from Text
                </Button>
                <Button type="button" onClick={() => setMode('generate')} className="w-full" variant="outline" disabled={disabled}>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
                </Button>
            </div>
        );
    }

    return (
        <div className="my-4 pt-4 border-t space-y-2 rounded-lg bg-muted p-4">
            <Label>{mode === 'fill' ? 'Paste text to auto-fill the form:' : 'Describe the issue to generate content:'}</Label>
            {mode === 'fill' ? (
                <Textarea value={text} onChange={e => setText(e.target.value)} rows={8} />
            ) : (
                <Input type="text" value={text} onChange={e => setText(e.target.value)} />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
                <Button type="button" onClick={handleProcess} disabled={isProcessing || !text}>
                    {isProcessing ? 'Processing...' : 'Go'}
                </Button>
            </div>
        </div>
    );
}
