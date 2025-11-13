
// export type Student = {
//     name: string;
//     email: string;
//     avgCoding: number;
//     attended: number;
//     totalLectures: number;
// };

// export interface Student {
//     name: string;
//     rollNo: string;
//     division: string;
//     email: string;
//     sessionAttended: string;
//     testAppeared: string;
// }

// export interface Student {
//     rollNo: string;          // Unique identifier of student
//     name: string;            // Student’s name
//     javaAttendance: number;  // From Java file
//     javaPerformance: number; // From Java file
//     cppAttendance: number;   // From C++ file
//     cppPerformance: number;  // From C++ file
// }
// src/types/Student.ts
export interface Student {
    name: string;
    rollNo: string;
    division: string;
    email: string;
    sessionsAttended: string; // "10 out of 17" or "-"
    testsAppeared: string;    // "4 out of 5" or "-"
}

export interface HitbullseyeStudent {
    name: string;
    rollNo: string;
    email: string;
    division?: string;
    testsAppeared?: string;
    recentAptitudeMarks?: string | number;
    recentCodingScore?: string | number;
}
