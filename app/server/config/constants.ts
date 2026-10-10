export const API_PREFIX = '/api/v1';
export const DOCS_PATH = '/docs';
export const OPENAPI_PATH = '/openapi.json';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_RANKING_LIMIT = 10;
export const MAX_RANKING_LIMIT = 50;

export const PRODUCT_SORT_FIELDS = ['displayName', 'categoryEn', 'listPriceBrl', 'createdAt', 'updatedAt'] as const;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export const PRODUCT_SOURCES = ['olist_seed', 'app'] as const;
export const AUDIT_CHANNELS = ['ui', 'agent'] as const;

export const MIGRATIONS_FOLDER = 'server/database/migrations';
export const REQUEST_ID_HEADER = 'x-request-id';
export const USER_EMAIL_HEADER = 'x-forwarded-email';
