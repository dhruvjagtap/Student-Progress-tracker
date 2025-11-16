import GFGUploadSection from "../components/GFGUploadSection";
import HitbullseyeUploadSection from "../components/HitbullseyeUploadSection";

export default function ENTCPage() {
  return (
    <main className="h-full bg-gray-50">
      <GFGUploadSection department="ENTC" />
      <hr className="my-6 border-gray-400" />
      <HitbullseyeUploadSection />
    </main>
  );
}
