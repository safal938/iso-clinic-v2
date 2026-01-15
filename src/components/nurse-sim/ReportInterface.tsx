import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './ReportInterface.css';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReportData } from '../../types/nurse-sim';

const MOCK_REPORT_CONTENT = `
<h2>Clinical Consultation Report</h2>
<p><strong>Patient:</strong> Marcus J. Thorne</p>
<p><strong>Date:</strong> October 24, 2023</p>
<p><strong>Chief Complaint:</strong> Jaundice and Severe Itching</p>

<h3>History of Present Illness</h3>
<p>The patient is a 46-year-old male presenting with yellowing of the eyes (jaundice) and severe itching (pruritus) that began approximately one week ago. The patient reports recent dental work for an abscess, treated with Amoxicillin-Clavulanate (Augmentin) approximately 3 weeks ago. Additionally, the patient has been taking frequent doses of acetaminophen (Tylenol, Tylenol PM, Extra Strength Tylenol) for lingering jaw pain.</p>

<h3>Physical Examination</h3>
<ul>
  <li>Jaundice noted in sclera and skin</li>
  <li>Patient reports significant pruritus</li>
  <li>No acute distress observed</li>
  <li>Abdomen: soft, non-tender</li>
</ul>

<h3>Laboratory Results</h3>
<ul>
  <li><strong>AST:</strong> 450 U/L (elevated)</li>
  <li><strong>ALT:</strong> 620 U/L (elevated)</li>
  <li><strong>Alkaline Phosphatase:</strong> 180 U/L (elevated)</li>
  <li><strong>Total Bilirubin:</strong> 5.2 mg/dL (elevated)</li>
  <li><strong>INR:</strong> 1.2 (borderline)</li>
</ul>

<h3>Assessment and Diagnosis</h3>
<p><strong>Primary Diagnosis:</strong> Drug-Induced Liver Injury (DILI) secondary to Amoxicillin-Clavulanate and Acetaminophen</p>

<p>The patient presents with acute liver injury characterized by significantly elevated liver enzymes and bilirubin. The temporal relationship between medication use (Amoxicillin-Clavulanate and frequent acetaminophen) and symptom onset strongly suggests drug-induced hepatotoxicity.</p>

<h3>Plan</h3>
<ol>
  <li><strong>Immediate Actions:</strong>
    <ul>
      <li>Discontinue all acetaminophen products immediately</li>
      <li>Avoid alcohol consumption completely</li>
      <li>Monitor for warning signs: severe abdominal pain, vomiting, confusion, worsening jaundice</li>
    </ul>
  </li>
  <li><strong>Follow-up:</strong>
    <ul>
      <li>Repeat liver function tests in 48-72 hours</li>
      <li>Hepatology referral if no improvement</li>
      <li>Comprehensive medication review at next visit</li>
    </ul>
  </li>
  <li><strong>Patient Education:</strong>
    <ul>
      <li>Explained nature of drug-induced liver injury</li>
      <li>Provided written instructions on medications to avoid</li>
      <li>Discussed warning signs requiring immediate medical attention</li>
      <li>Emphasized importance of hydration and rest</li>
    </ul>
  </li>
</ol>

<h3>Prognosis</h3>
<p>With immediate cessation of hepatotoxic medications and appropriate monitoring, the prognosis is generally favorable. Most cases of drug-induced liver injury resolve with supportive care and removal of the offending agent.</p>

<p><strong>Provider Signature:</strong> _______________________</p>
<p><strong>Date:</strong> _______________________</p>
`;

export const ReportInterface: React.FC<{ reportData?: ReportData | null }> = ({ reportData: externalReportData = null }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reportContent, setReportContent] = useState(MOCK_REPORT_CONTENT);
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);

  // Update report when backend data arrives
  useEffect(() => {
    if (externalReportData) {
      const generatedContent = generateReportHTML(externalReportData);
      setReportContent(generatedContent);
      setReportGenerated(true);
      setIsGenerating(false);
    }
  }, [externalReportData]);

  // Generate HTML from backend report data
  const generateReportHTML = (data: ReportData): string => {
    return `
<h2>Clinical Consultation Report</h2>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>History of Present Illness</h3>
<p>${data.clinical_handover.hpi_narrative}</p>

<h3>Key Biomarkers</h3>
<ul>
  ${data.clinical_handover.key_biomarkers_extracted.map(marker => `<li>${marker}</li>`).join('\n  ')}
</ul>

<h3>Clinical Impression</h3>
<p>${data.clinical_handover.clinical_impression_summary}</p>

<h3>Suggested Doctor Actions</h3>
<ol>
  ${data.clinical_handover.suggested_doctor_actions.map(action => `<li>${action}</li>`).join('\n  ')}
</ol>

<h3>Performance Summary</h3>
<p>${data.audit_summary.performance_narrative}</p>

<h3>Areas for Improvement</h3>
<p>${data.audit_summary.areas_for_improvement_summary}</p>

<p><strong>Provider Signature:</strong> _______________________</p>
<p><strong>Date:</strong> _______________________</p>
`;
  };

  useEffect(() => {
    if (isEditing && editorRef.current && !quillInstance.current) {
      // Initialize Quill only in edit mode
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link'],
            [{ 'align': [] }],
            ['clean']
          ],
        },
      });

      // Set the content after a small delay to ensure Quill is ready
      setTimeout(() => {
        if (quillInstance.current) {
          quillInstance.current.clipboard.dangerouslyPasteHTML(reportContent);
        }
      }, 0);
    }

    // Cleanup function - destroy Quill instance when leaving edit mode
    return () => {
      if (quillInstance.current && !isEditing) {
        quillInstance.current = null;
      }
    };
  }, [isEditing, editorKey]);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation with a delay
    setTimeout(() => {
      setReportContent(MOCK_REPORT_CONTENT);
      setReportGenerated(true);
      setIsGenerating(false);
    }, 2000);
  };

  const handleRegenerate = () => {
    setReportGenerated(false);
    setIsEditing(false);
    setReportContent(MOCK_REPORT_CONTENT);
    // Clean up Quill instance
    if (quillInstance.current) {
      quillInstance.current = null;
    }
  };

  const handleEditReport = () => {
    setIsEditing(true);
    setEditorKey(prev => prev + 1); // Force remount with new key
  };

  const handleSaveReport = () => {
    setIsSaving(true);
    
    // Save the current content from Quill
    if (quillInstance.current) {
      const content = quillInstance.current.root.innerHTML;
      setReportContent(content);
    }
    
    // Simulate saving with a delay
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      quillInstance.current = null; // Clear the instance
    }, 1000);
  };

  const handleSendToDoctor = () => {
    setIsSending(true);
    
    // Simulate sending with a delay
    setTimeout(() => {
      setIsSending(false);
      // You could show a success message here
      alert('Report sent to doctor successfully!');
    }, 1500);
  };

  // Show dummy report immediately instead of loading state
  React.useEffect(() => {
    if (!reportGenerated && !externalReportData) {
      setReportGenerated(true);
    }
  }, [reportGenerated, externalReportData]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      {!isEditing ? (
        // Preview State
        <>
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">Clinical Consultation Report</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Preview generated report
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleEditReport}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Edit Report
              </button>
              <button
                onClick={handleSendToDoctor}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-400 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Report To Doctor'
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div 
              className="prose prose-sm max-w-none report-preview"
              dangerouslySetInnerHTML={{ __html: reportContent }}
            />
          </div>
        </>
      ) : (
        // Editor State
        <>
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">Clinical Consultation Report</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Edit and finalize the report
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleSaveReport}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Report'
                )}
              </button>
              <button
                className="px-4 py-2 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={handleSendToDoctor}
                disabled={isSending}
                className="px-4 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-400 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Report To Doctor'
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden" key={editorKey}>
            <div ref={editorRef} className="h-full quill-editor-container" />
          </div>
        </>
      )}
    </div>
  );
};
