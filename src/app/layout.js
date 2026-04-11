import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  display: 'swap',
});

export const metadata = {
  title: "minChap TikTok Minis CMS",
  description: "minChap TikTok Minis CMS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${ibmPlexSansThai.className} min-h-full flex flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
