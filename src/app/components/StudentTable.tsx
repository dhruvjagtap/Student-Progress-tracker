// src/app/components/StudentTable.tsx
import React from "react";

interface Student {
  name: string;
  rollNo: string;
  division: string;
  email: string;
  sessionsAttended?: string;
  testsAppeared?: string;
  avgCoding?: number;
}

interface Props {
  data: Student[];
}

const StudentTable: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl shadow-sm border border-gray-200">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Roll No</th>
            <th className="px-4 py-2">Division</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Sessions Attended</th>
            <th className="px-4 py-2">Tests Appeared</th>
            {/* <th className="px-4 py-2">Avg Coding Score</th> */}
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr
              key={i}
              className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-t`}
            >
              <td className="px-4 py-2">{s.name}</td>
              <td className="px-4 py-2">{s.rollNo}</td>
              <td className="px-4 py-2">{s.division}</td>
              <td className="px-4 py-2">{s.email}</td>
              <td className="px-4 py-2">{s.sessionsAttended}</td>
              <td className="px-4 py-2">{s.testsAppeared}</td>
              {/* <td className="px-4 py-2">
                {s.avgCoding ? s.avgCoding.toFixed(2) : "-"}
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
