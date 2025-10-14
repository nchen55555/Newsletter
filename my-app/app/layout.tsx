import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { SubscriptionProvider } from "./components/subscription_context";

const sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    <html lang="en" className={sans.variable}>
      <body className={`antialiased font-sans bg-[#FFFCF8] min-h-screen ${sans.className}`}>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
      </body>
    </html>
  );
}
