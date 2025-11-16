"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { processHitbullseyeFile } from "@/utils/processHitbullseye";
import { HitbullseyeStudent } from "@/types/Student";
import HitbullseyeTable from "./HitbullseyeTable";


export default function HitbullseyeUploadSection() {
  const [hitFile, setHitFile] = useState<File | null>(null);
  const [finalList, setFinalList] = useState<HitbullseyeStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHitFile(file);
  };

  const handleProcess = async () => {
    if (!hitFile) return;
    setIsProcessing(true);

    try {
      const students = await processHitbullseyeFile(hitFile);
      setFinalList(students);
    } catch (err) {
      console.error("Processing error", err);
      alert("Error while processing. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcel = () => {
    if (!finalList.length) return;
    const ws = XLSX.utils.json_to_sheet(finalList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hitbullseye_Result");
    XLSX.writeFile(wb, "Hitbullseye_Result.xlsx");
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Upload Hitbullseye File</h2>

      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col gap-1">
          <span>Upload Hitbullseye File:</span>

          {!hitFile ? (
            <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition w-fit">
              Choose File
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-700 font-medium">{hitFile.name}</span>
              <button
                className="text-red-600 font-bold hover:text-red-800"
                onClick={() => setHitFile(null)}
              >
                ✖
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        disabled={!hitFile || isProcessing}
        onClick={handleProcess}
        className={`bg-green-600 text-white py-2 rounded-md mt-3 transition ${
          !hitFile ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
        }`}
      >
        {isProcessing ? "Processing..." : "Process Hitbullseye Data"}
      </button>

      {finalList.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Processed Student Data</h2>
            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Download Excel
            </button>
          </div>

          <HitbullseyeTable students={finalList} />
        </div>
      )}
    </div>
  );
}
