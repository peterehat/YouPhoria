module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      collectCoverageFrom: [
        'backend/src/**/*.{ts,js}',
        '!backend/src/**/*.d.ts',
        '!backend/src/**/*.test.{ts,js}',
        '!backend/src/index.ts'
      ],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/backend/src/$1'
      }
    },
    {
      displayName: 'website',
      testMatch: ['<rootDir>/website/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/website/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      collectCoverageFrom: [
        'website/src/**/*.{js,jsx,ts,tsx}',
        '!website/src/**/*.d.ts',
        '!website/src/**/*.test.{js,jsx,ts,tsx}',
        '!website/src/main.{js,jsx,ts,tsx}'
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
          jsc: {
            transform: {
              react: {
                runtime: 'automatic'
              }
            }
          }
        }]
      }
    },
    {
      displayName: 'admin',
      testMatch: ['<rootDir>/admin/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/admin/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      collectCoverageFrom: [
        'admin/src/**/*.{js,jsx,ts,tsx}',
        '!admin/src/**/*.d.ts',
        '!admin/src/**/*.test.{js,jsx,ts,tsx}',
        '!admin/src/main.{js,jsx,ts,tsx}'
      ],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
          jsc: {
            transform: {
              react: {
                runtime: 'automatic'
              }
            }
          }
        }]
      }
    }
  ],
  collectCoverageFrom: [
    'backend/src/**/*.{ts,js}',
    'website/src/**/*.{js,jsx,ts,tsx}',
    'admin/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000
};
