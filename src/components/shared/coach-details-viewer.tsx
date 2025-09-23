"use client";

import type { CoachingSession } from "@/lib/types";
import { Badge } from "../ui/badge";

interface CoachDetailsViewerProps {
    data: {
        coachEmail: string;
        sessions: (CoachingSession & { agentName?: string })[];
    };
}

export default function CoachDetailsViewer({ data }: CoachDetailsViewerProps) {
    return (
        <div>
            {data.sessions.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                   {data.sessions.map(s => (
                       <li key={s.id} className="p-3 border-b flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{s.agentName}</span>
                            <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="secondary">{s.sessionType}</Badge>
                       </li>
                   ))}
                </ul>
            ) : <p>No sessions found for this period.</p>}
        </div>
    );
}
