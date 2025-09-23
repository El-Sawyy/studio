"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: string;
    onClick?: () => void;
    isActive?: boolean;
}

export default function StatCard({ title, value, icon, color = 'text-foreground', onClick, isActive = false }: StatCardProps) {
    const activeClass = isActive ? 'ring-2 ring-primary shadow-lg' : 'shadow-sm';

    const cardContent = (
      <Card className={`transition-all hover:shadow-xl ${activeClass} w-full text-left`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
              <div className={`text-2xl ${color}`}>{icon}</div>
          </CardHeader>
          <CardContent>
              <div className="text-4xl font-bold">{value}</div>
          </CardContent>
      </Card>
    );

    return onClick ? <button onClick={onClick} className="w-full">{cardContent}</button> : cardContent;
}
