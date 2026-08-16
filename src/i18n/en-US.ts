import type { MessageSchema } from './uk';

export default {
  validation: {
    requiredEmail: 'Enter your email',
    requiredPassword: 'Enter your password',
    requiredFirstName: 'Enter your first name',
    requiredLastName: 'Enter your last name',
    minPassword: 'At least 6 characters',
    requiredAmount: 'Enter an amount greater than 0',
    requiredDate: 'Select a date',
  },

  auth: {
    login: {
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submit: 'Sign in',
      noAccount: "Don't have an account?",
      registerLink: 'Sign up',
      errorFallback: 'Sign-in failed',
    },
    register: {
      firstNameLabel: 'First name',
      lastNameLabel: 'Last name',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      passwordHint: 'At least 6 characters',
      submit: 'Sign up',
      haveAccount: 'Already have an account?',
      loginLink: 'Sign in',
      errorFallback: 'Sign-up failed',
      confirmationSent:
        'A confirmation email was sent to {email}. Follow the link in the email to activate your account.',
      backToLogin: 'Back to sign in',
    },
  },

  layout: {
    menuAria: 'Menu',
    logoutAria: 'Sign out',
    navHome: 'Home',
    navSettings: 'Settings',
    navMonthlyReport: 'Monthly report',
    navGeneralReport: 'General report',
    navEmployeeRates: 'Employee rates',
  },

  home: {
    welcomeNamed: 'Welcome, {name}!',
    welcomeGeneric: 'Welcome!',
  },

  settings: {
    title: 'Profile settings',
    changeAvatar: 'Change avatar',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    submit: 'Save',
    successMessage: 'Profile updated',
    errorFallback: 'Could not save changes',
  },

  reports: {
    monthly: {
      title: 'Monthly report',
      monthLabel: 'Month',
      placeholder:
        'Hours and salary calculations for the selected month will appear once Stage 9 (salary and social contribution calculations) is implemented.',
    },
    general: {
      title: 'General report',
      placeholder:
        'A summary report across all employees (monthly and yearly) will appear once Stage 9 is implemented. This page is admin-only.',
    },
  },

  admin: {
    rates: {
      title: 'Employee rates',
      employeeLabel: 'Employee',
      rateLabel: 'Rate, UAH/hour',
      effectiveFromLabel: 'Effective from',
      submit: 'Save rate',
      historyTitle: 'Rate history',
      perHourSuffix: 'UAH/hour',
      columnEffectiveFrom: 'Effective from',
      columnRate: 'Rate',
      successMessage: 'Rate saved',
      errorFallback: 'Could not save the rate',
    },
  },

  errors: {
    notFound: {
      title: 'Page not found',
      backHome: 'Go home',
    },
  },

  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
} satisfies MessageSchema;
