// Application Configuration for Provider Version
export const appConfig = {
  appName: 'Leny AI Provider',
  appType: 'provider', // 'patient' | 'provider'
  defaultUserType: 'provider' as const,
  features: {
    proMode: {
      enabledByDefault: false,
      showToggle: true,
    },
    notes: {
      enabled: true,
      templates: ['SOAP', 'H&P', 'Progress'],
    },
    proactiveAnalysis: {
      enabled: true,
    },
    expertPanel: {
      enabled: true,
    },
  },
  branding: {
    primaryColor: 'var(--accent-orange)',
    secondaryColor: 'var(--accent-blue)',
    logo: 'L',
  },
};
