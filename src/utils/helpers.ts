// utils/helpers.ts
export const normalizeEmail = (s?: string) =>
    (s || "").toString().trim().toLowerCase();

export const normalizeRoll = (s?: string) =>
    (s || "").toString().trim().toUpperCase();

export function isAttendancePresent(cell: string | number | null | undefined): boolean {
    if (cell === undefined || cell === null) return false;
    const v = String(cell).trim();
    if (v === "" || v === "-" || v.toLowerCase() === "not attended" || v === "#N/A") return false;
    // treat any numeric or time-like or text as present (per spec)
    if (/^\d+(:\d+){1,2}\s*(AM|PM|am|pm)?$/.test(v)) return true; // time
    if (/^\d+(\.\d+)?$/.test(v)) return true; // numeric
    // anything else non-empty -> treat as present (conservative)
    return true;
}

export function isTestPresent(cell: string | number | null | undefined): boolean {
    if (cell === undefined || cell === null) return false;
    const v = String(cell).trim();
    if (v === "" || v === "-") return false;
    // 0 is considered present
    return true;
}
