const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'metrics/coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    'lib/utils/employee-helpers.ts',
    'lib/utils/pos-helpers.ts',
    'lib/utils/transaction-helpers.ts',
    'lib/utils/branch-helpers.ts',
    'lib/utils/receipt-helpers.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
