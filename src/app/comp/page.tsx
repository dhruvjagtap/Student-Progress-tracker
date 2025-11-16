import GFGUploadSection from "../components/GFGUploadSection";
import HitbullseyeUploadSection from "../components/HitbullseyeUploadSection";

export default function CompPage() {
  return (
    <main className="h-full bg-gray-50">
      <GFGUploadSection department="COMP" />
      <hr className="my-6 border-gray-400" />
      <HitbullseyeUploadSection />
    </main>
  );
}
