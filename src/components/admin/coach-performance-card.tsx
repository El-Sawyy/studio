"use client";

import { Button } from "@/components/ui/button";
import type { CoachingSession } from "@/lib/types";

interface CoachPerformanceCardProps {
    coachData: {
        coach: string;
        total: number;
        sessions: CoachingSession[];
    };
    openModal: (type: string, data: any) => void;
}

export default function CoachPerformanceCard({ coachData, openModal }: CoachPerformanceCardProps) {
    const sessionTypes = coachData.sessions.reduce((acc, session) => {
        acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-muted/50 p-4 rounded-lg shadow-sm">
            <h4 className="font-bold text-lg truncate">{coachData.coach}</h4>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-md">
                    <p className="text-2xl font-bold">{sessionTypes['1-to-1'] || 0}</p>
                    <p className="text-xs">1-to-1</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-md">
                    <p className="text-2xl font-bold">{sessionTypes['QA Coaching'] || 0}</p>
                    <p className="text-xs">QA</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-md">
                    <p className="text-2xl font-bold">{sessionTypes['Feedback'] || 0}</p>
                    <p className="text-xs">Feedback</p>
                </div>
                <div className="bg-background p-2 rounded-md border">
                    <p className="text-2xl font-bold">{coachData.total}</p>
                    <p className="text-xs">Total</p>
                </div>
            </div>
            <Button onClick={() => openModal('COACH_DETAILS', { coachEmail: coachData.coach, sessions: coachData.sessions })} className="mt-4 w-full" size="sm">
                View Details
            </Button>
        </div>
    )
}
