import type { Metadata } from "next";
import { DM_Mono, Lora, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Freshwater Fish Compatibility Advisor",
  description:
    "A field-guide style freshwater fish compatibility web app built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${lora.variable} ${dmMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
