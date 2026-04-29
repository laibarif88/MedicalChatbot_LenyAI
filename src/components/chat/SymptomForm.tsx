// components/chat/SymptomForm.tsx
import React, { useState } from 'react';
import { SymptomForm as SymptomFormType, FormField } from '../../types/contextType';

interface SymptomFormProps {
    form: SymptomFormType;
    onSubmit: (formData: Record<string, any>) => void;
    onCancel: () => void;
}

export const SymptomForm: React.FC<SymptomFormProps> = ({ form, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mainColor = "#C97A20";

    const handleFieldChange = (field: string, value: any) => {
        if (isSubmitting) return;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        if (form.fields[currentStep]?.type === 'scale' && value) {
            setTimeout(() => {
                if (currentStep < form.fields.length - 1) {
                    setCurrentStep(currentStep + 1);
                }
            }, 500);
        }
    };

    const validateCurrentStep = (): boolean => {
        const currentField = form.fields[currentStep];
        if (!currentField) return false;

        if (
            currentField.required &&
            (!formData[currentField.field] ||
                (Array.isArray(formData[currentField.field]) &&
                    formData[currentField.field].length === 0))
        ) {
            setErrors(prev => ({
                ...prev,
                [currentField.field]: 'This field is required',
            }));
            return false;
        }
        return true;
    };

    const handleNext = () => {
    if (currentStep < form.fields.length - 1) {
        setCurrentStep(currentStep + 1);
    }
};


    const handleBack = () => {
    if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
    }
};


    const handleSubmit = () => {
        if (validateCurrentStep()) {
            const finalErrors: Record<string, string> = {};
            form.fields.forEach(field => {
                if (field.required && (!formData[field.field] ||
                    (Array.isArray(formData[field.field]) && formData[field.field].length === 0))) {
                    finalErrors[field.field] = 'This field is required';
                }
            });

            if (Object.keys(finalErrors).length > 0) {
                setErrors(finalErrors);
                const firstErrorField = Object.keys(finalErrors)[0];
                const errorIndex = form.fields.findIndex(f => f.field === firstErrorField);
                setCurrentStep(errorIndex);
                return;
            }

            setIsSubmitting(true);
            onSubmit(formData);
        }
    };

    const renderField = (field: FormField) => {
        const value = formData[field.field] || '';
        const error = errors[field.field];

        switch (field.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        disabled={isSubmitting}
                        value={value}
                        onChange={(e) => handleFieldChange(field.field, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full p-3 border-2 rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus:border-[${mainColor}] focus:outline-none`}
                    />
                );

            case 'select':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {field.options?.map(option => (
                            <button
                                key={option}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleFieldChange(field.field, option)}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${value === option
                                    ? `bg-[${mainColor}] text-white border-[${mainColor}]`
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                );

            case 'scale':
                return (
                    <div className="w-full">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={value || 5}
                            disabled={isSubmitting}
                            onChange={(e) => handleFieldChange(field.field, Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, green, yellow, orange, red)`
                            }}
                        />
                        <div className="text-center mt-2 text-lg font-bold" style={{ color: mainColor }}>
                            {value || 5}
                        </div>
                    </div>
                );

            case 'multi_select':
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {field.options?.map(option => {
                            const isSelected = selectedValues.includes(option);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        const newValues = isSelected
                                            ? selectedValues.filter(v => v !== option) // deselect
                                            : [...selectedValues, option]; // select
                                        handleFieldChange(field.field, newValues);
                                    }}
                                    className={`p-3 border-2 rounded-lg text-center transition-all ${isSelected
                                            ? `bg-[${mainColor}] text-white border-[${mainColor}]`
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                );


            case 'duration':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {field.options?.map(option => (
                            <button
                                key={option}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleFieldChange(field.field, option)}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${value === option
                                    ? `bg-[${mainColor}] text-white border-[${mainColor}]`
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                );


            case 'location_specific':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {field.options?.map(option => (
                            <button
                                key={option}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleFieldChange(field.field, option)}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${value === option
                                    ? `bg-[${mainColor}] text-white border-[${mainColor}]`
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const currentField = form.fields[currentStep];

    if (!currentField) {
        return (
            <div className="bg-white border border-[#C97A20] rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
                <p className="text-red-500">No field available to display.</p>
            </div>
        );
    }

    const progress = ((currentStep + 1) / form.fields.length) * 100;

    return (
        <div className="bg-white border border-[#C97A20] rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Question {currentStep + 1} of {form.fields.length}</span>
                    <span>{Math.round(progress)}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: mainColor }}
                    ></div>
                </div>
            </div>

            {/* Form header */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{form.title}</h3>
                {form.descriptionImages && form.descriptionImages.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {form.descriptionImages.map((img, index) => (
                            <div key={index} className="p-4 border rounded-xl shadow-sm bg-white">
                                <div className="flex flex-col items-center">
                                    <div className="text-4xl mb-2">{img.url}</div>
                                    <h4 className="font-semibold text-lg">{img.alt}</h4>
                                    {img.caption && <p className="text-sm text-gray-600 text-center">{img.caption}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">{form.description}</p>
                )}


            </div>

            {/* Current field */}
            <div className="mb-6">
                <label className="block text-lg font-medium text-gray-800 mb-4">
                    {currentField.label}
                    {currentField.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(currentField)}
                {errors[currentField.field] && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors[currentField.field]}
                    </p>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
                {currentStep > 0 && (
                    <button
                        onClick={handleBack}
                        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${isSubmitting ? 'bg-gray-400 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                    >
                        ← Back
                    </button>
                )}

                {currentStep < form.fields.length - 1 ? (
                    <button
                        onClick={handleNext}
                        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${isSubmitting ? 'bg-gray-400 text-white' : `bg-[${mainColor}] hover:opacity-90 text-white`}`}
                    >
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${isSubmitting ? 'bg-gray-400 text-white' : `bg-[${mainColor}] hover:opacity-90 text-white`}`}
                    >
                        {isSubmitting ? "Submitted" : "Submit Form ✓"}
                    </button>
                )}
            </div>

            {/* Cancel button */}
            {!isSubmitting && (
                <button
                    onClick={onCancel}
                    className="w-full mt-4 text-gray-500 py-2 rounded-lg hover:text-gray-700 transition-colors"
                >
                    Cancel and go back
                </button>
            )}
        </div>
    );
};
