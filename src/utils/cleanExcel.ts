import * as XLSX from "xlsx";

/**
 * Shape of a generic parsed Excel row
 */
export type ExcelRow = Record<string, string | number | null | undefined>;

/**
 * Reads and cleans a messy Excel sheet:
 * - Skips intro rows (college name etc.)
 * - Detects actual header row (based on "Sr.No" or "Roll No")
 * - Combines multi-row headers (like Hitbullseye)
 * - Returns a clean JSON array
 */
export function parseExcelFile(file: File): Promise<ExcelRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // Get all rows as 2D array
            const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
                header: 1,
                defval: "",
            });

            // Find the first row that starts actual table
            const headerIndex = rows.findIndex((r) =>
                r.some((c) =>
                    ["srno.", "roll no", "roll", "student name"].includes(
                        c.toLowerCase().trim()
                    )
                )
            );

            if (headerIndex === -1) {
                reject(new Error("Header row not found"));
                return;
            }

            // Handle multi-line headers (like Hitbullseye)
            const headerRows = rows.slice(headerIndex, headerIndex + 2);
            let headers: string[] = [];

            if (headerRows.length > 1 && headerRows[1].some((v) => v)) {
                // Combine both header rows
                headers = headerRows[0].map(
                    (h, i) => `${h || ""} ${headerRows[1][i] || ""}`.trim()
                );
            } else {
                headers = headerRows[0].map((h) => h.trim());
            }

            // Actual data rows
            const dataRows = rows.slice(headerIndex + headerRows.length);

            // Convert to JSON and normalize keys
            const json: ExcelRow[] = dataRows.map((row) => {
                const obj: ExcelRow = {};
                headers.forEach((header, i) => {
                    obj[header] = row[i] ?? "";
                });

                // ✅ Normalize column names
                obj.roll =
                    (obj["Roll No"] as string) ||
                    (obj["ROLL NO"] as string) ||
                    (obj["roll"] as string) ||
                    (obj["Sr.No"] as string) ||
                    (obj["Sr No"] as string) ||
                    "";
                obj.name =
                    (obj["Student Name"] as string) ||
                    (obj["STUDENT NAME"] as string) ||
                    (obj["Name"] as string) ||
                    (obj["name"] as string) ||
                    "";

                return obj;
            });

            resolve(json);
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
