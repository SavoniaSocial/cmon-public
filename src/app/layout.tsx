import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "CREATES App",
  description: "AI-powered creative workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 font-[Plus Jakarta Sans]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
