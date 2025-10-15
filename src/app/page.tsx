'use client';
import UploadSection from './components/UploadSection';

export default function Page() {
  return (
    <div style={{ padding: 16 }}>
      <h1>GFG Student Summary (Java + CPP)</h1>
      <p>Upload Java and CPP workbooks (first two sheets are used). Then click Merge & Show.</p>
      <UploadSection />
    </div>
  );
}
