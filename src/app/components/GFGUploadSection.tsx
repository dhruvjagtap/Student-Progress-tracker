"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { processGFGFiles } from "@/utils/processGFG";
import { Student } from "@/types/Student";
import StudentTable from "./StudentTable";

interface Props {
  department: string; // COMP | IT | ENTC
}

export default function GFGUploadSection({ department }: Props) {
  const [javaFile, setJavaFile] = useState<File | null>(null);
  const [cppFile, setCppFile] = useState<File | null>(null);
  const [rollCallFile, setRollCallFile] = useState<File | null>(null);
  const [finalList, setFinalList] = useState<Student[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Department-specific cache keys
  const rollKey = `gfg_rollcall_${department}`;
  const rollNameKey = `gfg_rollcall_name_${department}`;

  /** Save RollCall file to localStorage */
  const saveRollCallToCache = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(rollKey, reader.result as string);
      localStorage.setItem(rollNameKey, file.name);
    };
    reader.readAsDataURL(file);
  };

  /** Load cached RollCall file if exists */
  useEffect(() => {
    const cachedData = localStorage.getItem(rollKey);
    const cachedName = localStorage.getItem(rollNameKey);

    if (cachedData && cachedName) {
      const arr = cachedData.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream";

      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);

      const restoredFile = new File([u8arr], cachedName, { type: mime });
      setRollCallFile(restoredFile);
    }
  }, [rollKey, rollNameKey]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    isRollCall = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);

      if (isRollCall) {
        saveRollCallToCache(file);
      }
    }
  };

  const downloadExcel = () => {
    if (!finalList.length) return;
    const ws = XLSX.utils.json_to_sheet(finalList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GFG_Result");
    XLSX.writeFile(wb, "GFG_Attendance_&_Assessment.xlsx");
  };

  const handleProcess = async () => {
    if (!javaFile || !cppFile || !rollCallFile) return;
    setIsProcessing(true);

    try {
      const students = await processGFGFiles(javaFile, cppFile, rollCallFile);
      setFinalList(students);
    } catch (err) {
      console.error("Process error", err);
      alert("Error while processing. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Upload GeeksforGeeks Files</h2>

      <div className="p-4 flex flex-col sm:flex-row gap-4">

        {/* Java File */}
        <div className="flex flex-col gap-1">
          <span>Upload Java File:</span>
          {!javaFile ? (
            <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
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
                className="text-red-600 font-bold"
                onClick={() => setJavaFile(null)}
              >
                ✖
              </button>
            </div>
          )}
        </div>

        {/* C++ File */}
        <div className="flex flex-col gap-1">
          <span>Upload C++ File:</span>
          {!cppFile ? (
            <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
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
                className="text-red-600 font-bold"
                onClick={() => setCppFile(null)}
              >
                ✖
              </button>
            </div>
          )}
        </div>

        {/* Roll Call File (Cached) */}
        <div className="flex flex-col gap-1">
          <span>Upload Roll Call File:</span>
          {!rollCallFile ? (
            <label className="px-4 py-2 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
              Choose File
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e, setRollCallFile, true)
                }
              />
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-700 font-medium">{rollCallFile.name}</span>
              <button
                className="text-red-600 font-bold"
                onClick={() => {
                  setRollCallFile(null);
                  localStorage.removeItem(rollKey);
                  localStorage.removeItem(rollNameKey);
                }}
              >
                ✖
              </button>
            </div>
          )}
        </div>

      </div>

      <button
        disabled={!javaFile || !cppFile || !rollCallFile || isProcessing}
        onClick={handleProcess}
        className="bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
