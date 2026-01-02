import type { Metadata } from "next";
import "./globals.css";
import { SubscriptionProvider } from "./components/subscription_context";
import { LayoutDialogs } from "./components/layout-dialogs";
import { StatusCheckinProvider } from "./components/status-checkin-context";

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
    <html lang="en" className="dark">
      <body className="antialiased font-sans min-h-screen">
          <SubscriptionProvider>
            <StatusCheckinProvider>
              {children}
              <LayoutDialogs />
            </StatusCheckinProvider>
          </SubscriptionProvider>
      </body>
    </html>
  );
}
