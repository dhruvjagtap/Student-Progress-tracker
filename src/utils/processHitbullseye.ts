// utils/processHitbullseye.ts
import * as XLSX from "xlsx";
import { HitbullseyeStudent } from "@/types/Student";
import { normalizeRoll, normalizeEmail } from "./helpers";

export async function processHitbullseyeFile(
    file: File
): Promise<HitbullseyeStudent[]> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(
        sheet,
        {
            defval: "-",
            range: 3, // skip first 3 rows
        }
    );

    if (jsonData.length === 0) return [];

    const allCols = Object.keys(jsonData[0]);

    // Detect test columns
    const overallCols = allCols.filter(
        (col) => col.toLowerCase().includes("overall") && col.includes("50")
    );

    const weScoreCols = allCols.filter(
        (col) => col.toLowerCase().includes("we") && col.includes("100")
    );

    const totalTests = overallCols.length + weScoreCols.length;

    const results: HitbullseyeStudent[] = jsonData.map((row) => {
        const name = (row["Name"] || row["Student Name"] || "-") as string;
        const rollRaw = (row["Roll No"] || row["Roll"] || "-") as string;
        const rollNo = normalizeRoll(rollRaw);

        const division = (row["Division"] || row["Section"] || "-") as string;
        const email = normalizeEmail((row["Email"] || "-") as string);

        // Count number of appeared tests
        let appeared = 0;
        [...overallCols, ...weScoreCols].forEach((col) => {
            const val = row[col];
            if (val !== "-" && val !== "" && val !== null && val !== undefined) {
                appeared++;
            }
        });

        // Latest marks
        const lastOverall = row[overallCols[overallCols.length - 1]];
        const recentAptitudeMarks =
            lastOverall === "-" || lastOverall === null || lastOverall === undefined
                ? "AB"
                : lastOverall;

        const lastWe = row[weScoreCols[weScoreCols.length - 1]];
        const recentCodingScore =
            lastWe === "-" || lastWe === null || lastWe === undefined
                ? "AB"
                : lastWe;


        return {
            name,
            rollNo,
            division,
            email,
            testsAppeared: `${appeared} out of ${totalTests}`,
            recentAptitudeMarks,
            recentCodingScore,
        };
    });

    // Sort by division → roll no
    const divisionOrder = { A: 0, B: 1, C: 2 };

    results.sort((a, b) => {
        const da = (a.division || "").trim().toUpperCase();
        const db = (b.division || "").trim().toUpperCase();

        const pa = divisionOrder[da as keyof typeof divisionOrder] ?? 99;
        const pb = divisionOrder[db as keyof typeof divisionOrder] ?? 99;

        if (pa !== pb) return pa - pb;

        return (a.rollNo || "").localeCompare(b.rollNo || "");
    });

    return results;
}
