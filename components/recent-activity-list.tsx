import type { ChartPoint } from "@/lib/types/api";

type RecentActivityListProps = {
  points: ChartPoint[];
  topProduct: string;
};

export function RecentActivityList({ points, topProduct }: RecentActivityListProps) {
  const recent = [...points].reverse().slice(0, 5);

  if (recent.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent activity yet. Record a sale to start your timeline.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {recent.map((point) => (
        <li
          key={`${point.date}-${point.revenue}`}
          className="flex items-center justify-between gap-4 py-4"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {new Date(point.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              Top mover: {topProduct || "—"}
            </p>
          </div>
          <p className="font-sans text-sm font-semibold tabular-nums text-foreground">
            {point.revenue.toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
