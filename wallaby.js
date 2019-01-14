module.exports = wallaby => {
  return {
    files: [
      'src/**/*.js',
    ],

    tests: [
      'tests/**/*.js'
    ],
    env: {
      type: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel({ babelrc: true })
    },
    setup: wallaby => {
      const chai = require('chai');
      chai.use(require('chai-as-promised'));
      chai.use(require('chai-datetime'));
    }
  };
};
