import React, { useState } from 'react';
import { UserIcon, MailIcon, ChatBubbleIcon } from '../components/chat/Icons';
import { sendContactMessage, sanitizeFormData, isValidEmail } from '../services/emailService';

interface ContactUsScreenProps {
  onClose: () => void;
}

const InputField: React.FC<{ 
  icon: React.ReactNode; 
  type: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}> = ({ icon, type, placeholder, value, onChange, required = false }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition"
    />
  </div>
);

const TextAreaField: React.FC<{ 
  icon: React.ReactNode; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
}> = ({ icon, placeholder, value, onChange, required = false, rows = 4 }) => (
  <div className="relative">
    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
      {icon}
    </div>
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition resize-none"
    />
  </div>
);

const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ onClose }) => {
  // Generate random math problem for CAPTCHA
  const generateMathProblem = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  };

  const [mathProblem] = useState(generateMathProblem());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    captcha: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = formData.name.trim() !== '' && 
                     formData.email.trim() !== '' && 
                     formData.message.trim() !== '' &&
                     parseInt(formData.captcha) === mathProblem.answer;

  const handleInputChange = (field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    // Validate email format
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sanitizedData = sanitizeFormData(formData);
      const result = await sendContactMessage(sanitizedData);
      
      if (result.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '', captcha: '' });
      } else {
        setError(result.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h2>
          <p className="text-gray-600 mb-6">Thank you for contacting us. We'll get back to you soon!</p>
          <button
            onClick={onClose}
            className="w-full bg-[#D97941] text-white py-2.5 rounded-2xl font-medium hover:bg-[#C86A35] transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600">Send us a message and we'll get back to you soon!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            required
          />

          <InputField
            icon={<MailIcon className="h-5 w-5 text-gray-400" />}
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
          />



          <TextAreaField
            icon={<ChatBubbleIcon className="h-5 w-5 text-gray-400" />}
            placeholder="Your Message"
            value={formData.message}
            onChange={handleInputChange('message')}
            required
            rows={5}
          />

          <div className="bg-gray-50 p-4 rounded-2xl border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Human Verification: What is {mathProblem.num1} + {mathProblem.num2}?
            </label>
            <input
              type="number"
              placeholder="Enter the answer"
              value={formData.captcha}
              onChange={handleInputChange('captcha')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-2.5 rounded-2xl font-medium transition ${
              isFormValid && !isLoading
                ? 'bg-[#D97941] text-white hover:bg-[#C86A35]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactUsScreen;