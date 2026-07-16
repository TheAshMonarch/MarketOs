import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex min-h-40 flex-col items-start justify-center gap-4 rounded-2xl bg-destructive/5 p-6"
      role="alert"
    >
      <p className="text-sm leading-relaxed text-destructive">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
