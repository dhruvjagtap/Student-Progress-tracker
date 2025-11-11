// src/types/RawResult.ts
export interface RawResult {
    name: string;
    email: string;
    rollNo?: string;
    division?: string;
    totalSessions: number;
    sessionsAttended: number;
    totalTests: number;
    testsAppeared: number;
    avgCodingScore?: number | null;
}
