'use client';
import React, { useState } from 'react';
import { parseWorkbookFile, ParsedWorkbook } from '../../utils/parseExcel';
import { buildFinalStudentList } from '../../utils/mergeStudents';
import StudentTable from './StudentTable';
import { Student } from '../../types/Student';

export default function UploadSection() {
  const [filesParsed, setFilesParsed] = useState<ParsedWorkbook[]>([]);
  const [finalList, setFinalList] = useState<Student[]>([]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseWorkbookFile(file);
      setFilesParsed((prev) => [...prev, parsed]); // ✅ now type-safe
    } catch (err) {
      alert('Failed to parse file: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleMergeAll() {
    if (filesParsed.length === 0) {
      alert('Upload at least one Excel file (Java and/or CPP).');
      return;
    }
    const merged = buildFinalStudentList(filesParsed);
    setFinalList(merged);
  }

  function handleClear() {
    setFilesParsed([]);
    setFinalList([]);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>
          Upload Excel (Java / CPP) - will parse first two sheets:
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ marginLeft: 8 }} />
        </label>
        <button onClick={handleMergeAll} style={{ marginLeft: 12 }}>
          Merge & Show
        </button>
        <button onClick={handleClear} style={{ marginLeft: 8 }}>
          Clear
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Files parsed:</strong> {filesParsed.length}
      </div>

      {finalList.length > 0 && <StudentTable data={finalList} />}
    </div>
  );
}
