import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  /** Optional clarifying line under the value (e.g. "25 titles"). */
  subtitle?: React.ReactNode;
}

export function KPICard({ title, value, icon, className, subtitle }: KPICardProps) {
  return (
    <Card className={cn("border-l-4 hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {subtitle !== undefined && (
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}