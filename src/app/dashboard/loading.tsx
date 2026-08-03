import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-md animate-pulse"></div>
          <div className="h-4 w-72 bg-muted/60 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-36 bg-muted/50 rounded-md animate-pulse"></div>
          <div className="h-9 w-40 bg-muted rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card shadow-none border border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="h-3 w-20 bg-muted rounded-full animate-pulse"></div>
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted rounded-md animate-pulse"></div>
              <div className="h-3 w-32 bg-muted/60 rounded-full animate-pulse mt-3"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Operations Skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted rounded-full animate-pulse"></div>
        <Card className="border border-border/40 shadow-none overflow-hidden bg-card">
          <div className="divide-y divide-border/20">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-3 w-24 bg-muted/60 rounded-md animate-pulse"></div>
                  </div>
                </div>
                <div className="h-5 w-20 bg-muted rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
