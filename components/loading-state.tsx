type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="size-8 animate-pulse rounded-full bg-primary/25" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
