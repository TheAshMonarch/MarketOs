"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { RecentActivityList } from "@/components/recent-activity-list";
import { StatCard } from "@/components/stat-card";
import { WeeklySalesChart } from "@/components/weekly-sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics, getProducts } from "@/lib/api";
import type { Analytics, Product } from "@/lib/types/api";

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, productsRes] = await Promise.all([
        getAnalytics(),
        getProducts(),
      ]);
      setAnalytics(analyticsRes.analytics);
      setProducts(productsRes.products);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      if (message.toLowerCase().includes("unauthorized")) {
        router.replace("/login");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const stockCount = useMemo(
    () => products.reduce((sum, product) => sum + (product.stock || 0), 0),
    [products]
  );

  const salesToday = useMemo(() => {
    if (!analytics) return 0;
    const today = new Date().toISOString().split("T")[0];
    return analytics.chartData.find((point) => point.date === today)?.revenue ?? 0;
  }, [analytics]);

  const transactionDays = analytics?.chartData.length ?? 0;

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!analytics) return <ErrorState message="No analytics available." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your market pulse — revenue, stock, and weekly rhythm."
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={analytics.totalRevenue.toLocaleString()}
          hint={analytics.topProduct !== "None" ? `Top: ${analytics.topProduct}` : undefined}
        />
        <StatCard label="Sales Today" value={salesToday.toLocaleString()} />
        <StatCard label="Transactions" value={String(transactionDays)} hint="Active sale days" />
        <StatCard label="Products in Stock" value={stockCount.toLocaleString()} />
      </div>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Weekly sales</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklySalesChart data={analytics.chartData} />
        </CardContent>
      </Card>

      <section className="mb-8">
        <h2 className="mb-4 font-heading text-xl font-medium tracking-tight">
          Recent activity
        </h2>
        <RecentActivityList
          points={analytics.chartData}
          topProduct={analytics.topProduct}
        />
      </section>

      {analytics.advisorTip ? (
        <p className="rounded-2xl bg-primary/5 px-5 py-4 text-sm leading-relaxed text-foreground/80">
          {analytics.advisorTip}
        </p>
      ) : null}
    </div>
  );
}
