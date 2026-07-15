"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import type { SaleReceiptData } from "@/components/sale-receipt";

type VerifyView = {
  verified: boolean;
  amount: number;
  sellerName: string;
  timestamp: string;
  itemCount?: number;
};

function ReceiptVerifyContent() {
  const params = useParams<{ receiptId: string }>();
  const searchParams = useSearchParams();
  const receiptId = params.receiptId;
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<VerifyView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryView = useMemo(() => {
    const amount = Number(searchParams.get("amount"));
    const seller = searchParams.get("seller");
    const ts = searchParams.get("ts");
    if (!seller || !ts || Number.isNaN(amount)) return null;
    return {
      verified: true,
      amount,
      sellerName: seller,
      timestamp: ts,
      itemCount: Number(searchParams.get("items") || 0) || undefined,
    } satisfies VerifyView;
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      if (queryView) {
        setView(queryView);
        return;
      }

      const raw =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(`marketos-receipt-${receiptId}`)
          : null;

      if (raw) {
        const stored = JSON.parse(raw) as SaleReceiptData;
        setView({
          verified: true,
          amount: stored.totalAmount,
          sellerName: stored.sellerName,
          timestamp: stored.timestamp,
          itemCount: stored.itemCount,
        });
        return;
      }

      setView(null);
      setError(
        "Receipt not verified. GET /api/receipt/:id is not available yet — open this link from a freshly generated sale QR."
      );
    } catch {
      setError("Could not read receipt details.");
    } finally {
      setLoading(false);
    }
  }, [queryView, receiptId]);

  return (
    <>
      {loading ? <LoadingState label="Checking receipt…" /> : null}
      {error ? <ErrorState message={error} /> : null}

      {view ? (
        <div className="space-y-6 rounded-2xl bg-card/80 p-6 shadow-[0_1px_2px_oklch(0.3_0.02_250/0.04)]">
          <p
            className={
              view.verified
                ? "text-sm font-medium text-primary"
                : "text-sm font-medium text-destructive"
            }
          >
            {view.verified ? "Verified" : "Not verified"}
          </p>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-semibold tabular-nums">
                {view.amount.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Seller</dt>
              <dd className="font-medium">{view.sellerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Timestamp</dt>
              <dd className="text-right">
                {new Date(view.timestamp).toLocaleString()}
              </dd>
            </div>
            {view.itemCount ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Items</dt>
                <dd>{view.itemCount}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Receipt ID</dt>
              <dd className="break-all text-right text-xs">{receiptId}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </>
  );
}

export default function ReceiptVerifyPage() {
  return (
    <div className="mx-auto min-h-full w-full max-w-lg bg-background px-4 py-12 md:px-6">
      <p className="mb-6 font-heading text-xl font-semibold tracking-wide">MarketOS</p>
      <PageHeader
        title="Receipt verify"
        description="Confirm a market sale is real — no login required."
      />
      <Suspense fallback={<LoadingState label="Checking receipt…" />}>
        <ReceiptVerifyContent />
      </Suspense>
    </div>
  );
}
