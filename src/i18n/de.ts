import type { MessageSchema } from './uk';

export default {
  validation: {
    requiredEmail: 'E-Mail eingeben',
    requiredPassword: 'Passwort eingeben',
    requiredFirstName: 'Vorname eingeben',
    requiredLastName: 'Nachname eingeben',
    minPassword: 'Mindestens 6 Zeichen',
    requiredAmount: 'Betrag größer als 0 eingeben',
    requiredDate: 'Datum wählen',
  },

  auth: {
    login: {
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      submit: 'Anmelden',
      noAccount: 'Noch kein Konto?',
      registerLink: 'Registrieren',
      errorFallback: 'Anmeldung fehlgeschlagen',
    },
    register: {
      firstNameLabel: 'Vorname',
      lastNameLabel: 'Nachname',
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      passwordHint: 'Mindestens 6 Zeichen',
      submit: 'Registrieren',
      haveAccount: 'Bereits ein Konto?',
      loginLink: 'Anmelden',
      errorFallback: 'Registrierung fehlgeschlagen',
      confirmationSent:
        'Eine Bestätigungs-E-Mail wurde an {email} gesendet. Folgen Sie dem Link in der E-Mail, um Ihr Konto zu aktivieren.',
      backToLogin: 'Zurück zur Anmeldung',
    },
  },

  layout: {
    menuAria: 'Menü',
    logoutAria: 'Abmelden',
    navHome: 'Start',
    navSettings: 'Einstellungen',
    navMonthlyReport: 'Monatsbericht',
    navGeneralReport: 'Gesamtbericht',
    navEmployeeRates: 'Mitarbeiterlöhne',
  },

  home: {
    welcomeNamed: 'Willkommen, {name}!',
    welcomeGeneric: 'Willkommen!',
  },

  settings: {
    title: 'Profileinstellungen',
    changeAvatar: 'Avatar ändern',
    firstNameLabel: 'Vorname',
    lastNameLabel: 'Nachname',
    submit: 'Speichern',
    successMessage: 'Profil aktualisiert',
    errorFallback: 'Änderungen konnten nicht gespeichert werden',
  },

  reports: {
    monthly: {
      title: 'Monatsbericht',
      monthLabel: 'Monat',
      placeholder:
        'Die Berechnung von Stunden und Gehalt für den gewählten Monat erscheint nach Umsetzung von Stufe 9 (Gehalts- und Sozialabgabenberechnung).',
    },
    general: {
      title: 'Gesamtbericht',
      placeholder:
        'Ein zusammenfassender Bericht über alle Mitarbeiter (Monat und Jahr) erscheint nach Umsetzung von Stufe 9. Diese Seite ist nur für Administratoren.',
    },
  },

  admin: {
    rates: {
      title: 'Mitarbeiterlöhne',
      employeeLabel: 'Mitarbeiter',
      rateLabel: 'Stundenlohn, UAH/Std.',
      effectiveFromLabel: 'Gültig ab',
      submit: 'Lohn speichern',
      historyTitle: 'Lohnverlauf',
      perHourSuffix: 'UAH/Std.',
      columnEffectiveFrom: 'Gültig ab',
      columnRate: 'Lohn',
      successMessage: 'Lohn gespeichert',
      errorFallback: 'Lohn konnte nicht gespeichert werden',
    },
  },

  errors: {
    notFound: {
      title: 'Seite nicht gefunden',
      backHome: 'Zur Startseite',
    },
  },

  months: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
} satisfies MessageSchema;
