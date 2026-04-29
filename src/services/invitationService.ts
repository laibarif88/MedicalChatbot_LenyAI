import { Conversation, Participant } from '../types';

// Simple UUID generator alternative
const generateUUID = (): string => {
  return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  }) + '-' + Date.now().toString(36);
};

export interface PendingInvitation {
  id: string;
  conversationId: string;
  conversationTitle: string;
  inviterName: string;
  inviterEmail: string;
  inviteeContact: string; // email or phone number
  invitationType: 'email' | 'sms';
  invitationToken: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  joinedAt?: Date;
}

export interface InvitationRequest {
  conversationId: string;
  conversationTitle: string;
  inviterName: string;
  inviterEmail: string;
  contact: string;
  contactType: 'email' | 'phone';
  message?: string;
}

class InvitationService {
  private pendingInvitations: Map<string, PendingInvitation> = new Map();
  
  constructor() {
    this.loadPendingInvitations();
  }

  /**
   * Generate a unique invitation link for a conversation
   */
  generateInvitationLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?token=${token}`;
  }

  /**
   * Create and send an invitation
   */
  async sendInvitation(request: InvitationRequest): Promise<PendingInvitation> {
    const invitationId = generateUUID();
    const invitationToken = generateUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation: PendingInvitation = {
      id: invitationId,
      conversationId: request.conversationId,
      conversationTitle: request.conversationTitle,
      inviterName: request.inviterName,
      inviterEmail: request.inviterEmail,
      inviteeContact: request.contact,
      invitationType: request.contactType === 'email' ? 'email' : 'sms',
      invitationToken,
      createdAt: now,
      expiresAt,
      status: 'pending'
    };

    // Store the invitation
    this.pendingInvitations.set(invitationToken, invitation);
    this.savePendingInvitations();

    // Generate invitation link
    const invitationLink = this.generateInvitationLink(invitationToken);

    // Send the invitation
    if (request.contactType === 'email') {
      await this.sendEmailInvitation(invitation, invitationLink, request.message);
    } else {
      await this.sendSMSInvitation(invitation, invitationLink, request.message);
    }

    return invitation;
  }

  /**
   * Send email invitation
   */
  private async sendEmailInvitation(
    invitation: PendingInvitation, 
    invitationLink: string, 
    customMessage?: string
  ): Promise<void> {
    // In a real app, this would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll simulate the email sending and show a notification
    
    const subject = `${invitation.inviterName} invited you to join a conversation on Leny AI`;
    const message = customMessage || 
      `Hi! ${invitation.inviterName} has invited you to join the conversation "${invitation.conversationTitle}" on Leny AI Medical Assistant.`;
    
    const emailBody = `
${message}

Click the link below to join the conversation:
${invitationLink}

This invitation will expire on ${invitation.expiresAt.toLocaleDateString()}.

Best regards,
The Leny AI Team
    `;

    // Simulate email sending (in production, replace with actual email service)
    
    // In a real implementation, you would:
    // await emailService.send({
    //   to: invitation.inviteeContact,
    //   subject,
    //   html: generateEmailTemplate(invitation, invitationLink, message)
    // });
  }

  /**
   * Send SMS invitation
   */
  private async sendSMSInvitation(
    invitation: PendingInvitation, 
    invitationLink: string, 
    customMessage?: string
  ): Promise<void> {
    // In a real app, this would integrate with SMS service like Twilio, AWS SNS, etc.
    
    const message = customMessage || 
      `${invitation.inviterName} invited you to join "${invitation.conversationTitle}" on Leny AI.`;
    
    const smsBody = `${message} Join here: ${invitationLink} (Expires ${invitation.expiresAt.toLocaleDateString()})`;

    // Simulate SMS sending (in production, replace with actual SMS service)
    
    // In a real implementation, you would:
    // await smsService.send({
    //   to: invitation.inviteeContact,
    //   body: smsBody
    // });
  }

  /**
   * Validate and retrieve invitation by token
   */
  getInvitationByToken(token: string): PendingInvitation | null {
    const invitation = this.pendingInvitations.get(token);
    
    if (!invitation) {
      return null;
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      this.savePendingInvitations();
      return null;
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return null;
    }

    return invitation;
  }

  /**
   * Accept an invitation and join the conversation
   */
  async acceptInvitation(token: string, joinerInfo: { name: string; email?: string }): Promise<{
    success: boolean;
    conversationId?: string;
    error?: string;
  }> {
    const invitation = this.getInvitationByToken(token);
    
    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.joinedAt = new Date();
    this.savePendingInvitations();

    return {
      success: true,
      conversationId: invitation.conversationId
    };
  }

  /**
   * Get pending invitations for a conversation
   */
  getPendingInvitationsForConversation(conversationId: string): PendingInvitation[] {
    return Array.from(this.pendingInvitations.values())
      .filter(inv => inv.conversationId === conversationId && inv.status === 'pending');
  }

  /**
   * Cancel an invitation
   */
  cancelInvitation(token: string): boolean {
    const invitation = this.pendingInvitations.get(token);
    if (invitation && invitation.status === 'pending') {
      invitation.status = 'cancelled';
      this.savePendingInvitations();
      return true;
    }
    return false;
  }

  /**
   * Clean up expired invitations
   */
  cleanupExpiredInvitations(): void {
    const now = new Date();
    for (const [token, invitation] of this.pendingInvitations.entries()) {
      if (invitation.expiresAt < now && invitation.status === 'pending') {
        invitation.status = 'expired';
      }
    }
    this.savePendingInvitations();
  }

  /**
   * Load pending invitations from localStorage
   */
  private loadPendingInvitations(): void {
    try {
      const stored = localStorage.getItem('pendingInvitations');
      if (stored) {
        const invitations = JSON.parse(stored) as PendingInvitation[];
        this.pendingInvitations.clear();
        invitations.forEach(inv => {
          // Convert date strings back to Date objects
          inv.createdAt = new Date(inv.createdAt);
          inv.expiresAt = new Date(inv.expiresAt);
          if (inv.joinedAt) {
            inv.joinedAt = new Date(inv.joinedAt);
          }
          this.pendingInvitations.set(inv.invitationToken, inv);
        });
      }
    } catch (error) {
      
    }
  }

  /**
   * Save pending invitations to localStorage
   */
  private savePendingInvitations(): void {
    try {
      const invitations = Array.from(this.pendingInvitations.values());
      localStorage.setItem('pendingInvitations', JSON.stringify(invitations));
    } catch (error) {
      
    }
  }
}

// Export singleton instance
export const invitationService = new InvitationService();