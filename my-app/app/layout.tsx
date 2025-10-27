import type { Metadata } from "next";
import "./globals.css";
import { SubscriptionProvider } from "./components/subscription_context";

export const metadata: Metadata = {
  title: "the niche",
  description: "shop all startups",
  verification: {
    google: "jxmmAeRyvNEjyrdI422yt7IrqdDA2XiQaOk0YDt_1wQ"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#FFFCF8] min-h-screen">
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
      </body>
    </html>
  );
}
