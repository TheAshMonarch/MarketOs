"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { SaleConfirmList } from "@/components/sale-confirm-list";
import {
  SaleReceipt,
  buildReceiptQrUrl,
  type SaleReceiptData,
} from "@/components/sale-receipt";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSale,
  getPassport,
  getProducts,
  parseSaleText,
} from "@/lib/api";
import type { Product } from "@/lib/types/api";
import {
  saleConfirmSchema,
  type SaleConfirmValues,
} from "@/lib/validations/sale";

const PARSE_TIMEOUT_MS = 12000;

function emptyManualItem(): SaleConfirmValues["items"][number] {
  return {
    key: crypto.randomUUID(),
    productId: null,
    name: "",
    quantity: 1,
    unit: "pcs",
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Parse timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function NewSalePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [step, setStep] = useState<"compose" | "confirm" | "receipt">("compose");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseHint, setParseHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerName, setSellerName] = useState("Trader");
  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);
  const [booting, setBooting] = useState(true);

  const form = useForm<SaleConfirmValues>({
    resolver: zodResolver(saleConfirmSchema),
    defaultValues: { items: [] },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: "items",
  });

  const boot = useCallback(async () => {
    setBooting(true);
    setError(null);
    try {
      const [productsRes, passportRes] = await Promise.all([
        getProducts(),
        getPassport().catch(() => null),
      ]);
      setProducts(productsRes.products);
      if (passportRes?.passport.ownerName) {
        setSellerName(passportRes.passport.ownerName);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to prepare sale entry";
      if (message.toLowerCase().includes("unauthorized")) {
        router.replace("/login");
        return;
      }
      setError(message);
    } finally {
      setBooting(false);
    }
  }, [router]);

  useEffect(() => {
    void boot();
  }, [boot]);

  async function handleParse() {
    setError(null);
    setParseHint(null);
    setParsing(true);

    try {
      const result = await withTimeout(parseSaleText(text), PARSE_TIMEOUT_MS);
      const items =
        result.items.length > 0
          ? result.items.map((item) => ({
              key: crypto.randomUUID(),
              productId: item.productId,
              name: item.matchedName,
              quantity: item.quantity,
              unit: "pcs",
            }))
          : [emptyManualItem()];

      form.reset({ items });
      setStep("confirm");
      if (result.items.length === 0) {
        setParseHint("Nothing matched — add items manually below.");
      }
    } catch {
      form.reset({ items: [emptyManualItem()] });
      setStep("confirm");
      setParseHint(
        "Couldn’t parse that automatically. Enter items manually and confirm."
      );
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm(values: SaleConfirmValues) {
    setSaving(true);
    setError(null);

    try {
      const saleIds: string[] = [];
      let totalAmount = 0;

      for (const item of values.items) {
        let productId = item.productId;

        if (!productId) {
          const match = products.find(
            (product) =>
              product.name.toLowerCase() === item.name.trim().toLowerCase()
          );
          productId = match?.id ?? null;
        }

        if (!productId) {
          throw new Error(
            `“${item.name}” is not in inventory. Add it via products or pick a known name.`
          );
        }

        const response = await createSale({
          productId,
          quantity: item.quantity,
          paymentMethod: "CASH",
        });

        saleIds.push(response.sale.id);
        totalAmount += response.sale.amount;
      }

      const primaryId = saleIds[0];
      const params = new URLSearchParams({
        amount: String(totalAmount),
        seller: sellerName,
        ts: new Date().toISOString(),
        items: String(values.items.length),
      });
      const receiptPath = `/receipt/${primaryId}?${params.toString()}`;
      const receiptData: SaleReceiptData = {
        saleIds,
        totalAmount,
        itemCount: values.items.length,
        sellerName,
        timestamp: new Date().toISOString(),
        qrCodeUrl: buildReceiptQrUrl(receiptPath),
        receiptPath,
      };

      setReceipt(receiptData);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          `marketos-receipt-${primaryId}`,
          JSON.stringify(receiptData)
        );
      }
      setStep("receipt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sale");
    } finally {
      setSaving(false);
    }
  }

  function resetSale() {
    setText("");
    setParseHint(null);
    setError(null);
    setReceipt(null);
    form.reset({ items: [] });
    setStep("compose");
  }

  if (booting) return <LoadingState label="Preparing sale entry…" />;
  if (error && step === "compose" && !text) {
    return <ErrorState message={error} onRetry={boot} />;
  }

  if (step === "receipt" && receipt) {
    return (
      <div>
        <PageHeader title="Sale saved" description="Share this receipt with your buyer." />
        <SaleReceipt receipt={receipt} onNewSale={resetSale} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Smart Sale"
        description='Type freely — e.g. "3 groundnut oil and rice 3" — then confirm.'
      />

      {step === "compose" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sale-text">What did you sell?</Label>
            <Textarea
              id="sale-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="3 groundnut oil and rice 3"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleParse}
              disabled={parsing || text.trim().length === 0}
            >
              {parsing ? "Parsing…" : "Parse sale"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset({ items: [emptyManualItem()] });
                setParseHint(null);
                setStep("confirm");
              }}
            >
              Enter manually
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit(handleConfirm)}
        >
          {parseHint ? (
            <p className="text-sm text-muted-foreground" role="status">
              {parseHint}
            </p>
          ) : null}

          <SaleConfirmList form={form} fieldArray={fieldArray} />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Confirm & Save"}
            </Button>
            <Button type="button" variant="outline" onClick={resetSale}>
              Start over
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
