import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CartProvider } from "@/lib/cart";
import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { AuthProvider } from "@/lib/auth";
import { TaxonomyProvider } from "@/components/taxonomy/TaxonomyProvider";
import { loadTaxonomy } from "@/lib/taxonomy-api";
import { ApiLoadingBar } from "@/components/ui/ApiLoadingBar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Dearly's — Gifting, but thoughtful",
    template: "%s · Dearly's",
  },
  description:
    "Curated gift hampers, personalised keepsakes and small-batch gourmet, hand-packed and delivered across India.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const taxonomy = await loadTaxonomy();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TaxonomyProvider taxonomy={taxonomy}>
          <GoogleAuthProvider>
            <AuthProvider>
              <CartProvider>
                <ApiLoadingBar />
                <SiteChrome>{children}</SiteChrome>
              </CartProvider>
            </AuthProvider>
          </GoogleAuthProvider>
        </TaxonomyProvider>
      </body>
    </html>
  );
}
