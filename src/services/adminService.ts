import { AdminUser } from '../../types';

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    providers: number;
    patients: number;
    questionsToday: number;
    questionsThisWeek: number;
    suspendedUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    avgQuestionsPerUserDay: number;
    avgQuestionsPerUserWeek: number;
}

export interface UserEngagement {
    userId: string;
    userName: string;
    userType: 'patient' | 'provider';
    questionsToday: number;
    questionsThisWeek: number;
    questionsThisMonth: number;
    lastActiveDate: string;
    engagementScore: number; // 0-100 based on activity
}

export interface UserFilters {
    search?: string;
    userType?: 'patient' | 'provider' | 'all';
    status?: 'Active' | 'Suspended' | 'all';
    signupDateFrom?: string;
    signupDateTo?: string;
}

export interface UserActionResult {
    success: boolean;
    message: string;
    user?: AdminUser;
}

export interface EmailVerificationResult {
    success: boolean;
    message: string;
    sentCount?: number;
    failedCount?: number;
    failedEmails?: string[];
}

export interface GrowthMetrics {
    period: string;
    newUsers: number;
    growthRate: number;
    totalAtEnd: number;
}

export interface QuestionMetrics {
    date: string;
    count: number;
    userCount: number;
}

export interface IPRateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
    blockDurationMinutes: number;
}

export interface IPActivity {
    ip: string;
    requestCount: number;
    lastRequest: Date;
    blocked: boolean;
    blockExpiry?: Date;
}

// Mock data - in a real app, this would come from Firebase/Firestore
const mockUsers: AdminUser[] = [
    {
        id: '1',
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        userType: 'provider',
        country: 'United States',
        institution: 'General Hospital',
        specialty: 'Cardiology',
        signupDate: '2024-01-15',
        status: 'Active'
    },
    {
        id: '2',
        fullName: 'Michael Chen',
        email: 'michael.chen@email.com',
        userType: 'patient',
        country: 'Canada',
        signupDate: '2024-02-20',
        status: 'Active'
    },
    {
        id: '3',
        fullName: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@clinic.com',
        userType: 'provider',
        country: 'United States',
        institution: 'City Medical Center',
        specialty: 'Pediatrics',
        signupDate: '2024-01-08',
        status: 'Active'
    },
    {
        id: '4',
        fullName: 'James Wilson',
        email: 'james.wilson@email.com',
        userType: 'patient',
        country: 'United Kingdom',
        signupDate: '2024-03-10',
        status: 'Suspended'
    },
    {
        id: '5',
        fullName: 'Dr. David Kim',
        email: 'david.kim@medical.com',
        userType: 'provider',
        country: 'South Korea',
        institution: 'Seoul Medical Center',
        specialty: 'Neurology',
        signupDate: '2024-02-05',
        status: 'Active'
    }
];

// Mock question metrics
const mockQuestionMetrics: QuestionMetrics[] = [
    { date: new Date().toISOString().split('T')[0] || '', count: 145, userCount: 32 },
    { date: new Date(Date.now() - 86400000).toISOString().split('T')[0] || '', count: 132, userCount: 28 },
    { date: new Date(Date.now() - 172800000).toISOString().split('T')[0] || '', count: 156, userCount: 35 },
    { date: new Date(Date.now() - 259200000).toISOString().split('T')[0] || '', count: 121, userCount: 25 },
    { date: new Date(Date.now() - 345600000).toISOString().split('T')[0] || '', count: 143, userCount: 30 },
    { date: new Date(Date.now() - 432000000).toISOString().split('T')[0] || '', count: 167, userCount: 38 },
    { date: new Date(Date.now() - 518400000).toISOString().split('T')[0] || '', count: 139, userCount: 29 },
];

// IP tracking storage (in production, use Redis or similar)
const ipActivityMap: Map<string, IPActivity> = new Map();

// Default rate limit configuration (human-like usage patterns)
const defaultRateLimitConfig: IPRateLimitConfig = {
    maxRequestsPerMinute: 60,  // ~1 request per second for active usage
    maxRequestsPerHour: 600,    // Sustained usage with breaks
    maxRequestsPerDay: 3000,    // Full day usage with normal patterns
    blockDurationMinutes: 30    // Shorter block for legitimate users who hit limits
};

class AdminService {
    private users: AdminUser[] = [...mockUsers];
    private questionMetrics: QuestionMetrics[] = [...mockQuestionMetrics];
    private rateLimitConfig: IPRateLimitConfig = { ...defaultRateLimitConfig };

    // Simulate API delay
    private delay(ms: number = 500): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check IP rate limit
    async checkIPRateLimit(ip: string): Promise<{ allowed: boolean; message?: string }> {
        const now = new Date();
        const activity = ipActivityMap.get(ip);

        if (!activity) {
            ipActivityMap.set(ip, {
                ip,
                requestCount: 1,
                lastRequest: now,
                blocked: false
            });
            return { allowed: true };
        }

        // Check if IP is blocked
        if (activity.blocked && activity.blockExpiry) {
            if (now < activity.blockExpiry) {
                const remainingMinutes = Math.ceil((activity.blockExpiry.getTime() - now.getTime()) / 60000);
                return { 
                    allowed: false, 
                    message: `IP blocked for ${remainingMinutes} more minutes due to excessive requests` 
                };
            } else {
                // Unblock if block period expired
                activity.blocked = false;
                activity.blockExpiry = undefined;
                activity.requestCount = 0;
            }
        }

        // Calculate time windows
        const dayAgo = new Date(now.getTime() - 86400000);

        // Reset counter if last request was more than a day ago
        if (activity.lastRequest < dayAgo) {
            activity.requestCount = 1;
            activity.lastRequest = now;
            return { allowed: true };
        }

        // Check rate limits
        const timeSinceLastRequest = now.getTime() - activity.lastRequest.getTime();
        
        if (timeSinceLastRequest < 60000) { // Within a minute
            if (activity.requestCount >= this.rateLimitConfig.maxRequestsPerMinute) {
                // Block the IP
                activity.blocked = true;
                activity.blockExpiry = new Date(now.getTime() + this.rateLimitConfig.blockDurationMinutes * 60000);
                return { 
                    allowed: false, 
                    message: `Rate limit exceeded. IP blocked for ${this.rateLimitConfig.blockDurationMinutes} minutes` 
                };
            }
        }

        activity.requestCount++;
        activity.lastRequest = now;
        ipActivityMap.set(ip, activity);

        return { allowed: true };
    }

    // Update rate limit configuration
    async updateRateLimitConfig(config: Partial<IPRateLimitConfig>): Promise<void> {
        await this.delay();
        this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
    }

    // Get rate limit configuration
    async getRateLimitConfig(): Promise<IPRateLimitConfig> {
        await this.delay();
        return { ...this.rateLimitConfig };
    }

    // Get blocked IPs
    async getBlockedIPs(): Promise<IPActivity[]> {
        await this.delay();
        const now = new Date();
        return Array.from(ipActivityMap.values()).filter(activity => 
            activity.blocked && activity.blockExpiry && activity.blockExpiry > now
        );
    }

    // Unblock an IP
    async unblockIP(ip: string): Promise<UserActionResult> {
        await this.delay();
        const activity = ipActivityMap.get(ip);
        
        if (!activity) {
            return { success: false, message: 'IP not found' };
        }

        activity.blocked = false;
        activity.blockExpiry = undefined;
        activity.requestCount = 0;
        
        return { success: true, message: 'IP unblocked successfully' };
    }

    // Suspend a user
    async suspendUser(userId: string, reason?: string): Promise<UserActionResult> {
        await this.delay();
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.status === 'Suspended') {
            return { success: false, message: 'User is already suspended' };
        }

        user.status = 'Suspended';
        
        // In production, you would also:
        // 1. Update Firebase Auth to disable the account
        // 2. Log the suspension with reason and admin who performed it
        // 3. Send notification email to the user
        
        return { 
            success: true, 
            message: `User ${user.fullName} has been suspended${reason ? `: ${reason}` : ''}`,
            user 
        };
    }

    // Activate a user
    async activateUser(userId: string): Promise<UserActionResult> {
        await this.delay();
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.status === 'Active') {
            return { success: false, message: 'User is already active' };
        }

        user.status = 'Active';
        
        // In production, you would also:
        // 1. Update Firebase Auth to enable the account
        // 2. Log the activation
        // 3. Send notification email to the user
        
        return { 
            success: true, 
            message: `User ${user.fullName} has been activated`,
            user 
        };
    }

    // Get question metrics
    async getQuestionMetrics(days: number = 7): Promise<QuestionMetrics[]> {
        await this.delay();
        return this.questionMetrics.slice(0, days);
    }

    // Get questions asked today
    async getQuestionsToday(): Promise<number> {
        await this.delay();
        const today = new Date().toISOString().split('T')[0] || '';
        const todayMetrics = this.questionMetrics.find(m => m.date === today);
        return todayMetrics?.count || 0;
    }

    // Get user engagement metrics
    async getUserEngagement(userId?: string): Promise<UserEngagement[]> {
        await this.delay();
        
        // If specific user requested
        if (userId) {
            const user = this.users.find(u => u.id === userId);
            if (!user) return [];
            
            return [{
                userId: user.id,
                userName: user.fullName,
                userType: user.userType,
                questionsToday: Math.floor(Math.random() * 10),
                questionsThisWeek: Math.floor(Math.random() * 50),
                questionsThisMonth: Math.floor(Math.random() * 200),
                lastActiveDate: new Date().toISOString().split('T')[0] || '',
                engagementScore: Math.floor(Math.random() * 100)
            }];
        }
        
        // Return engagement for all users
        return this.users.map(user => ({
            userId: user.id,
            userName: user.fullName,
            userType: user.userType,
            questionsToday: Math.floor(Math.random() * 10),
            questionsThisWeek: Math.floor(Math.random() * 50),
            questionsThisMonth: Math.floor(Math.random() * 200),
            lastActiveDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
            engagementScore: user.status === 'Active' ? Math.floor(Math.random() * 100) : 0
        }));
    }

    // Get top engaged users
    async getTopEngagedUsers(limit: number = 10): Promise<UserEngagement[]> {
        await this.delay();
        
        const allEngagement = await this.getUserEngagement();
        return allEngagement
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, limit);
    }

    // Get inactive users (no activity in last 7 days)
    async getInactiveUsers(daysInactive: number = 7): Promise<AdminUser[]> {
        await this.delay();
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
        
        // Simulate checking last activity
        return this.users.filter(() => {
            // Random simulation - 20% of users are inactive
            return Math.random() < 0.2;
        });
    }

    // Send verification email to a single user
    async sendVerificationEmail(userId: string): Promise<UserActionResult> {
        await this.delay();
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // In production, this would:
        // 1. Generate a unique verification token
        // 2. Store token in database with expiry
        // 3. Send email via service like SendGrid/AWS SES
        // 4. Track email sent status
        
        
        return {
            success: true,
            message: `Verification email sent to ${user.email}`
        };
    }

    // Send verification emails to all unverified users
    async sendBulkVerificationEmails(userIds?: string[]): Promise<EmailVerificationResult> {
        await this.delay(1000); // Longer delay for bulk operation
        
        const targetUsers = userIds 
            ? this.users.filter(u => userIds.includes(u.id))
            : this.users.filter(u => u.status === 'Active'); // Only send to active users
        
        if (targetUsers.length === 0) {
            return {
                success: false,
                message: 'No users to send emails to'
            };
        }

        const failedEmails: string[] = [];
        let sentCount = 0;

        // Simulate sending emails with some failures
        for (const user of targetUsers) {
            // Simulate 95% success rate
            if (Math.random() > 0.05) {
                sentCount++;
            } else {
                failedEmails.push(user.email);
            }
        }

        return {
            success: sentCount > 0,
            message: `Sent ${sentCount} verification emails${failedEmails.length > 0 ? `, ${failedEmails.length} failed` : ''}`,
            sentCount,
            failedCount: failedEmails.length,
            failedEmails: failedEmails.length > 0 ? failedEmails : undefined
        };
    }

    // Get user growth metrics for different periods
    async getUserGrowthMetrics(): Promise<GrowthMetrics[]> {
        await this.delay();
        
        const totalUsers = this.users.length;
        
        // Simulate growth data for different periods
        const periods = [
            { days: 7, label: '7 Days' },
            { days: 30, label: '30 Days' },
            { days: 60, label: '60 Days' },
            { days: 90, label: '90 Days' },
            { days: 180, label: '6 Months' },
            { days: 365, label: '1 Year' }
        ];

        return periods.map(period => {
            // Simulate growth based on period (older periods show more growth)
            const growthFactor = Math.log(period.days + 1) / 10;
            const newUsers = Math.floor(5 * period.days * growthFactor + Math.random() * 10);
            const previousTotal = Math.max(1, totalUsers - newUsers);
            const growthRate = ((newUsers / previousTotal) * 100);

            return {
                period: period.label,
                newUsers,
                growthRate: Math.round(growthRate * 10) / 10,
                totalAtEnd: totalUsers
            };
        });
    }

    // Mark user as verified
    async verifyUser(userId: string): Promise<UserActionResult> {
        await this.delay();
        
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // In production, this would update the user's verified status in the database
        
        return {
            success: true,
            message: `User ${user.fullName} has been verified`,
            user
        };
    }

    async getUsers(filters?: UserFilters): Promise<AdminUser[]> {
        await this.delay();

        let filteredUsers = [...this.users];

        if (filters) {
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredUsers = filteredUsers.filter(user =>
                    user.fullName.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm)
                );
            }

            if (filters.userType && filters.userType !== 'all') {
                filteredUsers = filteredUsers.filter(user => user.userType === filters.userType);
            }

            if (filters.status && filters.status !== 'all') {
                filteredUsers = filteredUsers.filter(user => user.status === filters.status);
            }

            if (filters.signupDateFrom) {
                filteredUsers = filteredUsers.filter(user => user.signupDate >= filters.signupDateFrom!);
            }

            if (filters.signupDateTo) {
                filteredUsers = filteredUsers.filter(user => user.signupDate <= filters.signupDateTo!);
            }
        }

        return filteredUsers;
    }

    async getUserById(id: string): Promise<AdminUser | null> {
        await this.delay();
        return this.users.find(user => user.id === id) || null;
    }

    async getStats(): Promise<AdminStats> {
        await this.delay();

        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.status === 'Active').length;
        const suspendedUsers = this.users.filter(user => user.status === 'Suspended').length;
        const providers = this.users.filter(user => user.userType === 'provider').length;
        const patients = this.users.filter(user => user.userType === 'patient').length;
        
        // Simulate verified/unverified users (70% verified)
        const verifiedUsers = Math.floor(totalUsers * 0.7);
        const unverifiedUsers = totalUsers - verifiedUsers;

        // Get question metrics
        const today = new Date().toISOString().split('T')[0] || '';
        const todayMetrics = this.questionMetrics.find(m => m.date === today);
        const questionsToday = todayMetrics?.count || 0;
        
        const weekTotal = this.questionMetrics.slice(0, 7).reduce((sum, m) => sum + m.count, 0);
        
        // Calculate average questions per user
        const avgQuestionsPerUserDay = activeUsers > 0 ? Math.round(questionsToday / activeUsers * 10) / 10 : 0;
        const avgQuestionsPerUserWeek = activeUsers > 0 ? Math.round(weekTotal / activeUsers * 10) / 10 : 0;

        return {
            totalUsers,
            activeUsers,
            providers,
            patients,
            questionsToday,
            questionsThisWeek: weekTotal,
            suspendedUsers,
            verifiedUsers,
            unverifiedUsers,
            avgQuestionsPerUserDay,
            avgQuestionsPerUserWeek
        };
    }

    async createUser(userData: Omit<AdminUser, 'id'>): Promise<UserActionResult> {
        await this.delay();

        const newUser: AdminUser = {
            ...userData,
            id: Date.now().toString() // Simple ID generation
        };

        this.users.push(newUser);

        return {
            success: true,
            message: 'User created successfully',
            user: newUser
        };
    }

    async updateUser(id: string, updates: Partial<AdminUser>): Promise<UserActionResult> {
        await this.delay();

        const userIndex = this.users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        this.users[userIndex] = { ...this.users[userIndex], ...updates } as AdminUser;

        return {
            success: true,
            message: 'User updated successfully',
            user: this.users[userIndex]
        };
    }

    async deleteUser(id: string): Promise<UserActionResult> {
        await this.delay();

        const userIndex = this.users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        const deletedUser = this.users[userIndex];
        this.users.splice(userIndex, 1);

        return {
            success: true,
            message: 'User deleted successfully',
            user: deletedUser
        };
    }

    async bulkUpdateUsers(userIds: string[], updates: Partial<AdminUser>): Promise<UserActionResult> {
        await this.delay();

        const updatedUsers: AdminUser[] = [];
        const failedIds: string[] = [];

        for (const id of userIds) {
            const result = await this.updateUser(id, updates);
            if (result.success && result.user) {
                updatedUsers.push(result.user);
            } else {
                failedIds.push(id);
            }
        }

        if (failedIds.length > 0) {
            return {
                success: false,
                message: `Failed to update users: ${failedIds.join(', ')}`
            };
        }

        return {
            success: true,
            message: `Successfully updated ${updatedUsers.length} users`
        };
    }
}

export const adminService = new AdminService();
