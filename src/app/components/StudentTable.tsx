'use client';
import React from 'react';
import * as XLSX from 'xlsx';

type Student = {
  name: string;
  email: string;
  avgCoding: number;
  attended: number;
  totalLectures: number;
};

type Props = { data: Student[] };


export default function StudentTable({ data }: Props) {
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StudentData');
    XLSX.writeFile(wb, 'GFG_Combined_Data.xlsx');
  };

  return (
    <div>
      <button onClick={downloadExcel} style={{ marginBottom: 12 }}>
        Download Excel
      </button>
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Avg Coding Score</th>
            <th>Attendance (attended / total)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={`${s.email}-${i}`}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.avgCoding}</td>
              <td>
                {s.attended}/{s.totalLectures}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
