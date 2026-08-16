import type { MessageSchema } from './uk';

export default {
  common: {
    currency: '€',
    search: 'Поиск',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    delete: 'Удалить',
    edit: 'Редактировать',
    save: 'Сохранить',
  },

  validation: {
    requiredEmail: 'Введите email',
    requiredPassword: 'Введите пароль',
    requiredFirstName: 'Введите имя',
    requiredLastName: 'Введите фамилию',
    minPassword: 'Минимум 6 символов',
    requiredAmount: 'Введите сумму больше 0',
    requiredDate: 'Выберите дату',
    requiredSiteName: 'Введите название объекта',
    requiredSite: 'Выберите объект',
    requiredTime: 'Укажите время',
    endAfterStart: 'Время окончания должно быть позже начала',
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
    languageAria: 'Язык',
    logoutAria: 'Выйти',
    navHome: 'Главная',
    navSettings: 'Настройки',
    navMonthlyReport: 'Отчёт за месяц',
    navGeneralReport: 'Общий отчёт',
    navEmployeeRates: 'Ставки сотрудников',
    navSites: 'Объекты',
  },

  home: {
    welcomeNamed: 'Добро пожаловать, {name}!',
    welcomeGeneric: 'Добро пожаловать!',
    totalHoursLabel: 'Часов за текущий месяц',
    daysApprox: '≈ {days} дн. (при 8-час дне)',
    expectedSalaryLabel: 'Ожидаемая зарплата за месяц',
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
      siteLabel: 'Объект',
      dateLabel: 'Дата',
      startTimeLabel: 'Начало',
      endTimeLabel: 'Конец',
      submit: 'Добавить запись',
      columnDate: 'Дата',
      columnWeekday: 'День недели',
      columnSite: 'Объект',
      columnTime: 'Время',
      columnHours: 'Часы',
      columnEarned: 'Сумма',
      columnActions: 'Действия',
      totalHours: 'Всего часов',
      totalEarned: 'Всего заработано',
      noReports: 'Нет записей за этот месяц',
      deleteConfirmTitle: 'Удалить запись?',
      deleteConfirmMessage: 'Это действие нельзя отменить.',
      successAdded: 'Запись добавлена',
      successUpdated: 'Запись обновлена',
      successDeleted: 'Запись удалена',
      errorFallback: 'Не удалось сохранить запись',
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
      rateLabel: 'Ставка, €/час',
      effectiveFromLabel: 'Действует с',
      submit: 'Сохранить ставку',
      historyTitle: 'История ставок',
      noRates: 'Нет ставок',
      perHourSuffix: '€/час',
      columnEffectiveFrom: 'Действует с',
      columnRate: 'Ставка',
      successMessage: 'Ставка сохранена',
      errorFallback: 'Не удалось сохранить ставку',
    },
    sites: {
      title: 'Объекты',
      nameLabel: 'Название объекта',
      add: 'Добавить',
      columnName: 'Название',
      columnActive: 'Активен',
      noSites: 'Нет объектов',
      errorFallback: 'Не удалось добавить объект',
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

  weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
} satisfies MessageSchema;
