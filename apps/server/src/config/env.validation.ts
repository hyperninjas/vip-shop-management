import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  validateSync,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  // Database
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  DATABASE_POOL_MAX?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  DATABASE_POOL_MIN?: number;

  // CORS
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsBoolean()
  CORS_CREDENTIALS?: boolean;

  @IsOptional()
  @IsString()
  CORS_METHODS?: string;

  @IsOptional()
  @IsString()
  CORS_ALLOWED_HEADERS?: string;

  // Auth
  @IsString()
  BETTER_AUTH_SECRET: string;

  @IsString()
  BETTER_AUTH_URL: string;

  // Stripe
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  // Google OAuth
  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  // OpenAPI
  @IsOptional()
  @IsString()
  OPENAPI_TITLE?: string;

  @IsOptional()
  @IsString()
  OPENAPI_DESCRIPTION?: string;

  @IsOptional()
  @IsString()
  OPENAPI_VERSION?: string;

  @IsOptional()
  @IsBoolean()
  OPENAPI_ENABLED?: boolean;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return validatedConfig;
}
