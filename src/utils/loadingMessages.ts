import { useState, useEffect } from 'react';

/**
 * Educational loading messages to reduce wait anxiety during AI response delays
 * Messages are contextual and provide medical value while waiting
 */

export interface LoadingMessage {
  text: string;
  duration: number; // ms to show this message
  icon?: string;
}

// General medical tips for patients - expanded to ~50 messages
const PATIENT_MESSAGES: LoadingMessage[] = [
  {
    text: "While you wait for the server, did you know that staying hydrated helps your body process medications more effectively?",
    duration: 4000,
    icon: "💧"
  },
  {
    text: "While you wait for the server, did you know that taking medications at the same time each day improves their effectiveness?",
    duration: 4000,
    icon: "⏰"
  },
  {
    text: "While you wait for the server, did you know that keeping a list of your medications and allergies in your wallet can save your life in emergencies?",
    duration: 4000,
    icon: "📋"
  },
  {
    text: "While you wait for the server, did you know that just 30 minutes of walking daily can reduce your risk of heart disease by 35%?",
    duration: 4000,
    icon: "❤️"
  },
  {
    text: "While you wait for the server, did you know that getting 7-9 hours of quality sleep boosts your immune system significantly?",
    duration: 4000,
    icon: "🛡️"
  },
  {
    text: "While you wait for the server, did you know that eating colorful fruits and vegetables provides antioxidants that fight inflammation?",
    duration: 4000,
    icon: "🌈"
  },
  {
    text: "While you wait for the server, did you know that deep breathing exercises can lower blood pressure in just 2-3 minutes?",
    duration: 4000,
    icon: "💨"
  },
  {
    text: "While you wait for the server, did you know that flossing daily reduces your risk of heart disease and stroke?",
    duration: 4000,
    icon: "❤️"
  },
  {
    text: "While you wait for the server, did you know that just 15 minutes of sunlight daily helps your body absorb calcium better?",
    duration: 4000,
    icon: "🦴"
  },
  {
    text: "While you wait for the server, did you know that your brain is 75% water - staying hydrated improves focus and mood?",
    duration: 4000,
    icon: "🧠"
  },
  {
    text: "While you wait for the server, did you know that laughter actually boosts your immune system and reduces stress hormones?",
    duration: 4000,
    icon: "😄"
  },
  {
    text: "While you wait for the server, did you know that washing your hands for 20 seconds prevents 80% of infections?",
    duration: 4000,
    icon: "🧼"
  },
  {
    text: "While you wait for the server, did you know that eating fiber-rich foods helps maintain healthy gut bacteria?",
    duration: 4000,
    icon: "🌾"
  },
  {
    text: "While you wait for the server, did you know that regular stretching can improve your posture and reduce back pain?",
    duration: 4000,
    icon: "🤸"
  },
  {
    text: "While you wait for the server, did you know that green tea contains antioxidants that may help prevent cancer?",
    duration: 4000,
    icon: "🍵"
  },
  {
    text: "While you wait for the server, did you know that limiting screen time before bed improves sleep quality?",
    duration: 4000,
    icon: "📱"
  },
  {
    text: "While you wait for the server, did you know that meditation for just 10 minutes daily can reduce anxiety by 60%?",
    duration: 4000,
    icon: "🧘"
  },
  {
    text: "While you wait for the server, did you know that omega-3 fatty acids from fish support brain health and memory?",
    duration: 4000,
    icon: "🐟"
  },
  {
    text: "While you wait for the server, did you know that maintaining good posture while sitting prevents spinal problems?",
    duration: 4000,
    icon: "🪑"
  },
  {
    text: "While you wait for the server, did you know that eating smaller, frequent meals helps maintain stable blood sugar?",
    duration: 4000,
    icon: "🍎"
  },
  {
    text: "While you wait for the server, did you know that social connections are as important for health as diet and exercise?",
    duration: 4000,
    icon: "👥"
  },
  {
    text: "While you wait for the server, did you know that wearing sunscreen daily prevents 90% of premature aging?",
    duration: 4000,
    icon: "☀️"
  },
  {
    text: "While you wait for the server, did you know that drinking water first thing in the morning kickstarts your metabolism?",
    duration: 4000,
    icon: "🌅"
  },
  {
    text: "While you wait for the server, did you know that chewing food slowly aids digestion and helps you feel full?",
    duration: 4000,
    icon: "🍽️"
  },
  {
    text: "While you wait for the server, did you know that regular eye exams can detect diabetes and high blood pressure?",
    duration: 4000,
    icon: "👁️"
  },
  {
    text: "While you wait for the server, did you know that listening to music can reduce pain perception by up to 25%?",
    duration: 4000,
    icon: "🎵"
  },
  {
    text: "While you wait for the server, did you know that taking the stairs instead of elevators strengthens your heart?",
    duration: 4000,
    icon: "🪜"
  },
  {
    text: "While you wait for the server, did you know that eating nuts regularly can lower your cholesterol levels?",
    duration: 4000,
    icon: "🥜"
  },
  {
    text: "While you wait for the server, did you know that houseplants can improve indoor air quality and reduce stress?",
    duration: 4000,
    icon: "🪴"
  },
  {
    text: "While you wait for the server, did you know that cold showers can boost your immune system and metabolism?",
    duration: 4000,
    icon: "🚿"
  },
  {
    text: "While you wait for the server, did you know that keeping a gratitude journal improves mental health and sleep?",
    duration: 4000,
    icon: "📝"
  },
  {
    text: "While you wait for the server, did you know that eating dark chocolate in moderation can lower blood pressure?",
    duration: 4000,
    icon: "🍫"
  },
  {
    text: "While you wait for the server, did you know that regular dental checkups can prevent heart disease?",
    duration: 4000,
    icon: "🦷"
  },
  {
    text: "While you wait for the server, did you know that spending time in nature reduces cortisol stress hormone levels?",
    duration: 4000,
    icon: "🌳"
  },
  {
    text: "While you wait for the server, did you know that probiotics in yogurt support digestive and immune health?",
    duration: 4000,
    icon: "🥛"
  },
  {
    text: "While you wait for the server, did you know that reading regularly can improve brain function and prevent cognitive decline?",
    duration: 4000,
    icon: "📚"
  },
  {
    text: "While you wait for the server, did you know that aromatherapy with lavender can reduce anxiety and improve sleep?",
    duration: 4000,
    icon: "💜"
  },
  {
    text: "While you wait for the server, did you know that eating berries regularly can improve memory and brain function?",
    duration: 4000,
    icon: "🫐"
  },
  {
    text: "While you wait for the server, did you know that maintaining good friendships can add years to your life?",
    duration: 4000,
    icon: "🤝"
  },
  {
    text: "While you wait for the server, did you know that drinking green smoothies provides concentrated vitamins and minerals?",
    duration: 4000,
    icon: "🥬"
  },
  {
    text: "While you wait for the server, did you know that regular massage therapy can reduce muscle tension and improve circulation?",
    duration: 4000,
    icon: "💆"
  },
  {
    text: "While you wait for the server, did you know that eating fermented foods like kimchi supports gut health?",
    duration: 4000,
    icon: "🥬"
  },
  {
    text: "While you wait for the server, did you know that learning new skills keeps your brain sharp and prevents dementia?",
    duration: 4000,
    icon: "🧩"
  },
  {
    text: "While you wait for the server, did you know that practicing good hygiene prevents 70% of common illnesses?",
    duration: 4000,
    icon: "🧴"
  },
  {
    text: "While you wait for the server, did you know that eating slowly can help you lose weight naturally?",
    duration: 4000,
    icon: "⏳"
  },
  {
    text: "While you wait for the server, did you know that vitamin C doesn't prevent colds but can shorten their duration?",
    duration: 4000,
    icon: "🍊"
  },
  {
    text: "While you wait for the server, did you know that regular hugs release oxytocin, which reduces stress and pain?",
    duration: 4000,
    icon: "🤗"
  },
  {
    text: "While you wait for the server, did you know that eating spicy foods can boost your metabolism temporarily?",
    duration: 4000,
    icon: "🌶️"
  },
  {
    text: "While you wait for the server, did you know that proper hand placement during CPR can double survival rates?",
    duration: 4000,
    icon: "❤️‍🩹"
  },
  {
    text: "While you wait for the server, did you know that dancing is one of the best exercises for brain health?",
    duration: 4000,
    icon: "💃"
  }
];

// Clinical insights for healthcare providers - expanded to ~50 messages
const PROVIDER_MESSAGES: LoadingMessage[] = [
  {
    text: "While you wait for the server, did you know that red flag symptoms often present subtly - trust your clinical intuition?",
    duration: 4000,
    icon: "🚩"
  },
  {
    text: "While you wait for the server, did you know that new guidelines recommend shorter antibiotic courses for many infections?",
    duration: 4000,
    icon: "💊"
  },
  {
    text: "While you wait for the server, did you know that active listening in the first 2 minutes improves diagnostic accuracy by 40%?",
    duration: 4000,
    icon: "👂"
  },
  {
    text: "While you wait for the server, did you know that medication reconciliation prevents 70% of adverse drug events?",
    duration: 4000,
    icon: "✅"
  },
  {
    text: "While you wait for the server, did you know that considering zebras becomes important when horses don't fit the clinical picture?",
    duration: 4000,
    icon: "🦓"
  },
  {
    text: "While you wait for the server, did you know that patient-reported pain scores correlate poorly with objective findings?",
    duration: 4000,
    icon: "📈"
  },
  {
    text: "While you wait for the server, did you know that standardized handoff protocols reduce errors by 60% during shift changes?",
    duration: 4000,
    icon: "🔄"
  },
  {
    text: "While you wait for the server, did you know that clear progress notes improve care continuity across provider teams?",
    duration: 4000,
    icon: "👥"
  },
  {
    text: "While you wait for the server, did you know that the first 15 minutes often determine the outcome in critical cases?",
    duration: 4000,
    icon: "⏱️"
  },
  {
    text: "While you wait for the server, did you know that peer consultation improves diagnostic confidence and patient outcomes?",
    duration: 4000,
    icon: "🤝"
  },
  {
    text: "While you wait for the server, did you know that sepsis mortality decreases by 7% for every hour delay in antibiotic administration?",
    duration: 4000,
    icon: "⚡"
  },
  {
    text: "While you wait for the server, did you know that clinical decision rules can reduce unnecessary testing by 30%?",
    duration: 4000,
    icon: "📊"
  },
  {
    text: "While you wait for the server, did you know that patient safety events are 50% more likely during evening and night shifts?",
    duration: 4000,
    icon: "🌙"
  },
  {
    text: "While you wait for the server, did you know that simulation training reduces medical errors by up to 45%?",
    duration: 4000,
    icon: "🎯"
  },
  {
    text: "While you wait for the server, did you know that team-based care improves chronic disease outcomes by 25%?",
    duration: 4000,
    icon: "👨‍⚕️"
  },
  {
    text: "While you wait for the server, did you know that electronic health records reduce prescription errors by 80%?",
    duration: 4000,
    icon: "💻"
  },
  {
    text: "While you wait for the server, did you know that hand hygiene compliance above 95% reduces hospital-acquired infections by 40%?",
    duration: 4000,
    icon: "🧼"
  },
  {
    text: "While you wait for the server, did you know that cognitive biases cause up to 15% of diagnostic errors?",
    duration: 4000,
    icon: "🧠"
  },
  {
    text: "While you wait for the server, did you know that patient-centered communication reduces malpractice risk by 60%?",
    duration: 4000,
    icon: "💬"
  },
  {
    text: "While you wait for the server, did you know that early mobility protocols reduce ICU stay by 2-3 days on average?",
    duration: 4000,
    icon: "🚶"
  },
  {
    text: "While you wait for the server, did you know that clinical pharmacist involvement reduces adverse drug events by 66%?",
    duration: 4000,
    icon: "💊"
  },
  {
    text: "While you wait for the server, did you know that cultural competency training improves patient satisfaction scores by 20%?",
    duration: 4000,
    icon: "🌍"
  },
  {
    text: "While you wait for the server, did you know that evidence-based protocols reduce practice variation by up to 35%?",
    duration: 4000,
    icon: "📋"
  },
  {
    text: "While you wait for the server, did you know that burnout affects 50% of physicians and increases medical errors?",
    duration: 4000,
    icon: "😓"
  },
  {
    text: "While you wait for the server, did you know that point-of-care ultrasound changes management in 40% of cases?",
    duration: 4000,
    icon: "📱"
  },
  {
    text: "While you wait for the server, did you know that shared decision-making improves patient adherence by 30%?",
    duration: 4000,
    icon: "🤝"
  },
  {
    text: "While you wait for the server, did you know that clinical prediction models improve diagnostic accuracy by 15-20%?",
    duration: 4000,
    icon: "🎯"
  },
  {
    text: "While you wait for the server, did you know that bedside manner training reduces patient complaints by 75%?",
    duration: 4000,
    icon: "😊"
  },
  {
    text: "While you wait for the server, did you know that care bundle implementation reduces central line infections by 85%?",
    duration: 4000,
    icon: "📦"
  },
  {
    text: "While you wait for the server, did you know that rapid response teams reduce cardiac arrests by 50%?",
    duration: 4000,
    icon: "🚨"
  },
  {
    text: "While you wait for the server, did you know that medication adherence monitoring improves outcomes by 25%?",
    duration: 4000,
    icon: "📊"
  },
  {
    text: "While you wait for the server, did you know that surgical checklists prevent 35% of major complications?",
    duration: 4000,
    icon: "✅"
  },
  {
    text: "While you wait for the server, did you know that telemedicine reduces no-show rates by 40%?",
    duration: 4000,
    icon: "📹"
  },
  {
    text: "While you wait for the server, did you know that peer review programs improve diagnostic accuracy by 20%?",
    duration: 4000,
    icon: "👥"
  },
  {
    text: "While you wait for the server, did you know that clinical alerts reduce preventable drug interactions by 55%?",
    duration: 4000,
    icon: "⚠️"
  },
  {
    text: "While you wait for the server, did you know that patient portals increase engagement and satisfaction by 35%?",
    duration: 4000,
    icon: "📱"
  },
  {
    text: "While you wait for the server, did you know that quality improvement initiatives reduce mortality rates by 15%?",
    duration: 4000,
    icon: "📈"
  },
  {
    text: "While you wait for the server, did you know that clinical pathways reduce length of stay by 1.5 days on average?",
    duration: 4000,
    icon: "🛤️"
  },
  {
    text: "While you wait for the server, did you know that interprofessional rounds improve patient satisfaction by 25%?",
    duration: 4000,
    icon: "👨‍⚕️"
  },
  {
    text: "While you wait for the server, did you know that antibiotic stewardship programs reduce resistance by 30%?",
    duration: 4000,
    icon: "🦠"
  },
  {
    text: "While you wait for the server, did you know that fall prevention protocols reduce hospital falls by 45%?",
    duration: 4000,
    icon: "🛡️"
  },
  {
    text: "While you wait for the server, did you know that clinical decision support reduces diagnostic errors by 20%?",
    duration: 4000,
    icon: "🧠"
  },
  {
    text: "While you wait for the server, did you know that patient safety huddles reduce adverse events by 35%?",
    duration: 4000,
    icon: "👥"
  },
  {
    text: "While you wait for the server, did you know that medication reconciliation at discharge prevents 60% of readmissions?",
    duration: 4000,
    icon: "🏠"
  },
  {
    text: "While you wait for the server, did you know that clinical guidelines adherence improves outcomes by 20-30%?",
    duration: 4000,
    icon: "📚"
  },
  {
    text: "While you wait for the server, did you know that therapeutic communication reduces patient anxiety by 40%?",
    duration: 4000,
    icon: "💭"
  },
  {
    text: "While you wait for the server, did you know that continuing education requirements improve clinical competency by 25%?",
    duration: 4000,
    icon: "🎓"
  },
  {
    text: "While you wait for the server, did you know that patient feedback systems improve care quality scores by 30%?",
    duration: 4000,
    icon: "📝"
  },
  {
    text: "While you wait for the server, did you know that clinical mentorship programs reduce turnover by 50%?",
    duration: 4000,
    icon: "👩‍🏫"
  },
  {
    text: "While you wait for the server, did you know that evidence-based practice reduces costs by 15-20% without compromising quality?",
    duration: 4000,
    icon: "💰"
  }
];

// Contextual messages based on query type
const SYMPTOM_MESSAGES: LoadingMessage[] = [
  {
    text: "🔍 Analyzing symptoms: Looking for patterns and red flags in your description...",
    duration: 3000,
    icon: "🔬"
  },
  {
    text: "📝 Medical Insight: Symptom duration and timing often provide key diagnostic clues.",
    duration: 4000,
    icon: "⏰"
  }
];

const MEDICATION_MESSAGES: LoadingMessage[] = [
  {
    text: "💊 Processing medication query: Checking interactions and safety considerations...",
    duration: 3000,
    icon: "🔍"
  },
  {
    text: "⚠️ Safety First: Always verify medication doses with your pharmacist or doctor.",
    duration: 4000,
    icon: "🛡️"
  }
];

/**
 * Get contextual loading messages based on user type and query - now shows random messages after 15 seconds
 */
export function getLoadingMessages(
  userType: 'patient' | 'provider', 
  queryType?: 'symptoms' | 'medications' | 'general'
): LoadingMessage[] {
  const baseMessages = userType === 'patient' ? PATIENT_MESSAGES : PROVIDER_MESSAGES;
  
  // Return shuffled messages for variety
  return [...baseMessages].sort(() => Math.random() - 0.5);
}

/**
 * Get a single random tip for quick display
 */
export function getRandomTip(userType: 'patient' | 'provider'): LoadingMessage {
  const messages = userType === 'patient' ? PATIENT_MESSAGES : PROVIDER_MESSAGES;
  return messages[Math.floor(Math.random() * messages.length)] || {
    text: "Processing your request...",
    duration: 4000,
    icon: "⏳"
  };
}

/**
 * Hook to show random loading messages after 15 seconds delay
 */
export function useLoadingMessages(
  userType: 'patient' | 'provider',
  queryType?: 'symptoms' | 'medications' | 'general',
  isLoading: boolean = false
): LoadingMessage {
  const [currentMessage, setCurrentMessage] = useState<LoadingMessage>({
    text: "Processing your request...",
    duration: 4000,
    icon: "⏳"
  });
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      setHasStarted(false);
      setCurrentMessage({
        text: "Processing your request...",
        duration: 4000,
        icon: "⏳"
      });
      return;
    }
    
    // Start showing educational messages after 15 seconds
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
      const messages = getLoadingMessages(userType, queryType);
      
      const showRandomMessage = () => {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)] || {
          text: "Processing your request...",
          duration: 4000,
          icon: "⏳"
        };
        setCurrentMessage(randomMessage);
        
        // Schedule next random message
        setTimeout(showRandomMessage, randomMessage.duration);
      };
      
      showRandomMessage();
    }, 15000); // 15 second delay
    
    return () => {
      clearTimeout(startTimeout);
    };
  }, [isLoading, userType, queryType]);
  
  return currentMessage;
}

// For components that don't use hooks
export class LoadingMessageManager {
  private messages: LoadingMessage[];
  private currentIndex: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private startTimer: NodeJS.Timeout | null = null;
  private onMessageChange?: (message: LoadingMessage) => void;
  private hasStarted: boolean = false;
  
  constructor(
    private userType: 'patient' | 'provider', 
    private queryType?: 'symptoms' | 'medications' | 'general'
  ) {
    this.messages = getLoadingMessages(userType, queryType);
  }
  
  start(onMessageChange: (message: LoadingMessage) => void) {
    this.onMessageChange = onMessageChange;
    this.hasStarted = false;
    
    // Show initial processing message
    onMessageChange({
      text: "Processing your request...",
      duration: 4000,
      icon: "⏳"
    });
    
    // Start showing educational messages after 15 seconds
    this.startTimer = setTimeout(() => {
      this.hasStarted = true;
      this.showRandomMessage();
    }, 15000);
  }
  
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    this.hasStarted = false;
  }
  
  private showRandomMessage() {
    if (!this.onMessageChange || !this.hasStarted) return;
    
    const randomMessage = this.messages[Math.floor(Math.random() * this.messages.length)] || {
      text: "Processing your request...",
      duration: 4000,
      icon: "⏳"
    };
    this.onMessageChange(randomMessage);
    
    this.timer = setTimeout(() => {
      this.showRandomMessage();
    }, randomMessage.duration);
  }
}
