// utils/processGFG.ts
import { readWorkbookFromFile, parseGFGWorkbook } from "./parseExcel";
import { normalizeEmail, normalizeRoll } from "./helpers";
import { Student } from "@/types/Student";
import * as XLSX from "xlsx";

/**
 * main entry: given three File objects, return Student[] final output
 */
export async function processGFGFiles(javaFile: File, cppFile: File, rollCallFile: File): Promise<Student[]> {
    const [javaWB, cppWB, rollWB] = await Promise.all([
        readWorkbookFromFile(javaFile),
        readWorkbookFromFile(cppFile),
        readWorkbookFromFile(rollCallFile),
    ]);

    const javaMap = parseGFGWorkbook(javaWB); // key: email or roll fallback
    const cppMap = parseGFGWorkbook(cppWB);

    // parse rollcall sheet into simple rows
    const rollSheet = rollWB.Sheets[rollWB.SheetNames[0]];
    const rollRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(rollSheet, { defval: "" });

    const results: Student[] = [];

    for (const row of rollRows) {
        const name = (row["Name"] ?? row["name"] ?? "") as string;
        const rollNoRaw = (row["Roll No"] ?? row["Roll"] ?? row["RollNo"] ?? row["PRN"] ?? "") as string;
        const rollNo = normalizeRoll(rollNoRaw);
        const division = (row["Division"] ?? row["division"] ?? "") as string;
        const emailRaw = (row["Email ID"] ?? row["Email"] ?? row["email"] ?? row["Email ID:  Kindly enter the Email ID which is registered for GFG "] ?? "") as string;
        const email = normalizeEmail(emailRaw);

        // If Email ID = "Not Registered" (exact match or case-insensitive)
        if (String(emailRaw).toLowerCase().includes("not registered")) {
            results.push({
                name,
                rollNo,
                division,
                email: emailRaw,
                sessionsAttended: "-",
                testsAppeared: "-",
            });
            continue;
        }

        // find an entry in javaMap or cppMap by email first, then by rollNo
        const keyEmail = email || null;
        const keyRoll = rollNo || null;

        const javaKey = keyEmail && javaMap[keyEmail] ? keyEmail : (keyRoll && javaMap[keyRoll] ? keyRoll : null);
        const cppKey = keyEmail && cppMap[keyEmail] ? keyEmail : (keyRoll && cppMap[keyRoll] ? keyRoll : null);

        const javaEntry = javaKey ? javaMap[javaKey] : undefined;
        const cppEntry = cppKey ? cppMap[cppKey] : undefined;

        const anyJavaEntry = Object.values(javaMap)[0];

        // If none found in both
        if (!javaEntry && !cppEntry) {
            results.push({
                name,
                rollNo,
                division,
                email: emailRaw || "",
                sessionsAttended: `0 out of ${anyJavaEntry.totalSessions}`,
                testsAppeared: `0 out of ${anyJavaEntry.testsAppeared}`,
            });
            continue;
        }

        // If only one found, choose it
        let chosen = javaEntry ?? cppEntry;

        if (javaEntry && cppEntry) {
            // If both exist, choose one with higher sessionsAttended, if tie use higher testsAppeared.
            if ((javaEntry.sessionsAttended ?? 0) > (cppEntry.sessionsAttended ?? 0)) {
                chosen = javaEntry;
            } else if ((javaEntry.sessionsAttended ?? 0) < (cppEntry.sessionsAttended ?? 0)) {
                chosen = cppEntry;
            } else {
                // tie -> check tests appeared
                if ((javaEntry.testsAppeared ?? 0) >= (cppEntry.testsAppeared ?? 0)) {
                    chosen = javaEntry;
                } else {
                    chosen = cppEntry;
                }
            }
        }

        // format output strings
        const sAtt = (chosen && chosen.totalSessions && typeof chosen.sessionsAttended === "number")
            ? `${chosen.sessionsAttended} out of ${chosen.totalSessions}`
            : "-";

        const tApp = (chosen && typeof chosen.testsAppeared === "number")
            ? `${chosen.testsAppeared} out of ${chosen.totalTests ?? 0}`
            : "-";

        results.push({
            name: name || (chosen && chosen.name) || "",
            rollNo: rollNo || (chosen && chosen.rollNo) || "",
            division: division || (chosen && chosen.division) || "",
            email: emailRaw || (chosen && chosen.email) || "",
            sessionsAttended: sAtt,
            testsAppeared: tApp,
        });
    }

    // final sorting: Division order A, B, C then by Roll No
    const divisionOrder = { A: 0, B: 1, C: 2 };
    results.sort((a, b) => {
        const da = (a.division || "").toString().trim().toUpperCase();
        const db = (b.division || "").toString().trim().toUpperCase();
        const pa = divisionOrder[da as keyof typeof divisionOrder] ?? 99;
        const pb = divisionOrder[db as keyof typeof divisionOrder] ?? 99;
        if (pa !== pb) return pa - pb;
        // fallback compare roll codes lexicographically (they may be like TCA01)
        return (a.rollNo || "").localeCompare(b.rollNo || "");
    });

    return results;
}
