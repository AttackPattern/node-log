module.exports = wallaby => {
  return {
    files: [
      'src/**/*.js',
    ],

    tests: [
      'test/**/*.js'
    ],
    env: {
      type: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },
    bootstrap: () => {
      require('babel-polyfill');
    }
  };
};
