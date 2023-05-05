module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/'],
    transformIgnorePatterns: ['/node_modules/'],
    coverageReporters: ['html'],
    collectCoverage: true,
};
