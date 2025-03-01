import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import WalletErrorSuppressor from "../components/WalletErrorSuppressor";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletErrorSuppressor />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
