import type { Config } from 'jest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read tsconfig.json for path mapping
const clientTsConfig = JSON.parse(
  readFileSync(join(__dirname, 'apps/client/tsconfig.json'), 'utf-8'),
);

// Simple path mapper helper
const mapPaths = (paths: Record<string, string[]>, prefix: string) => {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(paths)) {
    const alias = key.replace('/*', '/(.*)');
    const path = value[0].replace('/*', '/$1');
    mapped[alias] = `${prefix}${path}`;
  }
  return mapped;
};

const config: Config = {
  projects: [
    // Client project configuration
    {
      displayName: 'client',
      preset: 'ts-jest',
      testEnvironment: 'jest-environment-jsdom',
      rootDir: '<rootDir>/apps/client',
      testMatch: ['**/*.{test,spec}.{ts,tsx}'],
      moduleNameMapper: {
        ...mapPaths(clientTsConfig.compilerOptions.paths || {}, '<rootDir>/'),
        '^@/(.*)$': '<rootDir>/$1',
        // Handle CSS modules - return class names as-is (must come before general CSS pattern)
        '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        // Handle regular CSS imports - return empty object
        '\\.(css|sass|scss)$': join(__dirname, 'jest-css-stub.js'),
        // Handle image imports
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
          join(__dirname, 'jest-file-stub.js'),
      },
      setupFilesAfterEnv: [join(__dirname, 'apps/client/jest.setup.cjs')],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react-jsx',
            },
          },
        ],
      },
      collectCoverageFrom: [
        '**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/*.stories.{ts,tsx}',
        '!**/__tests__/**',
        '!**/node_modules/**',
        '!.next/**',
      ],
      coverageDirectory: '<rootDir>/../../coverage/client',
    },
    // Server project configuration
    {
      displayName: 'server',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '<rootDir>/apps/server',
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: {
              module: 'nodenext',
              moduleResolution: 'nodenext',
            },
          },
        ],
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/**/*.spec.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.entity.ts',
        '!src/main.ts',
      ],
      coverageDirectory: '<rootDir>/../../coverage/server',
    },
  ],
  collectCoverage: false,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  verbose: true,
};

export default config;

