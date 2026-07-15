import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SaleReceiptData = {
  saleIds: string[];
  totalAmount: number;
  itemCount: number;
  sellerName: string;
  timestamp: string;
  qrCodeUrl: string;
  receiptPath: string;
};

type SaleReceiptProps = {
  receipt: SaleReceiptData;
  onNewSale?: () => void;
};

export function SaleReceipt({ receipt, onNewSale }: SaleReceiptProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardDescription className="text-sm text-primary">
          Sale confirmed
        </CardDescription>
        <CardTitle className="text-2xl">Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Seller</dt>
            <dd className="font-medium">{receipt.sellerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="font-medium">{receipt.itemCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-semibold tabular-nums">
              {receipt.totalAmount.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Time</dt>
            <dd className="text-right">
              {new Date(receipt.timestamp).toLocaleString()}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-3 border-t border-border/40 pt-6">
          <Image
            src={receipt.qrCodeUrl}
            alt="Receipt QR code"
            width={180}
            height={180}
            unoptimized
            className="rounded-xl bg-white p-3 shadow-sm"
          />
          <p className="text-center text-xs text-muted-foreground">
            Scan to open receipt
          </p>
        </div>
      </CardContent>
      {onNewSale ? (
        <CardFooter>
          <Button type="button" className="w-full" onClick={onNewSale}>
            New sale
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function buildReceiptQrUrl(path: string) {
  const absolute =
    typeof window !== "undefined"
      ? `${window.location.origin}${path}`
      : path;
  return `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(absolute)}&choe=UTF-8`;
}
