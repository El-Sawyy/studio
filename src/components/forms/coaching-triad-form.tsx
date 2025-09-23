"use client";

import { useState, useMemo } from 'react';
import type { User } from 'firebase/compat/app';
import { db } from '@/lib/firebase';
import { TRIAD_QUESTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CoachingSession } from '@/lib/types';

interface CoachingTriadFormProps {
    session: CoachingSession;
    agentId: string;
    onCancel: () => void;
    user: User;
}

export default function CoachingTriadForm({ session, agentId, onCancel, user }: CoachingTriadFormProps) {
    const initialAnswers = session.triadScore?.answers || Array(TRIAD_QUESTIONS.length).fill('No');
    const [answers, setAnswers] = useState<string[]>(initialAnswers);
    const [comment, setComment] = useState(session.triadScore?.comment || '');

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const totalScore = useMemo(() => {
        return TRIAD_QUESTIONS.reduce((total, question, index) => {
            return answers[index] === 'Yes' ? total + question.weight : total;
        }, 0);
    }, [answers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const triadScore = {
            answers,
            totalScore,
            auditorEmail: user.email,
            comment,
            scoredAt: new Date().toISOString()
        };
        
        db.collection(`agents/${agentId}/coaching`).doc(session.id).update({triadScore})
            .then(() => onCancel())
            .catch(err => console.error("Error updating score:", err));
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-500';
        if (score >= 70) return 'text-yellow-500';
        return 'text-red-500';
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {TRIAD_QUESTIONS.map((q, index) => (
                <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{q.question} ({q.weight}%)</p>
                            <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                        </div>
                        <RadioGroup 
                            value={answers[index]} 
                            onValueChange={(value) => handleAnswerChange(index, value)} 
                            className="flex gap-4 ml-4 flex-shrink-0"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Yes" id={`q-${index}-yes`} />
                                <Label htmlFor={`q-${index}-yes`} className="text-green-600">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="No" id={`q-${index}-no`} />
                                <Label htmlFor={`q-${index}-no`} className="text-red-600">No</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            ))}
            <div className="pt-4 border-t">
                <Label htmlFor="auditorComment">Auditor Comment</Label>
                <Textarea id="auditorComment" value={comment} onChange={e => setComment(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-xl font-bold">Total Score: <span className={getScoreColor(totalScore)}>{totalScore}%</span></p>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Score</Button>
                </div>
            </div>
        </form>
    );
}
