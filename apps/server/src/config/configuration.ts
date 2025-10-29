export type Configuration = {
  port: number;
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  openapi: {
    title: string;
    description: string;
    version: string;
    enabled: boolean;
  };
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
};

export type DatabaseConfiguration = Configuration['database'];
export type CorsConfiguration = Configuration['cors'];
export type OpenapiConfiguration = Configuration['openapi'];

export default () =>
  ({
    port: parseInt(process.env.PORT!, 10) || 4000,
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || [],
      credentials: Boolean(process.env.CORS_CREDENTIALS),
      methods: process.env.CORS_METHODS?.split(',') || [],
      allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [],
    },
    openapi: {
      title: process.env.OPENAPI_TITLE!,
      description: process.env.OPENAPI_DESCRIPTION!,
      version: process.env.OPENAPI_VERSION!,
      enabled: Boolean(process.env.OPENAPI_ENABLED),
    },
    database: {
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT!, 10) || 5432,
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      database: process.env.DATABASE_NAME!,
    },
  }) satisfies Configuration;
