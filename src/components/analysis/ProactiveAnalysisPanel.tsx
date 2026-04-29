
import React from 'react';
import { ProactiveAnalysis, DifferentialDiagnosis } from '../../types';

const getConfidenceClass = (confidence: number) => {
  if (confidence > 70) return 'bg-green-500';
  if (confidence > 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const SkeletonCard: React.FC = () => (
    <div className="bg-white border border-[#F2E6DC] rounded-lg rounded-tr-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);

const AnalysisCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-[#F2E6DC] rounded-lg rounded-tr-sm shadow-sm transition-all duration-300 animate-fade-in">
        <h3 className="text-sm font-semibold text-[#B5651D] px-4 py-2 border-b border-[#F2E6DC] bg-[#FFFBF8] rounded-t-lg rounded-tr-sm">{title}</h3>
        <div className="p-4 text-sm text-[#2D241F] space-y-3">
            {children}
        </div>
    </div>
);

const DifferentialDiagnosisView: React.FC<{ items: DifferentialDiagnosis[] }> = ({ items }) => (
    <div className="space-y-3">
        {items.map((item, index) => (
            <div key={index}>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-normal">{item.condition}</span>
                    <span className="text-[11px] font-semibold text-gray-600">{item.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`${getConfidenceClass(item.confidence)} h-1.5 rounded-full`} style={{ width: `${item.confidence}%` }}></div>
                </div>
            </div>
        ))}
    </div>
);

export const ProactiveAnalysisPanel: React.FC<{
    analysisData: ProactiveAnalysis | null;
    isAnalyzing: boolean;
}> = ({ analysisData, isAnalyzing }) => {
    return (
        <aside className="w-[380px] flex-shrink-0 bg-[#FAF6F2] border-l border-[#E8D5C8] flex flex-col h-full animate-slide-in-right">
            <header className="p-4 border-b border-[#E8D5C8] flex-shrink-0 bg-white shadow-sm">
                <h2 className="text-[17px] font-semibold text-[#C97A20]">Clinical Analysis</h2>
                <p className="text-xs text-gray-500">Real-time comprehensive assessment</p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isAnalyzing ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : analysisData ? (
                    <>
                        <AnalysisCard title="Differential Diagnosis">
                            <DifferentialDiagnosisView items={analysisData.differentialDiagnosis} />
                        </AnalysisCard>
                        <AnalysisCard title="Recommended Labs & Imaging">
                            {analysisData.recommendedLabsAndImaging.map((item, index) => (
                                <div key={index} className="pb-2 border-b border-gray-100 last:border-b-0">
                                    <p className="font-semibold" dangerouslySetInnerHTML={{ __html: item.title }}></p>
                                    <p className="text-gray-600 text-sm mt-0.5 leading-[1.4]" dangerouslySetInnerHTML={{ __html: item.details }}></p>
                                </div>
                            ))}
                        </AnalysisCard>
                        <AnalysisCard title="Clinical Pearls">
                            {analysisData.clinicalPearls.map((item, index) => (
                                <div key={index} className="pb-2 border-b border-gray-100 last:border-b-0">
                                    <p className="font-semibold" dangerouslySetInnerHTML={{ __html: item.title }}></p>
                                    <p className="text-gray-600 text-sm mt-0.5 leading-[1.4]" dangerouslySetInnerHTML={{ __html: item.details }}></p>
                                </div>
                             ))}
                        </AnalysisCard>
                    </>
                ) : (
                    <div className="text-center text-sm text-gray-500 pt-16">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <p className="font-semibold">Analysis Panel</p>
                        <p>Submit a clinical query with Proactive Mode active to see insights here.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};
