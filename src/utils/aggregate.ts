/**
 * Aggregation helpers: compute attendance and coding average from parsed sheets.
 */

// A generic type for Excel row objects
export type ExcelRow = Record<string, unknown>;

// --- Utility helpers ---------------------------------------------------------

const clean = (s: unknown): string =>
    s === undefined || s === null ? '' : String(s).trim();

const lc = (s: unknown): string => clean(s).toLowerCase();

function parseDurationToMinutes(d: string): number {
    // expects "H:MM:SS" or "HH:MM:SS"
    if (!d) return 0;
    const c = clean(d);
    if (!c || c === '-' || c.toLowerCase().includes('not')) return 0;
    const parts = c.split(':').map((p) => Number(p));
    if (parts.length === 3) {
        const [h, m, s] = parts;
        if (Number.isFinite(h) && Number.isFinite(m) && Number.isFinite(s)) {
            return h * 60 + m + s / 60;
        }
    }
    // sometimes Excel may store as decimal days (0.5 -> 12 hours)
    const n = Number(c);
    if (!Number.isNaN(n)) {
        // treat as hours if ≤ 24, else as minutes
        return n <= 24 ? n * 60 : n;
    }
    return 0;
}

/**
 * Compute expected lecture duration (minutes) from header text like:
 * Lecture 1 (2025-07-26, 09:58 AM - 12:52 PM)
 */
function expectedMinutesFromHeader(header: string): number {
    const match = header.match(/\(([^)]+)\)/);
    if (!match) return 0;
    const inside = match[1];
    const timeMatch = inside.match(
        /(\d{1,2}:\d{2}\s*(AM|PM)?)\s*-\s*(\d{1,2}:\d{2}\s*(AM|PM)?)/i
    );
    if (!timeMatch) return 0;
    const start = timeMatch[1];
    const end = timeMatch[3];

    const toMin = (t: string): number => {
        const tt = t.trim();
        const ampmMatch = tt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (ampmMatch) {
            let h = Number(ampmMatch[1]);
            const m = Number(ampmMatch[2]);
            const ap = ampmMatch[3].toUpperCase();
            if (ap === 'PM' && h !== 12) h += 12;
            if (ap === 'AM' && h === 12) h = 0;
            return h * 60 + m;
        }
        const parts = tt.split(':').map(Number);
        return parts.length >= 2 ? parts[0] * 60 + parts[1] : 0;
    };

    const startMin = toMin(start);
    const endMin = toMin(end);
    const diff = endMin - startMin;
    return diff > 0 ? diff : 0;
}

// --- Attendance Summary ------------------------------------------------------

export type AttendanceSummary = {
    name: string;
    email: string;
    attended: number;
    totalLectures: number;
};

/**
 * Compute attendance summary from parsed attendance sheet.
 */
export function computeAttendanceSummary(
    attendanceRows: ExcelRow[],
    headers: string[],
    thresholdRatio = 1.0
): Record<string, AttendanceSummary> {
    const lectureCols = headers
        .map((h, idx) => ({ h, idx }))
        .filter((p) => lc(p.h).startsWith('lecture') || lc(p.h).includes('lecture'))
        .map((p) => ({ header: p.h, idx: p.idx }));

    const totalLectures = lectureCols.length;
    const summaryByEmail = new Map<string, AttendanceSummary>();

    for (const row of attendanceRows) {
        const allKeys = Object.keys(row);
        const emailKey = allKeys.find((k) => lc(k).includes('email'));
        const nameKey = allKeys.find(
            (k) =>
                lc(k).includes('user name') ||
                lc(k).includes('student name') ||
                lc(k) === 'name'
        );

        const email = clean(row[emailKey ?? '']) || '';
        const name = clean(row[nameKey ?? '']) || '';

        if (!email) continue;

        let attended = 0;
        for (const col of lectureCols) {
            const val = row[col.header];
            const minutes = parseDurationToMinutes(clean(val));
            const expected = expectedMinutesFromHeader(col.header) || 0;
            if (expected > 0) {
                if (minutes >= expected * thresholdRatio) attended += 1;
            } else if (minutes > 0) {
                attended += 1;
            }
        }

        summaryByEmail.set(email, {
            name: name || email.split('@')[0],
            email,
            attended,
            totalLectures,
        });
    }

    return Object.fromEntries(summaryByEmail);
}

// --- Coding Summary ----------------------------------------------------------

export type CodingSummary = {
    name: string;
    email: string;
    codingSum: number;
    codingColsCount: number;
    codingAvg: number;
};

/**
 * Compute average coding scores per student from parsed score sheet.
 */
export function computeCodingSummary(
    scoreRows: ExcelRow[],
    headers: string[]
): Record<string, CodingSummary> {
    const codingCols = headers
        .map((h, idx) => ({ idx, h }))
        .filter(
            (p) =>
                lc(p.h).includes('coding problem score') || lc(p.h).includes('coding score')
        )
        .map((p) => p.idx);

    const totalCodingCols = codingCols.length;
    const byEmail = new Map<string, CodingSummary>();

    for (const row of scoreRows) {
        const keys = Object.keys(row);
        const emailKey = keys.find((k) => lc(k).includes('email'));
        const nameKey = keys.find((k) => lc(k).includes('name'));

        const email = clean(row[emailKey ?? '']) || '';
        const name = clean(row[nameKey ?? '']) || '';

        if (!email) continue;

        let sum = 0;
        for (const colIdx of codingCols) {
            const headerName = headers[colIdx];
            const raw = row[headerName];
            const s = clean(raw);
            if (!s || s === '-' || s.toLowerCase().includes('not')) {
                sum += 0;
            } else {
                const n = parseFloat(s);
                sum += Number.isFinite(n) ? n : 0;
            }
        }

        const prev = byEmail.get(email) ?? {
            name: name || email.split('@')[0],
            email,
            codingSum: 0,
            codingColsCount: 0,
            codingAvg: 0,
        };

        prev.codingSum += sum;
        prev.codingColsCount += totalCodingCols;
        byEmail.set(email, prev);
    }

    const output: Record<string, CodingSummary> = {};
    for (const [email, v] of byEmail) {
        const avg = v.codingColsCount
            ? +(v.codingSum / v.codingColsCount).toFixed(2)
            : 0;
        output[email] = {
            ...v,
            codingAvg: avg,
        };
    }

    return output;
}
