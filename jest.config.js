module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/config/seed.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 10000
};