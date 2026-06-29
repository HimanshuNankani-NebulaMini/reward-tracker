module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.cjs',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.cjs'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
