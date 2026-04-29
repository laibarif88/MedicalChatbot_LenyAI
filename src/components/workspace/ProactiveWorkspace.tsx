import React from 'react';
import { ProactiveAnalysis } from '../../types';

interface ProactiveWorkspaceProps {
    analysisData: ProactiveAnalysis | null;
}

// Function to render text with <b> tags as bold elements
const renderHTML = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

const ProactiveWorkspace: React.FC<ProactiveWorkspaceProps> = ({ analysisData }) => {
    const previewData: ProactiveAnalysis = {
        differentialDiagnosis: [
            { condition: "Acute Bronchitis", confidence: 75 },
            { condition: "Pneumonia", confidence: 20 },
        ],
        recommendedLabsAndImaging: [
            { title: "Chest X-ray (PA and Lateral)", details: "To rule out pneumonia or other lung pathology." },
        ],
        clinicalPearls: []
    };

    return (
        <div className="flex flex-col h-full bg-[#FAF6F2] font-sans">
            <main className="flex-1 p-5 overflow-y-auto">
                {!analysisData ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-[var(--accent-orange)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Proactive Clinical Analysis</h3>
                        <p className="max-w-md text-sm mb-6">
                            As you describe a patient case in the chat, Alex will automatically identify key information and provide insights right here.
                        </p>
                        <div className="w-full max-w-md space-y-4 opacity-75 pointer-events-none select-none">
                            <AnalysisCard title="Differential Diagnosis">
                                <div className="space-y-4">
                                    {previewData.differentialDiagnosis.map((dx, index) => (
                                        <DiagnosisItem key={index} diagnosis={dx} />
                                    ))}
                                </div>
                            </AnalysisCard>
                            <AnalysisCard title="Recommended Labs & Imaging">
                                <div className="space-y-4 divide-y divide-[var(--border-light)]">
                                    {previewData.recommendedLabsAndImaging.map((lab, index) => (
                                        <InformationItem key={index} item={lab} isFirst={index === 0} />
                                    ))}
                                </div>
                            </AnalysisCard>
                        </div>
                        <p className="mt-6 text-xs text-[var(--text-meta)]">Start by presenting a case in the chat to see the magic happen.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <AnalysisCard title="Differential Diagnosis">
                            <div className="space-y-4">
                                {analysisData.differentialDiagnosis?.map((dx, index) => (
                                    <DiagnosisItem key={index} diagnosis={dx} />
                                ))}
                                <div className="pt-3 mt-3 border-t border-dashed border-[var(--border-light)]">
                                     <div className="font-semibold text-sm text-[var(--text-primary)]">Other possibilities</div>
                                     <p className="text-xs text-[var(--text-meta)] mt-1">Always consider less common diagnoses or atypical presentations based on evolving clinical data.</p>
                                </div>
                            </div>
                        </AnalysisCard>
                        {analysisData.recommendedLabsAndImaging && analysisData.recommendedLabsAndImaging.length > 0 && (
                             <AnalysisCard title="Recommended Labs & Imaging">
                                <div className="space-y-4 divide-y divide-[var(--border-light)]">
                                    {analysisData.recommendedLabsAndImaging.map((lab, index) => (
                                        <InformationItem key={index} item={lab} isFirst={index === 0} />
                                    ))}
                                </div>
                            </AnalysisCard>
                        )}
                        {analysisData.clinicalPearls && analysisData.clinicalPearls.length > 0 && (
                            <AnalysisCard title="Clinical Pearls">
                                 <div className="space-y-4 divide-y divide-[var(--border-light)]">
                                    {analysisData.clinicalPearls.map((pearl, index) => (
                                        <InformationItem key={index} item={pearl} isFirst={index === 0} />
                                    ))}
                                </div>
                            </AnalysisCard>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

const AnalysisCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-5 bg-white border border-[var(--border)] rounded-lg shadow-sm">
        <h3 className="text-base font-bold text-[var(--accent-orange)] mb-4 pb-2 border-b border-[var(--border-light)]">{title}</h3>
        {children}
    </div>
);

const DiagnosisItem: React.FC<{ diagnosis: { condition: string; confidence: number } }> = ({ diagnosis }) => {
    const getBarColor = (prob: number) => {
        if (prob > 60) return 'bg-red-500';
        if (prob > 30) return 'bg-orange-400';
        return 'bg-yellow-500';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-sm">
                <div className="font-semibold text-[var(--text-primary)]">{renderHTML(diagnosis.condition)}</div>
                <div className="font-medium text-[var(--text-secondary)]">{diagnosis.confidence}%</div>
            </div>
            <div className="w-full bg-[#F2E6DC] rounded-full h-1.5 mb-1.5">
                <div
                    className={`${getBarColor(diagnosis.confidence)} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${diagnosis.confidence}%` }}
                />
            </div>
             <p className="text-xs text-[var(--text-meta)]">Based on clinical presentation</p>
        </div>
    );
};

const InformationItem: React.FC<{ item: { title: string; details: string }, isFirst: boolean }> = ({ item, isFirst }) => (
    <div className={!isFirst ? 'pt-4' : ''}>
        <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.title}</h4>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{renderHTML(item.details)}</p>
    </div>
);


export default ProactiveWorkspace;
