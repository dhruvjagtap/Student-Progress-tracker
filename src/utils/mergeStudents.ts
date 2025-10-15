import {
    computeAttendanceSummary,
    computeCodingSummary,
    AttendanceSummary,
    CodingSummary,
} from "./aggregate";

export type ParsedWorkbook = {
    attendanceRows: Record<string, unknown>[];
    attendanceHeaders: string[];
    scoreRows: Record<string, unknown>[];
    scoreHeaders: string[];
};

export type FinalStudent = {
    name: string;
    email: string;
    attended: number;
    totalLectures: number;
    avgCoding: number;
    codingColsCount: number;
};

/**
 * Given parsed results for multiple workbooks, produce final merged student list by email.
 * parsedList: array of { attendanceRows, attendanceHeaders, scoreRows, scoreHeaders }
 */
export function buildFinalStudentList(parsedList: ParsedWorkbook[]): FinalStudent[] {
    // accumulate across all files
    const combinedAttendanceMap: Map<string, AttendanceSummary> = new Map();
    const combinedCodingMap: Map<string, CodingSummary> = new Map();

    for (const parsed of parsedList) {
        const attSummary = computeAttendanceSummary(
            parsed.attendanceRows || [],
            parsed.attendanceHeaders || []
        );
        const codingSummary = computeCodingSummary(
            parsed.scoreRows || [],
            parsed.scoreHeaders || []
        );

        // merge attendance: if email exists, sum attended and totalLectures
        for (const [email, data] of Object.entries(attSummary)) {
            const prev =
                combinedAttendanceMap.get(email) || {
                    name: data.name,
                    email,
                    attended: 0,
                    totalLectures: 0,
                };
            prev.attended += data.attended;
            prev.totalLectures += data.totalLectures || 0;
            combinedAttendanceMap.set(email, prev);
        }

        // merge coding: sum codingSum and codingColsCount
        for (const [email, data] of Object.entries(codingSummary)) {
            const prev =
                combinedCodingMap.get(email) || {
                    name: data.name,
                    email,
                    codingSum: 0,
                    codingColsCount: 0,
                    codingAvg: 0,
                };
            prev.codingSum += data.codingSum || 0;
            prev.codingColsCount += data.codingColsCount || 0;
            combinedCodingMap.set(email, prev);
        }
    }

    // union of all emails from both maps
    const allEmails = new Set<string>([
        ...combinedAttendanceMap.keys(),
        ...combinedCodingMap.keys(),
    ]);

    const final: FinalStudent[] = [];

    for (const email of allEmails) {
        const att =
            combinedAttendanceMap.get(email) || {
                name: "",
                email,
                attended: 0,
                totalLectures: 0,
            };
        const c =
            combinedCodingMap.get(email) || {
                name: "",
                email,
                codingSum: 0,
                codingColsCount: 0,
                codingAvg: 0,
            };

        const name = att.name || c.name || email.split("@")[0];
        const avgCoding = c.codingColsCount
            ? +(c.codingSum / c.codingColsCount).toFixed(2)
            : 0;

        final.push({
            name,
            email,
            attended: att.attended,
            totalLectures: att.totalLectures || 0,
            avgCoding,
            codingColsCount: c.codingColsCount || 0,
        });
    }

    // sort by name
    final.sort((a, b) => a.name.localeCompare(b.name));
    return final;
}
