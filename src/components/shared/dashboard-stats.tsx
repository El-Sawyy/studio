"use client";

import StatCard from './stat-card';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import type { PerformancePlan, Warning } from '@/lib/types';

interface DashboardStatsProps {
    plans: PerformancePlan[];
    warnings: Warning[];
}

export default function DashboardStats({ plans, warnings }: DashboardStatsProps) {
    const activePlans = plans.filter(p => p.status === 'Active').length;
    const totalWarnings = warnings.length;
    const passedPlans = plans.filter(p => p.status === 'Passed').length;

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Active Plans" value={activePlans} icon={<FileText />} color="text-blue-500" />
            <StatCard title="Total Warnings" value={totalWarnings} icon={<AlertTriangle />} color="text-yellow-500" />
            <StatCard title="Passed Plans" value={passedPlans} icon={<CheckCircle />} color="text-green-500" />
        </section>
    );
}
