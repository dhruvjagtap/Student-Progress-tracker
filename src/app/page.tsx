// src/app/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <main className="h-full flex flex-col items-center p-6">
      <h1 className="text-2xl font-semibold mb-6">Select Department</h1>

      <div className="flex gap-4 ">
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => router.push("/comp")}
        >
          COMP
        </button>

        <button
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => router.push("/it")}
        >
          IT
        </button>

        <button
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          onClick={() => router.push("/entc")}
        >
          ENTC
        </button>
      </div>
    </main>
  );
}