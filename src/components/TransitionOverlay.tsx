import React, { useState, useEffect } from 'react';
import { UserType } from '../types';

interface TransitionOverlayProps {
  query?: string;
  userType: UserType;
  onComplete: () => void;
}

interface TransitionStep {
  id: string;
  label: string;
  description: string;
  duration: number;
  icon: React.ReactNode;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ 
  query, 
  userType,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Simplified single-step transition
  const steps: TransitionStep[] = [
    {
      id: 'loading',
      label: 'Connecting to Leny',
      description: '',
      duration: 2000,
      icon: (
        <div className="w-8 h-8 rounded-full bg-[#D97941]/20 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#D97941] animate-pulse" />
        </div>
      )
    }
  ];

  useEffect(() => {
    // Fade in content after mount
    setTimeout(() => setShowContent(true), 50);

    // Progress through steps
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    
    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        onComplete();
        return;
      }

      setCurrentStep(stepIndex);
      const step = steps[stepIndex];
      if (!step) return; // Guard against undefined
      
      let currentProgress = 0;

      // Animate progress bar with slower increments
      progressTimer = setInterval(() => {
        currentProgress += 100 / (step.duration / 20); // Slower increment for smoother animation
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressTimer);
        }
        setProgress(currentProgress);
      }, 20); // Update every 20ms instead of 10ms

      // Move to next step
      stepTimer = setTimeout(() => {
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const currentStepData = steps[currentStep] || steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div 
        className={`transition-all duration-500 transform ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Minimal loading card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
          {/* Logo */}
          <img 
            src="/leny.webp" 
            alt="Leny" 
            className="w-12 h-12 rounded-xl object-cover mb-4"
          />
          
          {/* Loading text */}
          <p className="text-gray-900 font-medium mb-2">
            {steps[currentStep]?.label || 'Loading'}
          </p>
          
          {/* Progress bar */}
          <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#D97941] to-[#E89B4C] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Optional query display */}
          {query && (
            <p className="text-sm text-gray-500 mt-4 max-w-xs text-center line-clamp-2">
              "{query}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitionOverlay;
