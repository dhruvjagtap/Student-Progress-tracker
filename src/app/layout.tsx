// src/app/layout.tsx
import type { Metadata } from "next";
import Header from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Coding Performance Tracker",
  description: "Tracking coding performance of students over time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
          <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}