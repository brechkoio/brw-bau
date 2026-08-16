const uk = {
  validation: {
    requiredEmail: 'Введіть email',
    requiredPassword: 'Введіть пароль',
    requiredFirstName: "Введіть ім'я",
    requiredLastName: 'Введіть прізвище',
    minPassword: 'Мінімум 6 символів',
    requiredAmount: 'Введіть суму більше 0',
    requiredDate: 'Оберіть дату',
  },

  auth: {
    login: {
      emailLabel: 'Email',
      passwordLabel: 'Пароль',
      submit: 'Увійти',
      noAccount: 'Немає акаунту?',
      registerLink: 'Зареєструватися',
      errorFallback: 'Не вдалося увійти',
    },
    register: {
      firstNameLabel: "Ім'я",
      lastNameLabel: 'Прізвище',
      emailLabel: 'Email',
      passwordLabel: 'Пароль',
      passwordHint: 'Щонайменше 6 символів',
      submit: 'Зареєструватися',
      haveAccount: 'Вже є акаунт?',
      loginLink: 'Увійти',
      errorFallback: 'Не вдалося зареєструватися',
      confirmationSent:
        'Лист із підтвердженням надіслано на {email}. Перейдіть за посиланням у листі, щоб активувати акаунт.',
      backToLogin: 'До входу',
    },
  },

  layout: {
    menuAria: 'Меню',
    logoutAria: 'Вийти',
    navHome: 'Головна',
    navSettings: 'Налаштування',
    navMonthlyReport: 'Звіт за місяць',
    navGeneralReport: 'Загальний звіт',
    navEmployeeRates: 'Ставки співробітників',
  },

  home: {
    welcomeNamed: 'Ласкаво просимо, {name}!',
    welcomeGeneric: 'Ласкаво просимо!',
  },

  settings: {
    title: 'Налаштування профілю',
    changeAvatar: 'Змінити аватар',
    firstNameLabel: "Ім'я",
    lastNameLabel: 'Прізвище',
    submit: 'Зберегти',
    successMessage: 'Профіль оновлено',
    errorFallback: 'Не вдалося зберегти зміни',
  },

  reports: {
    monthly: {
      title: 'Звіт за місяць',
      monthLabel: 'Місяць',
      placeholder:
        "Розрахунок годин і зарплати за обраний місяць з'явиться після впровадження Етапу 9 (розрахунки зарплати та страхових внесків).",
    },
    general: {
      title: 'Загальний звіт',
      placeholder:
        "Зведений звіт по всіх співробітниках (за місяць і за рік) з'явиться після впровадження Етапу 9. Ця сторінка доступна лише адміністраторам.",
    },
  },

  admin: {
    rates: {
      title: 'Ставки співробітників',
      employeeLabel: 'Співробітник',
      rateLabel: 'Ставка, грн/год',
      effectiveFromLabel: 'Діє з',
      submit: 'Зберегти ставку',
      historyTitle: 'Історія ставок',
      perHourSuffix: 'грн/год',
      columnEffectiveFrom: 'Діє з',
      columnRate: 'Ставка',
      successMessage: 'Ставку збережено',
      errorFallback: 'Не вдалося зберегти ставку',
    },
  },

  errors: {
    notFound: {
      title: 'Сторінку не знайдено',
      backHome: 'На головну',
    },
  },

  months: [
    'Січень',
    'Лютий',
    'Березень',
    'Квітень',
    'Травень',
    'Червень',
    'Липень',
    'Серпень',
    'Вересень',
    'Жовтень',
    'Листопад',
    'Грудень',
  ],
};

export type MessageSchema = typeof uk;

export default uk;
