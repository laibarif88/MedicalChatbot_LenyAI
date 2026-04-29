// formMedicalDetector.ts
import { aiService } from "./aiService";
import { MedicalContextDetector } from "./medicalContextDetector";
import { FormField, SymptomForm, FormProcessingResult } from "../types/contextType";

export class FormMedicalDetector {
    /**
     * Detect medical content and generate appropriate form
     */
    static async detectAndGenerateForm(
        message: string,
        userType: "patient" | "provider"
    ): Promise<FormProcessingResult> {
        // Use the advanced MedicalContextDetector for better medical detection
        const medicalDetection = await MedicalContextDetector.detectMedicalContent(message);

        console.log('🔍 Form Medical Detection (Advanced):', {
            message,
            isMedical: medicalDetection.isMedical,
            confidence: medicalDetection.confidence,
            symptoms: medicalDetection.symptoms,
            contextType: medicalDetection.contextType
        });

        // Only show form for medical content with sufficient confidence
        // Lowered threshold since MedicalContextDetector is more accurate
        if (!medicalDetection.isMedical || medicalDetection.confidence < 0.2) {
            console.log('✅ Non-medical message, proceeding to AI');
            return {
                shouldProceedToAI: true,
                enhancedMessage: message,
                isMedical: false
            };
        }

        // For providers, only proceed to AI (no forms)
        if (userType === "provider") {
            return {
                shouldProceedToAI: true,
                enhancedMessage: message,
                isMedical: true
            };
        }

        // Use AI to analyze the symptoms and generate context-aware form
        try {
            const form = await this.generateContextAwareForm(message, medicalDetection.symptoms);

            return {
                shouldProceedToAI: false,
                formData: form,
                isMedical: true
            };
        } catch (error) {
            console.error("Form generation failed:", error);
            return { shouldProceedToAI: true, enhancedMessage: message, isMedical: true };
        }
    }

    /**
     * AI-powered form generation - Let LLM handle all the complexity
     */
    private static async generateContextAwareForm(
        message: string,
        detectedSymptoms: string[]
    ): Promise<SymptomForm> {
        const formPrompt = `Analyze this patient message and generate a comprehensive medical assessment form.

PATIENT MESSAGE: "${message}"
DETECTED SYMPTOMS: ${detectedSymptoms.join(", ")}

Create a JSON form with medically appropriate questions and options tailored to the specific symptoms mentioned. 
Focus on gathering the most clinically relevant information for proper medical assessment.

Return JSON:
{
  "title": "Brief, empathetic title about the symptoms",
  "description": "Optional text description",
  "descriptionImages": [
  {
    "url": "😣",
    "alt": "Tension headache",
    "caption": "Feels like a tight band around your head"
  },
  {
    "url": "💧",
    "alt": "Dehydration",
    "caption": "Can happen if you are not drinking enough fluids"
  },
  {
    "url": "😴",
    "alt": "Sleep issues",
    "caption": "Too much or too little sleep can trigger headaches"
  }
],

  
  "symptomContext": ["primary", "symptoms", "mentioned"],
  "fields": [
    {
      "type": "duration|select|scale|multi_select|location_specific|text",
      "label": "Clear, medically appropriate question",
      "field": "duration|severity|location|character|timing|associated|onset|triggers|alleviating",
      "options": ["medically", "appropriate", "options"],
      "required": true
    }
  ]
}

Include the most relevant fields for the symptoms described. Make questions and options medically accurate and patient-friendly. Use relevant medical emojis: 🩺💊🤒🤕😷🤢💉🧠🫀🫁👁️👂🦷🦵. Return descriptionImages as an array of image cards (each with url, alt, and caption). Each card should describe one possible cause/context of the symptoms.`;

        try {
            const response = await aiService.getResponse(formPrompt, "provider", false);
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const formConfig = JSON.parse(jsonMatch[0]);

                // Build the complete form with ALL properties including descriptionImage
                const completeForm: SymptomForm = {
                    id: `form-${Date.now()}`,
                    title: formConfig.title || "Tell me more about your symptoms",
                    description: formConfig.description || "To provide the best advice, I need some additional information about your symptoms.",
                    fields: formConfig.fields || this.getMinimalFormFields(detectedSymptoms),
                    symptomContext: formConfig.symptomContext || detectedSymptoms,
                    submitted: false
                };

                // Add descriptionImage if provided by AI
                if (formConfig.descriptionImages && Array.isArray(formConfig.descriptionImages)) {
                    completeForm.descriptionImages = formConfig.descriptionImages.map((img: any) => ({
                        url: img.url || "🩺",
                        alt: img.alt || "Medical assessment",
                        caption: img.caption || ""
                    }));
                }


                console.log('✅ Generated complete form with descriptionImage:', completeForm);
                return completeForm;
            }
        } catch (error) {
            console.error("AI form generation failed, using minimal form:", error);
        }

        // Minimal fallback form with descriptionImage
        const minimalForm = this.getMinimalForm(detectedSymptoms);
        minimalForm.descriptionImages = [
            {
                url: "🩺",
                alt: "Medical assessment",
                caption: "Let's understand your symptoms better"
            }
        ];

        return minimalForm;
    }

    /**
     * Minimal fallback form - only essential fields
     */
    private static getMinimalForm(symptoms: string[]): SymptomForm {
        return {
            id: `form-${Date.now()}`,
            title: "Tell me more about your symptoms",
            description: "I need a bit more information to help you better.",
            symptomContext: symptoms,
            fields: [
                {
                    type: "duration",
                    label: "How long have you had these symptoms?",
                    field: "duration",
                    options: ["Just started", "Few days", "1-2 weeks", "Over 2 weeks", "Chronic"],
                    required: true
                },
                {
                    type: "select",
                    label: "How severe are the symptoms?",
                    field: "severity",
                    options: ["Mild", "Moderate", "Severe", "Very severe"],
                    required: true
                },
                {
                    type: "text",
                    label: "Where exactly are you experiencing this?",
                    field: "location",
                    required: true,
                    placeholder: "Describe the location..."
                }
            ],
            submitted: false,
            descriptionImages: [
                {
                    url: "🩺",
                    alt: "Medical assessment",
                    caption: "Let's understand your symptoms better"
                }
            ]

        };
    }

    private static getMinimalFormFields(symptoms: string[]): FormField[] {
        return this.getMinimalForm(symptoms).fields;
    }

    /**
     * Process form submission and build enhanced message for AI
     */
    static processFormSubmission(
        formData: Record<string, any>,
        originalMessage: string,
        symptomContext: string[]
    ): string {
        const symptoms = symptomContext.join(" and ");
        let enhancedMessage = `Patient originally described: "${originalMessage}"\n\nAfter detailed assessment:\n`;

        // Add all form data to the enhanced message
        Object.entries(formData).forEach(([field, value]) => {
            if (value) {
                const displayValue = Array.isArray(value) ? value.join(", ") : value;
                enhancedMessage += `- ${field}: ${displayValue}\n`;
            }
        });

        enhancedMessage += `\nBased on this comprehensive information about ${symptoms}, please provide detailed medical advice.`;

        return enhancedMessage;
    }
}