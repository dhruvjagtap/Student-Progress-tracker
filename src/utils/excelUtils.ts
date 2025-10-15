import { ExcelRow } from "../types/ExcelRow";

export type MergedStudent = {
    roll: string;
    name: string;
    gfgAvg: string;
    gfgAttendance: string;
    hitAvg: string;
    hitAttendance: string;
    overall: string;
};

/**
 * Merge student data from two different Excel sources (GFG + HIT)
 */
export const mergeStudentData = (
    gfgData: ExcelRow[],
    hitData: ExcelRow[]
): MergedStudent[] => {
    console.log("🔹 GFG Raw Data:", gfgData.slice(0, 5));
    console.log("🔹 HIT Raw Data:", hitData.slice(0, 5));

    const merged = gfgData.map((student, index) => {
        const roll =
            student["Roll No"] ||
            student["ROLL NO"] ||
            student["Roll Number"] ||
            student["roll"] ||
            `unknown-${index}`;

        const name =
            student["Student Name"] ||
            student["STUDENT NAME"] ||
            student["Name"] ||
            student["name"] ||
            `Unnamed-${index}`;

        const hitStudent =
            hitData.find(
                (h) =>
                    h["Roll No"] === student["Roll No"] ||
                    h["ROLL NO"] === student["ROLL NO"] ||
                    h["Roll Number"] === student["Roll Number"]
            ) ?? {};

        if (!roll || !name) {
            console.log("⚠️ Skipped invalid row:", student);
        }

        const gfgScores = [
            "Coding Problem Score out of 100",
            "Quiz score out of 100",
            "contest score out of 150",
        ].map((col) => parseFloat(String(student[col] ?? 0)) || 0);

        const gfgAvg = (
            gfgScores.reduce((a, b) => a + b, 0) / gfgScores.length
        ).toFixed(2);

        const hitScores = ["Overall - Marks (50)", "We Score (100)"].map(
            (col) => parseFloat(String(hitStudent[col] ?? 0)) || 0
        );

        const hitAvg = hitScores.length
            ? (
                hitScores.reduce((a, b) => a + b, 0) / hitScores.length
            ).toFixed(2)
            : "0";

        const gfgAttendance = `${student.attended || 0}/${(student.attended as number || 0) + (student.notAttended as number || 0)
            }`;

        const hitAttendance = `${hitStudent["Total test out of 16"] ? hitStudent["Total test out of 16"] : 0
            }/16`;

        const overall = (
            (parseFloat(gfgAvg) + parseFloat(hitAvg)) /
            2
        ).toFixed(2);

        return {
            roll: String(roll),
            name: String(name),
            gfgAvg,
            gfgAttendance,
            hitAvg,
            hitAttendance,
            overall,
        };
    });

    console.log("✅ Cleaned & merged students:", merged.slice(0, 5));
    return merged.filter(
        (s) => s.roll && s.name && !String(s.roll).includes("unknown")
    );
};
