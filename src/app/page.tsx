// src/app/page.tsx
import GFGUploadSection from "./components/GFGUploadSection";
import HitbullseyeUploadSection from "./components/HitbullseyeUploadSection";
export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      <GFGUploadSection />
      <hr className="my-6 border-gray-400" />
      <HitbullseyeUploadSection />
    </main>
  );
}

