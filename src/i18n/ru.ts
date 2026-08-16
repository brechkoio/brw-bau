import type { MessageSchema } from './uk';

export default {
  validation: {
    requiredEmail: 'Введите email',
    requiredPassword: 'Введите пароль',
    requiredFirstName: 'Введите имя',
    requiredLastName: 'Введите фамилию',
    minPassword: 'Минимум 6 символов',
    requiredAmount: 'Введите сумму больше 0',
    requiredDate: 'Выберите дату',
  },

  auth: {
    login: {
      emailLabel: 'Email',
      passwordLabel: 'Пароль',
      submit: 'Войти',
      noAccount: 'Нет аккаунта?',
      registerLink: 'Зарегистрироваться',
      errorFallback: 'Не удалось войти',
    },
    register: {
      firstNameLabel: 'Имя',
      lastNameLabel: 'Фамилия',
      emailLabel: 'Email',
      passwordLabel: 'Пароль',
      passwordHint: 'Не менее 6 символов',
      submit: 'Зарегистрироваться',
      haveAccount: 'Уже есть аккаунт?',
      loginLink: 'Войти',
      errorFallback: 'Не удалось зарегистрироваться',
      confirmationSent:
        'Письмо с подтверждением отправлено на {email}. Перейдите по ссылке в письме, чтобы активировать аккаунт.',
      backToLogin: 'Ко входу',
    },
  },

  layout: {
    menuAria: 'Меню',
    logoutAria: 'Выйти',
    navHome: 'Главная',
    navSettings: 'Настройки',
    navMonthlyReport: 'Отчёт за месяц',
    navGeneralReport: 'Общий отчёт',
    navEmployeeRates: 'Ставки сотрудников',
  },

  home: {
    welcomeNamed: 'Добро пожаловать, {name}!',
    welcomeGeneric: 'Добро пожаловать!',
  },

  settings: {
    title: 'Настройки профиля',
    changeAvatar: 'Изменить аватар',
    firstNameLabel: 'Имя',
    lastNameLabel: 'Фамилия',
    submit: 'Сохранить',
    successMessage: 'Профиль обновлён',
    errorFallback: 'Не удалось сохранить изменения',
  },

  reports: {
    monthly: {
      title: 'Отчёт за месяц',
      monthLabel: 'Месяц',
      placeholder:
        'Расчёт часов и зарплаты за выбранный месяц появится после внедрения Этапа 9 (расчёты зарплаты и страховых взносов).',
    },
    general: {
      title: 'Общий отчёт',
      placeholder:
        'Сводный отчёт по всем сотрудникам (за месяц и за год) появится после внедрения Этапа 9. Эта страница доступна только администраторам.',
    },
  },

  admin: {
    rates: {
      title: 'Ставки сотрудников',
      employeeLabel: 'Сотрудник',
      rateLabel: 'Ставка, грн/час',
      effectiveFromLabel: 'Действует с',
      submit: 'Сохранить ставку',
      historyTitle: 'История ставок',
      perHourSuffix: 'грн/час',
      columnEffectiveFrom: 'Действует с',
      columnRate: 'Ставка',
      successMessage: 'Ставка сохранена',
      errorFallback: 'Не удалось сохранить ставку',
    },
  },

  errors: {
    notFound: {
      title: 'Страница не найдена',
      backHome: 'На главную',
    },
  },

  months: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
} satisfies MessageSchema;
