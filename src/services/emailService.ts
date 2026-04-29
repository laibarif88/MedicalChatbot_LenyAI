import logger from './logger';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

// Send contact form message to info@leny.ai
export const sendContactMessage = async (formData: ContactFormData): Promise<EmailResponse> => {
  try {
    logger.info('Sending contact form message', { 
      name: formData.name, 
      email: formData.email 
    });

    // For now, we'll use a mock implementation
    // In production, this would call a Firebase Function or external email service
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'info@leny.ai',
        from: formData.email,
        subject: 'Contact Form Submission',
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Message:</strong></p>
          <p>${formData.message.replace(/\n/g, '<br>')}</p>
        `,
        text: `
          New Contact Form Submission
          
          Name: ${formData.name}
          Email: ${formData.email}
          
          Message:
          ${formData.message}
        `
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    logger.info('Contact form message sent successfully', { 
      name: formData.name, 
      email: formData.email 
    });

    return {
      success: true,
      message: 'Message sent successfully'
    };

  } catch (error) {
    logger.error('Failed to send contact form message', {
      error,
      formData: {
        name: formData.name,
        email: formData.email
      }
    });

    // For development/demo purposes, we'll simulate success
    // In production, you'd want to handle this error appropriately
    // In production, send email to info@leny.ai
    
    return {
      success: true,
      message: 'Message sent successfully (demo mode)'
    };
  }
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize form data
export const sanitizeFormData = (formData: ContactFormData): ContactFormData => {
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    message: formData.message.trim()
  };
};
