This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# MarketOS 
> **The operating system for Africa's informal traders.**

MarketOS is a lightweight, mobile-first platform designed to help informal market traders move away from memory-based tracking and paper notebooks. It provides essential tools to establish digital business identities, track inventory, and secure digital transactions against fraud.

---

## 🛠️ Core Features

*   **Market Passport:** A verified, QR-enabled digital business identity displaying the trader's profile, market location, and reputation score.
*   **Smart Inventory:** Effortless product and sales tracking with automatic low-stock alerts.
*   **Verified Payments:** A fraud-prevention receipt system generating unique QR codes to verify transactions, eliminating the risk of fake digital payment screenshots.
*   **AI Business Advisor:** An intelligent assistant that analyzes sales history to deliver actionable local business insights (e.g., restocking alerts, peak sales days).

---

## 💻 Tech Stack (Next.js Monorepo)

*   **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Recharts
*   **Backend & Database:** Next.js Route Handlers (API), Prisma ORM, PostgreSQL (Neon)
*   **Authentication:** Auth.js (NextAuth) with JWT
*   **AI:** Gemini API / OpenAI API
*   **Deployment:** Vercel
