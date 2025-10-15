// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Coding Performance Tracker",
  description: "Tracking coding performance of students over time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', background: '#f0f0f0', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Student Coding Performance Tracker
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
      </body>
    </html>
  );
}