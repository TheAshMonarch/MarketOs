import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-28 pt-8 md:px-6 md:pb-12 md:pt-10">
        {children}
      </main>
    </div>
  );
}
