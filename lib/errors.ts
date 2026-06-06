export type ErrorCode =
  | "URL_REQUIRED"
  | "INVALID_URL"
  | "INVALID_JSON"
  | "UNKNOWN_ACTION"
  | "ARTICLE_FETCH_FAILED"
  | "ARTICLE_PARSE_FAILED"
  | "AI_CONFIG_MISSING"
  | "AI_REQUEST_FAILED"
  | "AI_TIMEOUT"
  | "AI_EMPTY_RESPONSE"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export const ERROR_MESSAGES: Record<ErrorCode, { title: string; description: string }> = {
  URL_REQUIRED: {
    title: "Не указан адрес статьи",
    description: "Введите URL англоязычной статьи в поле выше.",
  },
  INVALID_URL: {
    title: "Некорректная ссылка",
    description: "Проверьте адрес — он должен начинаться с https:// и вести на статью.",
  },
  INVALID_JSON: {
    title: "Ошибка запроса",
    description: "Не удалось обработать запрос. Обновите страницу и попробуйте снова.",
  },
  UNKNOWN_ACTION: {
    title: "Неизвестное действие",
    description: "Выберите одну из доступных кнопок и повторите попытку.",
  },
  ARTICLE_FETCH_FAILED: {
    title: "Не удалось загрузить статью",
    description: "Не удалось загрузить статью по этой ссылке.",
  },
  ARTICLE_PARSE_FAILED: {
    title: "Не удалось прочитать статью",
    description:
      "Страница загрузилась, но текст статьи не найден. Попробуйте другую ссылку.",
  },
  AI_CONFIG_MISSING: {
    title: "AI временно недоступен",
    description:
      "Сервис не настроен. Обратитесь к администратору или попробуйте позже.",
  },
  AI_REQUEST_FAILED: {
    title: "Ошибка генерации",
    description:
      "Не удалось получить ответ от AI. Подождите немного и попробуйте снова.",
  },
  AI_TIMEOUT: {
    title: "Превышено время ожидания",
    description:
      "AI не успел ответить вовремя. Попробуйте ещё раз — для бесплатной модели это может занять до минуты.",
  },
  AI_EMPTY_RESPONSE: {
    title: "Пустой ответ",
    description: "AI вернул пустой результат. Попробуйте повторить запрос.",
  },
  NETWORK_ERROR: {
    title: "Проблема с сетью",
    description: "Проверьте подключение к интернету и попробуйте снова.",
  },
  UNKNOWN: {
    title: "Что-то пошло не так",
    description: "Произошла непредвиденная ошибка. Попробуйте позже.",
  },
};

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = "AppError";
    this.code = code;
  }
}

export function getErrorMessage(code: ErrorCode) {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}

export function getHttpStatus(code: ErrorCode): number {
  switch (code) {
    case "URL_REQUIRED":
    case "INVALID_URL":
    case "INVALID_JSON":
    case "UNKNOWN_ACTION":
      return 400;
    case "ARTICLE_PARSE_FAILED":
      return 422;
    case "AI_CONFIG_MISSING":
      return 503;
    case "AI_TIMEOUT":
      return 504;
    default:
      return 500;
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && value in ERROR_MESSAGES;
}
