import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Medical Assistant AI",
  description: "AI Medical Assistant designed to aquire relevant information from patients to help doctors make diagnoses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <UserProvider>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
      </UserProvider>
    </html>
  );
}
