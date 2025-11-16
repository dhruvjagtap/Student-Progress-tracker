// src/app/components/UploadSection.tsx

"use client";
import { useState } from "react";
import { processGFGFiles } from "@/utils/processGFG";
import StudentTable from "./StudentTable";
import { Student } from "@/types/Student";
import * as XLSX from "xlsx";

export default function GFGUploadSection() {
  const [javaFile, setJavaFile] = useState<File | null>(null);
  const [cppFile, setCppFile] = useState<File | null>(null);
  const [rollCallFile, setRollCallFile] = useState<File | null>(null);
  const [finalList, setFinalList] = useState<Student[]>([]); // store processed student data
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  const handleProcess = async () => {
    if (!javaFile || !cppFile || !rollCallFile) return;
    setIsProcessing(true);

    try {
      const students = await processGFGFiles(javaFile, cppFile, rollCallFile);
      console.log("Final students:", students);
      setFinalList(students);
    } catch (err) {
      console.error("Processing error", err);
      alert("Error while processing. See console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcel = () => {
    if (!finalList.length) return;
    const ws = XLSX.utils.json_to_sheet(finalList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GFG_Result");
    XLSX.writeFile(wb, "GFG_Attendance_&_Assessment.xlsx");
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Upload GeeksforGeeks Files</h2>

      {/* Upload inputs */}
<div className="p-4 flex flex-col sm:flex-row gap-4">

  {/* Java Upload */}
  <div className="flex flex-col gap-1">
    <span>Java File:</span>
    {!javaFile ? (
      <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition">
        Choose File
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => handleFileChange(e, setJavaFile)}
        />
      </label>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-green-700 font-medium">{javaFile.name}</span>
        <button
          className="text-red-600 font-bold hover:text-red-800"
          onClick={() => setJavaFile(null)}
        >
          ✖
        </button>
      </div>
    )}
  </div>

  {/* C++ Upload */}
  <div className="flex flex-col gap-1">
    <span>C++ File:</span>
    {!cppFile ? (
      <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition">
        Choose File
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => handleFileChange(e, setCppFile)}
        />
      </label>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-green-700 font-medium">{cppFile.name}</span>
        <button
          className="text-red-600 font-bold hover:text-red-800"
          onClick={() => setCppFile(null)}
        >
          ✖
        </button>
      </div>
    )}
  </div>

  {/* Roll Call Upload */}
  <div className="flex flex-col gap-1">
    <span>Roll Call File:</span>
    {!rollCallFile ? (
      <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition">
        Choose File
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => handleFileChange(e, setRollCallFile)}
        />
      </label>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-green-700 font-medium">{rollCallFile.name}</span>
        <button
          className="text-red-600 font-bold hover:text-red-800"
          onClick={() => setRollCallFile(null)}
        >
          ✖
        </button>
      </div>
    )}
  </div>
</div>


      {/* Process button */}
      <button
        disabled={!javaFile || !cppFile || !rollCallFile || isProcessing}
        onClick={handleProcess}
        className={`bg-green-600 text-white py-2 rounded-md mt-3 transition ${
          !javaFile || !cppFile || !rollCallFile
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-green-700"
        }`}
      >
        {isProcessing ? "Processing..." : "Process GFG Data"}
      </button>

      {/* Table + Download */}
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

          <StudentTable data={finalList} />
        </div>
      )}
    </div>
  );
}