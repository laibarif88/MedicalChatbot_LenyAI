import React from 'react';

interface FormattingToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onApplyTemplate: (content: string) => void;
}

// Google-style thin line icons
const BoldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
);

const UnderlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
    <line x1="4" y1="21" x2="20" y2="21"/>
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="17" y1="10" x2="3" y2="10"/>
    <line x1="21" y1="6" x2="3" y2="6"/>
    <line x1="21" y1="14" x2="3" y2="14"/>
    <line x1="17" y1="18" x2="3" y2="18"/>
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="10" x2="6" y2="10"/>
    <line x1="21" y1="6" x2="3" y2="6"/>
    <line x1="21" y1="14" x2="3" y2="14"/>
    <line x1="18" y1="18" x2="6" y2="18"/>
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="21" y1="10" x2="7" y2="10"/>
    <line x1="21" y1="6" x2="3" y2="6"/>
    <line x1="21" y1="14" x2="3" y2="14"/>
    <line x1="21" y1="18" x2="7" y2="18"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const NumberedListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="10" y1="6" x2="21" y2="6"/>
    <line x1="10" y1="12" x2="21" y2="12"/>
    <line x1="10" y1="18" x2="21" y2="18"/>
    <path d="M4 6h1v4"/>
    <path d="M4 10h2"/>
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 7v6h-6"/>
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
  </svg>
);

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat, onApplyTemplate }) => {
  const templates = {
    SOAP: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">SOAP Note</h2>
<h3 style="color: #2c5aa0; margin-top: 20px;">Subjective:</h3>
<p><strong>Chief Complaint:</strong> [Patient's primary concern]</p>
<p><strong>History of Present Illness:</strong> [Detailed description of current symptoms including onset, duration, character, alleviating/aggravating factors, radiation, timing, severity]</p>
<p><strong>Review of Systems:</strong> [Relevant positive/negative findings]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Objective:</h3>
<p><strong>Vital Signs:</strong> BP: ___ HR: ___ RR: ___ T: ___ O2 Sat: ___</p>
<p><strong>Physical Examination:</strong></p>
<ul>
<li>General: [Appearance, distress level]</li>
<li>HEENT: [Head, eyes, ears, nose, throat findings]</li>
<li>Cardiovascular: [Heart sounds, murmurs, peripheral pulses]</li>
<li>Pulmonary: [Breath sounds, respiratory effort]</li>
<li>Abdomen: [Inspection, palpation, bowel sounds]</li>
<li>Neurologic: [Mental status, focal deficits]</li>
<li>Skin: [Lesions, rashes, color changes]</li>
</ul>

<h3 style="color: #2c5aa0; margin-top: 20px;">Assessment:</h3>
<ol>
<li><strong>[Primary Diagnosis]</strong> - [Supporting evidence and reasoning]</li>
<li>[Secondary diagnoses or differential diagnoses]</li>
</ol>

<h3 style="color: #2c5aa0; margin-top: 20px;">Plan:</h3>
<p><strong>Diagnostic:</strong> [Labs, imaging, tests ordered]</p>
<p><strong>Therapeutic:</strong> [Medications, treatments, procedures]</p>
<p><strong>Education:</strong> [Patient counseling and instructions]</p>
<p><strong>Follow-up:</strong> [Return visit timing and criteria]</p>
<p><strong>Disposition:</strong> [Discharge home, admission, referral]</p>
</div>`,

    'H&P': `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">History & Physical Examination</h2>

<h3 style="color: #2c5aa0; margin-top: 20px;">Chief Complaint:</h3>
<p>[Patient's primary reason for visit in their own words]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">History of Present Illness:</h3>
<p>[Chronological narrative of current illness including: onset, location, duration, character, alleviating/aggravating factors, radiation, timing, severity, associated symptoms]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Past Medical History:</h3>
<ul>
<li>Medical conditions: [Previous diagnoses]</li>
<li>Surgical history: [Previous surgeries with dates]</li>
<li>Hospitalizations: [Previous admissions]</li>
<li>Allergies: [Drug/food/environmental allergies]</li>
<li>Medications: [Current medications with dosages]</li>
</ul>

<h3 style="color: #2c5aa0; margin-top: 20px;">Social History:</h3>
<p><strong>Tobacco:</strong> [Usage history]</p>
<p><strong>Alcohol:</strong> [Usage patterns]</p>
<p><strong>Drugs:</strong> [Recreational drug use]</p>
<p><strong>Occupation:</strong> [Current and relevant past occupations]</p>
<p><strong>Living situation:</strong> [Home environment, support system]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Family History:</h3>
<p>[Relevant family medical history, particularly for hereditary conditions]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Review of Systems:</h3>
<p>[Systematic review by organ system - positive and pertinent negative findings]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Physical Examination:</h3>
<p><strong>Vital Signs:</strong> BP: ___ HR: ___ RR: ___ T: ___ Wt: ___ Ht: ___ BMI: ___</p>
<p><strong>General:</strong> [Overall appearance, apparent distress]</p>
<p><strong>HEENT:</strong> [Detailed head, eye, ear, nose, throat exam]</p>
<p><strong>Neck:</strong> [Lymph nodes, thyroid, JVD, carotids]</p>
<p><strong>Cardiovascular:</strong> [Heart sounds, murmurs, peripheral pulses, edema]</p>
<p><strong>Pulmonary:</strong> [Breath sounds, respiratory effort, chest wall]</p>
<p><strong>Abdomen:</strong> [Inspection, auscultation, palpation, percussion]</p>
<p><strong>Genitourinary:</strong> [As appropriate]</p>
<p><strong>Musculoskeletal:</strong> [Range of motion, strength, deformities]</p>
<p><strong>Neurologic:</strong> [Mental status, cranial nerves, motor, sensory, reflexes, gait]</p>
<p><strong>Skin:</strong> [Color, temperature, texture, lesions]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Assessment & Plan:</h3>
<ol>
<li><strong>[Primary Problem/Diagnosis]</strong>
   <ul>
   <li>Assessment: [Clinical reasoning]</li>
   <li>Plan: [Diagnostic and therapeutic interventions]</li>
   </ul>
</li>
<li><strong>[Secondary Problems]</strong>
   <ul>
   <li>Assessment: [Clinical reasoning]</li>
   <li>Plan: [Management approach]</li>
   </ul>
</li>
</ol>
</div>`,

    Progress: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">Progress Note</h2>
<p><strong>Date:</strong> [Current date]</p>
<p><strong>Time:</strong> [Current time]</p>
<p><strong>Service:</strong> [Department/Service]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Interval History:</h3>
<p>[Changes in patient's condition since last assessment, new symptoms, response to treatment, patient concerns]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Current Status:</h3>
<p><strong>Subjective:</strong> [Patient's current symptoms and concerns]</p>
<p><strong>Vital Signs:</strong> BP: ___ HR: ___ RR: ___ T: ___ O2 Sat: ___</p>
<p><strong>Physical Exam:</strong> [Focused examination relevant to current issues]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Review of Systems:</h3>
<p>[Pertinent positive and negative findings]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Data Review:</h3>
<p><strong>Laboratory:</strong> [Recent lab results and interpretation]</p>
<p><strong>Imaging:</strong> [Recent imaging results]</p>
<p><strong>Other Studies:</strong> [EKG, cultures, pathology, etc.]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Assessment & Plan:</h3>
<ol>
<li><strong>[Problem 1]</strong>
   <ul>
   <li>Status: [Improved/Stable/Worsened]</li>
   <li>Plan: [Continue/Modify/Discontinue current management]</li>
   </ul>
</li>
<li><strong>[Problem 2]</strong>
   <ul>
   <li>Status: [Current status]</li>
   <li>Plan: [Management plan]</li>
   </ul>
</li>
</ol>

<p><strong>Disposition:</strong> [Continue current level of care/Transfer/Discharge plans]</p>
<p><strong>Follow-up:</strong> [Timeline for next assessment]</p>
</div>`,

    Procedures: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">Procedure Note</h2>
<p><strong>Date:</strong> [Current date]</p>
<p><strong>Time:</strong> [Procedure time]</p>
<p><strong>Provider:</strong> [Performing physician]</p>
<p><strong>Location:</strong> [Procedure location]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Procedure:</h3>
<p><strong>Procedure Name:</strong> [Full procedure name and CPT code]</p>
<p><strong>Indication:</strong> [Medical reason for procedure]</p>
<p><strong>Informed Consent:</strong> [Consent obtained, risks discussed]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Pre-Procedure:</h3>
<p><strong>Patient Position:</strong> [Positioning for procedure]</p>
<p><strong>Anesthesia/Sedation:</strong> [Type and amount used]</p>
<p><strong>Sterile Preparation:</strong> [Cleansing and draping details]</p>
<p><strong>Equipment:</strong> [Instruments and supplies used]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Procedure Details:</h3>
<p><strong>Technique:</strong> [Step-by-step description of procedure]</p>
<p><strong>Findings:</strong> [Anatomical findings, abnormalities noted]</p>
<p><strong>Complications:</strong> [Any complications encountered - None if applicable]</p>
<p><strong>Specimens:</strong> [Tissue/fluid samples collected]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Post-Procedure:</h3>
<p><strong>Patient Tolerance:</strong> [How patient tolerated procedure]</p>
<p><strong>Immediate Results:</strong> [Initial outcomes/findings]</p>
<p><strong>Hemostasis:</strong> [Bleeding control achieved]</p>
<p><strong>Dressing Applied:</strong> [Type of dressing/bandage]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Post-Procedure Instructions:</h3>
<ul>
<li>Activity restrictions: [Limitations on physical activity]</li>
<li>Wound care: [How to care for procedure site]</li>
<li>Medications: [Pain management, antibiotics if needed]</li>
<li>Warning signs: [When to contact provider]</li>
<li>Follow-up: [Return appointment schedule]</li>
</ul>

<p><strong>Provider Signature:</strong> [Physician name and signature]</p>
</div>`,

    Referrals: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">Referral Request</h2>
<p><strong>Date:</strong> [Current date]</p>
<p><strong>Referring Provider:</strong> [Your name and credentials]</p>
<p><strong>Practice/Institution:</strong> [Your practice name]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Patient Information:</h3>
<p><strong>Patient Name:</strong> [Full patient name]</p>
<p><strong>Date of Birth:</strong> [Patient DOB]</p>
<p><strong>Medical Record Number:</strong> [MRN]</p>
<p><strong>Insurance:</strong> [Primary insurance plan]</p>
<p><strong>Phone Number:</strong> [Patient contact number]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Referral Details:</h3>
<p><strong>Specialty Requested:</strong> [Specialist type needed]</p>
<p><strong>Preferred Provider:</strong> [Specific doctor if requested]</p>
<p><strong>Urgency:</strong> [Routine/Urgent/STAT - with timeframe]</p>
<p><strong>Reason for Referral:</strong> [Primary concern requiring specialist input]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Clinical Information:</h3>
<p><strong>Primary Diagnosis:</strong> [Current diagnosis with ICD-10 codes]</p>
<p><strong>Secondary Diagnoses:</strong> [Relevant comorbidities]</p>
<p><strong>Current Symptoms:</strong> [Patient's presenting symptoms]</p>
<p><strong>Duration:</strong> [How long symptoms have been present]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Clinical History:</h3>
<p><strong>Relevant History:</strong> [Pertinent past medical/surgical history]</p>
<p><strong>Current Medications:</strong> [Medications relevant to referral]</p>
<p><strong>Allergies:</strong> [Drug and other relevant allergies]</p>
<p><strong>Recent Studies:</strong> [Labs, imaging, procedures completed]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Specific Questions for Consultant:</h3>
<ol>
<li>[Specific question about diagnosis]</li>
<li>[Question about treatment recommendations]</li>
<li>[Question about prognosis or next steps]</li>
<li>[Any procedural recommendations needed]</li>
</ol>

<h3 style="color: #2c5aa0; margin-top: 20px;">Attachments:</h3>
<ul>
<li>Recent laboratory results</li>
<li>Imaging reports and images</li>
<li>Previous consultation reports</li>
<li>Relevant medical records</li>
</ul>

<p><strong>Thank you for your consultation. Please contact me at [phone/email] with any questions.</strong></p>
<p><strong>Provider Signature:</strong> [Your name and credentials]</p>
</div>`,

    'Prior Auth': `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
<h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px;">Prior Authorization Request</h2>
<p><strong>Date of Request:</strong> [Current date]</p>
<p><strong>Requesting Provider:</strong> [Provider name and NPI]</p>
<p><strong>Practice Name:</strong> [Practice/Hospital name]</p>
<p><strong>Phone:</strong> [Provider contact number]</p>
<p><strong>Fax:</strong> [Provider fax number]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Patient Information:</h3>
<p><strong>Patient Name:</strong> [Full patient name]</p>
<p><strong>Date of Birth:</strong> [Patient DOB]</p>
<p><strong>Member ID:</strong> [Insurance member ID]</p>
<p><strong>Group Number:</strong> [Insurance group number]</p>
<p><strong>Insurance Plan:</strong> [Insurance carrier and plan type]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Request Details:</h3>
<p><strong>Service/Medication Requested:</strong> [Specific item requiring authorization]</p>
<p><strong>CPT/HCPCS Code:</strong> [Procedure codes]</p>
<p><strong>NDC Number:</strong> [For medications]</p>
<p><strong>Quantity:</strong> [Amount/frequency requested]</p>
<p><strong>Place of Service:</strong> [Where service will be provided]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Clinical Justification:</h3>
<p><strong>Primary Diagnosis:</strong> [ICD-10 code and description]</p>
<p><strong>Secondary Diagnoses:</strong> [Relevant comorbidities with codes]</p>
<p><strong>Medical Necessity:</strong> [Detailed explanation of why this service/medication is needed]</p>
<p><strong>Symptom Duration:</strong> [How long patient has had symptoms]</p>
<p><strong>Functional Impairment:</strong> [How condition affects daily activities]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Previous Treatments:</h3>
<p><strong>Conservative Measures Tried:</strong></p>
<ul>
<li>[Previous medication trials with dates and outcomes]</li>
<li>[Physical therapy or other conservative treatments]</li>
<li>[Why previous treatments were inadequate/failed]</li>
<li>[Any adverse reactions to previous treatments]</li>
</ul>

<h3 style="color: #2c5aa0; margin-top: 20px;">Supporting Documentation:</h3>
<p><strong>Laboratory Results:</strong> [Relevant lab values supporting request]</p>
<p><strong>Imaging Studies:</strong> [X-rays, MRI, CT results if applicable]</p>
<p><strong>Specialist Reports:</strong> [Consultant recommendations]</p>
<p><strong>Progress Notes:</strong> [Clinical notes documenting medical necessity]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Urgency and Timeline:</h3>
<p><strong>Urgency Level:</strong> [Routine/Urgent/Emergency]</p>
<p><strong>Clinical Urgency Reason:</strong> [Why immediate approval is needed]</p>
<p><strong>Anticipated Start Date:</strong> [When treatment should begin]</p>
<p><strong>Duration of Treatment:</strong> [How long treatment will be needed]</p>

<h3 style="color: #2c5aa0; margin-top: 20px;">Provider Attestation:</h3>
<p>I attest that the information provided is accurate and complete. The requested service/medication is medically necessary for this patient's condition and represents the most appropriate treatment option based on current clinical guidelines and the patient's specific circumstances.</p>

<p><strong>Provider Signature:</strong> [Provider name]</p>
<p><strong>Date:</strong> [Signature date]</p>
<p><strong>License Number:</strong> [State license number]</p>
</div>`
  };

  return (
    <div className="bg-white border-b border-[var(--border)]">
      {/* Main formatting toolbar */}
      <div className="p-2 flex items-center gap-1">
        <FormatButton command="undo" onFormat={onFormat} icon={<UndoIcon />} />
        <FormatButton command="redo" onFormat={onFormat} icon={<RedoIcon />} />
        <Separator />
        <FormatButton command="bold" onFormat={onFormat} icon={<BoldIcon />} />
        <FormatButton command="italic" onFormat={onFormat} icon={<ItalicIcon />} />
        <FormatButton command="underline" onFormat={onFormat} icon={<UnderlineIcon />} />
        <Separator />
        <FormatButton command="justifyLeft" onFormat={onFormat} icon={<AlignLeftIcon />} />
        <FormatButton command="justifyCenter" onFormat={onFormat} icon={<AlignCenterIcon />} />
        <FormatButton command="justifyRight" onFormat={onFormat} icon={<AlignRightIcon />} />
        <Separator />
        <FormatButton command="insertUnorderedList" onFormat={onFormat} icon={<ListIcon />} />
        <FormatButton command="insertOrderedList" onFormat={onFormat} icon={<NumberedListIcon />} />
      </div>
      
      {/* Template buttons row */}
      <div className="px-2 pb-2 flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Templates:</span>
        {Object.entries(templates).map(([name, content]) => (
          <button
            key={name}
            onClick={() => onApplyTemplate(content)}
            onMouseDown={(e) => e.preventDefault()}
            className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

const FormatButton: React.FC<{ 
  command: string; 
  onFormat: (cmd: string) => void; 
  icon: React.ReactNode 
}> = ({ command, onFormat, icon }) => (
  <button
    onClick={() => onFormat(command)}
    onMouseDown={(e) => e.preventDefault()}
    className="w-8 h-8 rounded text-[var(--text-secondary)] hover:bg-gray-100 transition-colors flex items-center justify-center"
    title={command.charAt(0).toUpperCase() + command.slice(1)}
  >
    {icon}
  </button>
);

const Separator = () => <div className="w-px h-5 bg-[var(--border)] mx-1"></div>;

export default FormattingToolbar;
