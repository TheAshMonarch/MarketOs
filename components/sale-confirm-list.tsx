"use client";

import { Plus, Trash2 } from "lucide-react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaleConfirmValues } from "@/lib/validations/sale";

type SaleConfirmListProps = {
  form: UseFormReturn<SaleConfirmValues>;
  fieldArray: UseFieldArrayReturn<SaleConfirmValues, "items">;
};

export function SaleConfirmList({ form, fieldArray }: SaleConfirmListProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = fieldArray;

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-4 rounded-2xl bg-card/80 p-4 shadow-[0_1px_2px_oklch(0.3_0.02_250/0.04)] sm:grid-cols-[1fr_6rem_6rem_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor={`items.${index}.name`}>Product</Label>
            <Input
              id={`items.${index}.name`}
              aria-invalid={!!errors.items?.[index]?.name}
              {...register(`items.${index}.name`)}
            />
            {errors.items?.[index]?.name ? (
              <p className="text-xs text-destructive">
                {errors.items[index]?.name?.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
            <Input
              id={`items.${index}.quantity`}
              type="number"
              min={1}
              aria-invalid={!!errors.items?.[index]?.quantity}
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`items.${index}.unit`}>Unit</Label>
            <Input
              id={`items.${index}.unit`}
              aria-invalid={!!errors.items?.[index]?.unit}
              {...register(`items.${index}.unit`)}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove item"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <input type="hidden" {...register(`items.${index}.key`)} />
          <input type="hidden" {...register(`items.${index}.productId`)} />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            key: crypto.randomUUID(),
            productId: null,
            name: "",
            quantity: 1,
            unit: "pcs",
          })
        }
      >
        <Plus className="size-3.5" data-icon="inline-start" />
        Add item manually
      </Button>

      {errors.items?.root || typeof errors.items?.message === "string" ? (
        <p className="text-sm text-destructive">
          {errors.items?.root?.message || errors.items?.message}
        </p>
      ) : null}
    </div>
  );
}
