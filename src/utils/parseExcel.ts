// utils/parseExcel.ts
import * as XLSX from "xlsx";
import { RawResult } from "@/types/RawResult";
import { normalizeEmail, normalizeRoll, isAttendancePresent } from "./helpers";

/**
 * readWorkbookFromFile - reads file and returns workbook
 */
export async function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            try {
                const wb = XLSX.read(data, { type: "array" });
                resolve(wb);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * parseGFGWorkbook - parse workbook for a single GFG file (java or cpp)
 * returns a map: email -> RawResult
 */
export function parseGFGWorkbook(wb: XLSX.WorkBook): Record<string, RawResult> {
    const names = wb.SheetNames;

    const attendanceSheetName =
        names.find((n) => n.toLowerCase().includes("attendance")) ?? names[0];
    const assessmentSheetName =
        names.find((n) => n.toLowerCase().includes("weekly assessment")) ??
        names[1] ??
        names[0];

    const attendanceSheet = wb.Sheets[attendanceSheetName];
    const assessmentSheet = wb.Sheets[assessmentSheetName];

    const attendanceRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
        attendanceSheet,
        { defval: "" }
    );

    // --- Parse attendance ---
    // const headerGrid = XLSX.utils.sheet_to_json(attendanceSheet, {
    //     header: 1,
    //     range: 0,
    //     defval: "",
    // }) as (string | number)[][];

    // Identify columns with "Lecture" in header
    const firstRow = attendanceRows[0] || {};
    const allKeys = Object.keys(firstRow);
    const lectureColumns = allKeys.filter((k) => /lecture/i.test(k));

    const attendanceMap: Record<
        string,
        {
            name: string;
            email: string;
            rollNo?: string;
            totalSessions: number;
            sessionsAttended: number;
            division?: string;
        }
    > = {};

    attendanceRows.forEach((r) => {
        const row = r as Record<string, unknown>;
        const email = normalizeEmail(
            (row["Email"] ??
                row["email"] ??
                row["E-mail"] ??
                "") as string
        );
        const name =
            (row["User Name"] ??
                row["Name"] ??
                row["Full Name"] ??
                row["User"] ??
                row["user name"] ??
                "") as string;
        const roll = normalizeRoll(
            (row["Roll No"] ?? row["Roll"] ?? row["RollNo"] ?? row["PRN"]) as string
        );
        const division = (row["Division"] ?? row["division"]) as string | undefined;

        const total = lectureColumns.length;
        let present = 0;
        lectureColumns.forEach((k) => {
            const cell = row[k] as string | number | null | undefined;
            if (isAttendancePresent(cell)) present++;
        });

        const key = email || roll || name.toLowerCase();

        attendanceMap[key] = {
            name,
            email,
            rollNo: roll,
            totalSessions: total,
            sessionsAttended: present,
            division,
        };
    });

    // --- Parse assessment (weekly report) ---
    const headersGrid = XLSX.utils.sheet_to_json(assessmentSheet, {
        header: 1,
        range: 0,
        defval: "",
    }) as (string | number)[][];

    const headerRow1 = headersGrid[0] || [];
    const headerRow2 = headersGrid[1] || [];
    const headerRow3 = headersGrid[2] || [];

    const codingColIndexes: number[] = [];
    for (let c = 0; c < headerRow3.length; c++) {
        const h1 = String(headerRow1[c] || "").toLowerCase();
        const h2 = String(headerRow2[c] || "").toLowerCase();
        const h3 = String(headerRow3[c] || "").toLowerCase();
        if (h1.includes("coding") || h2.includes("coding") || h3.includes("coding")) {
            codingColIndexes.push(c);
        }
    }

    console.log("Detected Coding Columns (indexes):", codingColIndexes);

    const ref = assessmentSheet["!ref"];
    if (!ref) throw new Error("Assessment sheet is empty or missing range info (!ref)");
    const range = XLSX.utils.decode_range(ref);

    const assessmentMap: Record<
        string,
        {
            totalTests: number;
            testsAppeared: number;
            avgCoding?: number;
            name?: string;
            email?: string;
            rollNo?: string;
        }
    > = {};

    for (let r = 3; r <= range.e.r; r++) {
        const emailCell = assessmentSheet[XLSX.utils.encode_cell({ r, c: 1 })];
        const nameCell = assessmentSheet[XLSX.utils.encode_cell({ r, c: 0 })];
        const email = normalizeEmail(emailCell?.v || "");
        const name = String(nameCell?.v || "");

        if (!email && !name) continue;

        const total = codingColIndexes.length;
        let appeared = 0;
        const scores: number[] = [];

        codingColIndexes.forEach((colIdx) => {
            const addr = XLSX.utils.encode_cell({ r, c: colIdx });
            const cell = assessmentSheet[addr];
            const val = cell ? String(cell.v).trim().toLowerCase() : "";
            const absent = "Not Attended";

            if (val !== "" && val !== "-" && val !== "#N/A" && val !== absent.trim().toLowerCase() && val !== "Not Attended" && val !== "Not attended") {
                appeared++;
                const num = Number(val.replace(/[^\d.-]/g, ""));
                if (!Number.isNaN(num)) scores.push(num);
            }
        });

        const avg =
            scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : undefined;
        const key = email || name.toLowerCase();

        assessmentMap[key] = {
            totalTests: total,
            testsAppeared: appeared,
            avgCoding: avg,
            name,
            email,
        };
    }

    // --- Combine attendanceMap & assessmentMap ---
    const resultMap: Record<string, RawResult> = {};
    const keys = new Set<string>([
        ...Object.keys(attendanceMap),
        ...Object.keys(assessmentMap),
    ]);

    keys.forEach((k) => {
        const a = attendanceMap[k];
        const s = assessmentMap[k];

        const name = a?.name || s?.name || "";
        const email = a?.email || s?.email || (k.includes("@") ? k : "");
        const rollNo = a?.rollNo || s?.rollNo || "";
        const division = a?.division;

        const hasAttendance = !!a;

        const totalSessions = hasAttendance ? (a?.totalSessions ?? lectureColumns.length) : lectureColumns.length;
        const sessionsAttended = hasAttendance ? (a?.sessionsAttended ?? 0) : 0;

        // Determine if this student exists in the assessment sheet
        const hasAssessment = !!s;

        // Use actual values if available, otherwise assign default (0 out of global total)
        const totalTests = hasAssessment ? (s?.totalTests ?? codingColIndexes.length) : codingColIndexes.length;
        const testsAppeared = hasAssessment ? (s?.testsAppeared ?? 0) : 0;

        const avgCoding =
            typeof s?.avgCoding === "number" ? s.avgCoding : null;


        const mapKey =
            (email && normalizeEmail(email)) ||
            (rollNo && normalizeRoll(rollNo)) ||
            name.toLowerCase();

        resultMap[mapKey] = {
            name,
            email,
            rollNo,
            division,
            totalSessions,
            sessionsAttended,
            totalTests,
            testsAppeared,
            avgCodingScore: avgCoding,

        };
    });

    return resultMap;
}
