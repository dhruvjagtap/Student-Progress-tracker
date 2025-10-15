import * as XLSX from "xlsx";

/** Helpers to normalize strings for header detection */
const clean = (s: unknown): string =>
    s === undefined || s === null ? "" : String(s).trim();

const lc = (s: unknown): string => clean(s).toLowerCase();

/** Represents one row of parsed data (header -> cell) */
export type ExcelRow = Record<string, string | number | boolean | null | undefined>;

/** Represents the output of one parsed workbook */
export interface ParsedWorkbook {
    attendanceRows: ExcelRow[];
    attendanceHeaders: string[];
    scoreRows: ExcelRow[];
    scoreHeaders: string[];
}

/**
 * Parse a workbook File into two cleaned sheets:
 * - attendanceRows: array of objects (headers -> cell)
 * - scoreRows: array of objects (headers -> cell)
 *
 * This function auto-detects header row by searching for 'email' or 'name'.
 */
export async function parseWorkbookFile(file: File): Promise<ParsedWorkbook> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: "array" });

                // take first two sheets if present
                const sheetNames = wb.SheetNames.slice(0, 2);

                const results: ParsedWorkbook = {
                    attendanceRows: [],
                    attendanceHeaders: [],
                    scoreRows: [],
                    scoreHeaders: [],
                };

                /** Convert sheet to rows (2D array) and auto-detect header row */
                function parseSheet(sheet: XLSX.WorkSheet): {
                    headers: string[];
                    dataRows: (string | number | boolean | null | undefined)[][];
                } {
                    const rows = XLSX.utils.sheet_to_json<
                        (string | number | boolean | null | undefined)[]
                    >(sheet, { header: 1, defval: "" });

                    // find header row index (look for 'email' or 'name')
                    const headerIndex = rows.findIndex((r) =>
                        r.some((cell) => {
                            const s = lc(cell);
                            return (
                                s.includes("email") ||
                                s.includes("user name") ||
                                s === "name" ||
                                s.includes("student name")
                            );
                        })
                    );

                    if (headerIndex === -1) {
                        // fallback: use first non-empty row
                        const idx = rows.findIndex((r) =>
                            r.some((c) => clean(c) !== "")
                        );
                        if (idx === -1) return { headers: [], dataRows: [] };
                        return {
                            headers: rows[idx].map((h) => clean(h)),
                            dataRows: rows.slice(idx + 1),
                        };
                    }

                    // Handle possible multi-row headers (merge two header rows if next row has sublabels)
                    let headers = rows[headerIndex].map((h) => clean(h));
                    const nextRow = rows[headerIndex + 1] || [];

                    // if nextRow has header-like values (e.g. “Coding Problem Score”)
                    const nextHasHeaderLike = nextRow.some((c) => {
                        const s = lc(c);
                        return (
                            s.includes("coding") ||
                            s.includes("quiz") ||
                            s.includes("contest") ||
                            s.includes("time") ||
                            s.includes("score")
                        );
                    });

                    if (nextHasHeaderLike) {
                        headers = headers.map((h, i) => {
                            const part2 = clean(nextRow[i]);
                            if (!part2) return clean(h);
                            return `${clean(h)} ${part2}`.trim();
                        });
                        // data starts after headerIndex + 2
                        return { headers, dataRows: rows.slice(headerIndex + 2) };
                    }

                    // else data starts after headerIndex + 1
                    return { headers, dataRows: rows.slice(headerIndex + 1) };
                }

                // parse attendance sheet (sheet 0)
                if (sheetNames[0]) {
                    const sheetA = wb.Sheets[sheetNames[0]];
                    const { headers, dataRows } = parseSheet(sheetA);
                    results.attendanceHeaders = headers;
                    results.attendanceRows = dataRows.map((row) => {
                        const obj: ExcelRow = {};
                        headers.forEach((h, idx) => {
                            obj[h] = row[idx] ?? "";
                        });
                        return obj;
                    });
                }

                // parse score sheet (sheet 1)
                if (sheetNames[1]) {
                    const sheetS = wb.Sheets[sheetNames[1]];
                    const { headers, dataRows } = parseSheet(sheetS);
                    results.scoreHeaders = headers;
                    results.scoreRows = dataRows.map((row) => {
                        const obj: ExcelRow = {};
                        headers.forEach((h, idx) => {
                            obj[h] = row[idx] ?? "";
                        });
                        return obj;
                    });
                }

                resolve(results);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}
