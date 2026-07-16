import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-8 space-y-2", className)}>
      <h1 className="font-heading text-3xl font-medium leading-tight tracking-tight text-foreground md:text-[2.5rem]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
