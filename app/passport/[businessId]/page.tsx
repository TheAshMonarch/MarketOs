"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { getPassport } from "@/lib/api";
import type { Passport } from "@/lib/types/api";

export default function PublicPassportPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Existing API: GET /api/passport returns the logged-in owner's passport only.
      const data = await getPassport();
      if (data.passport.id !== businessId) {
        setError(
          "Public passport by ID isn’t available yet (no GET /api/business/:id). Sign in as this trader to view their passport."
        );
        setPassport(null);
        return;
      }
      setPassport(data.passport);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load passport";
      if (message.toLowerCase().includes("unauthorized")) {
        setError(
          "This public passport link needs GET /api/business/:id. Sign in as the owner to preview it for now."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto min-h-full w-full max-w-3xl bg-background px-4 py-12 md:px-6">
      <p className="mb-6 font-heading text-xl font-semibold tracking-wide">MarketOS</p>
      <PageHeader
        title="Trader Passport"
        description="Public business identity — reputation and shop details only."
      />

      {loading ? <LoadingState label="Loading passport…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {passport ? (
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="font-heading text-3xl font-semibold tracking-wide">
              {passport.businessName}
            </h2>
            <p className="text-muted-foreground">{passport.ownerName}</p>
            <p className="text-sm text-foreground">
              {passport.market} · Shop {passport.shopNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              {passport.category}
            </p>
            {passport.description ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {passport.description}
              </p>
            ) : null}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Reputation"
              value={passport.reputation.toFixed(1)}
            />
            <StatCard label="Market" value={passport.market} />
          </div>

          <Image
            src={passport.qrCodeUrl}
            alt="Business QR"
            width={180}
            height={180}
            unoptimized
            className="border border-border/40 bg-white p-2"
          />
        </div>
      ) : null}
    </div>
  );
}
