export interface Agent {
    id: string;
    name: string;
    employeeId: string;
    email: string;
    team: string;
    createdAt: string;
}

export interface PerformancePlan {
    id: string;
    type: 'PIP' | 'QIP';
    managerName: string;
    startDate: string;
    endDate: string;
    introduction: string;
    empowermentStatement: string;
    areasOfFocus: AreaOfFocus[];
    supportPlan: string;
    consequences: string;
    qaTargets: QATarget[];
    status: 'Active' | 'Passed' | 'Failed' | 'Extended' | 'Completed';
    agentSignature?: Signature;
    leaderSignature?: Signature;
    date?: string; // for compatibility with warnings
}

export interface AreaOfFocus {
    title: string;
    expectation: string;
    actionPlan: { text: string; completed: boolean }[] | string;
    goal: string;
}

export interface QATarget {
    week: string;
    required: string;
    achieved: string;
}

export interface Warning {
    id: string;
    type: 'Verbal' | 'Written' | 'Final Written Warning';
    manager: string;
    date: string;
    summaryOfConcerns: string;
    improvementActionPlan: string;
    nextAction: string;
    agentSignature?: Signature;
    leaderSignature?: Signature;
}

export interface CoachingSession {
    id: string;
    date: string;
    sessionType: '1-to-1' | 'QA Coaching' | 'Feedback';
    coachType: string;
    lastWeekPerformance?: string;
    strengths?: string;
    opportunities?: string;
    actionPlan?: string;
    notes?: string;
    context?: string;
    observedBehavior?: string;
    impact?: string;
    nextSteps?: string;
    createdBy: string;
    lastModifiedBy?: string;
}

export interface Signature {
    name: string;
    date: string;
}

export interface PerformanceData {
  agentId: string;
  agentName: string;
  team: string;
  month: string;
  quality: {
    audits: number | null;
    qaScore: number | null;
    emailsSent: number | null;
  };
  productivity: {
    chats: number | null;
    callsInbound: number | null;
    callsOutbound: number | null;
    callsTotal: number | null;
    total: number | null;
  };
  frt: {
    chatsSec: number | null;
    emailsHrs: number | null;
  };
  csat: {
    surveys: number | null;
    csat: number | null;
    dsat: number | null;
    cSatScore: number | null;
  };
}
