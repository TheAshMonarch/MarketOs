"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAnalytics, getPassport, getProducts } from "@/lib/api";
import type { Passport } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import {
  passportFormSchema,
  type PassportFormValues,
} from "@/lib/validations/passport";

export default function PassportPage() {
  const router = useRouter();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [salesDays, setSalesDays] = useState(0);
  const [stockUnits, setStockUnits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const form = useForm<PassportFormValues>({
    resolver: zodResolver(passportFormSchema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      market: "",
      shopNumber: "",
      category: "",
      description: "",
      profileImage: "",
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [passportRes, analyticsRes, productsRes] = await Promise.all([
        getPassport(),
        getAnalytics().catch(() => null),
        getProducts().catch(() => null),
      ]);

      const p = passportRes.passport;
      setPassport(p);
      form.reset({
        businessName: p.businessName,
        ownerName: p.ownerName,
        market: p.market,
        shopNumber: p.shopNumber,
        category: p.category,
        description: p.description || "",
        profileImage: "",
      });

      setSalesDays(analyticsRes?.analytics.chartData.length ?? 0);
      setStockUnits(
        productsRes?.products.reduce((sum, item) => sum + (item.stock || 0), 0) ?? 0
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load passport";
      if (message.toLowerCase().includes("unauthorized")) {
        router.replace("/login");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [form, router]);

  useEffect(() => {
    void load();
  }, [load]);

  function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreview(result);
      form.setValue("profileImage", result);
    };
    reader.readAsDataURL(file);
  }

  function onSubmit(_values: PassportFormValues) {
    setSaveNote(
      "Passport updates require POST /api/business — not available yet. Your current passport is shown from GET /api/passport."
    );
  }

  if (loading) return <LoadingState label="Loading passport…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!passport) return <ErrorState message="Passport not found." onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Market Passport"
        description="Your verified trader identity for the market floor."
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="mb-12 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" {...form.register("businessName")} />
            {form.formState.errors.businessName ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.businessName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" {...form.register("ownerName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="market">Market</Label>
            <Input id="market" {...form.register("market")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopNumber">Shop number</Label>
            <Input id="shopNumber" {...form.register("shopNumber")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" {...form.register("category")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileImage">Profile picture</Label>
            <Input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...form.register("description")} />
        </div>

        {imagePreview ? (
          <Image
            src={imagePreview}
            alt="Profile preview"
            width={120}
            height={120}
            unoptimized
            className="border border-border/50 object-cover"
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Save passport</Button>
          <Link
            href={`/passport/${passport.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Public view
          </Link>
        </div>

        {saveNote ? (
          <p className="text-sm text-muted-foreground" role="status">
            {saveNote}
          </p>
        ) : null}
      </form>

      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl font-medium tracking-tight">
          Your stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Sales days" value={String(salesDays)} />
          <StatCard
            label="Reputation"
            value={passport.reputation.toFixed(1)}
          />
          <StatCard label="Stock units" value={stockUnits.toLocaleString()} />
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 border-t border-border/50 pt-8">
        <h2 className="font-heading text-xl font-medium tracking-tight">
          Share QR
        </h2>
        <Image
          src={passport.qrCodeUrl}
          alt="Passport QR code"
          width={200}
          height={200}
          unoptimized
          className="border border-border/40 bg-white p-2"
        />
        {passport.phone ? (
          <p className="text-sm text-muted-foreground">Phone: {passport.phone}</p>
        ) : null}
      </section>
    </div>
  );
}
