import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import uuidV4 from 'uuid/v4';
chai.use(chaiAsPromised);

import Log from '../src/log';

function pause(ms) {
  const date = new Date();
  let curDate = null;
  do { curDate = new Date(); }
  while (curDate - date < ms);
}

describe('log', () => {
  it('should send noted message to subscriber', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    let msg = uuidV4();

    log.note(msg);
    expect(entry.message).to.equal(msg);
  });

  it('should log note with exception subject attaches to error member', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.note(new ReferenceError());
    expect(entry.error instanceof ReferenceError).to.be.true;
  });

  it('should attach to message member log note with string subject', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    let msg = uuidV4();

    log.note(msg);
    expect(entry.message).to.equal(msg);
  });

  it('should extend entry onlog note with object subject', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.note({ abc: 123, def: 456 });

    expect(entry.abc).to.equal(123);
    expect(entry.def).to.equal(456);
  });

  it('should write entry on log enter', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.enter();
    expect(entry.message).to.equal('entering activity');
  });

  it('should write exit on log exit', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (e.exiting) {
        entry = e;
      }
    });

    log.enter().exit();

    expect(entry.message).to.equal('exiting activity');
  });

  it('should have elapsed time on log exit', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (e.exiting) {
        entry = e;
      }
    });

    log.enter('elapsing', () => {
      pause(50);
    });

    expect(entry.elapsed()).to.be.greaterThan(49);
  });

  it('should write exception to entry on throw from log enter', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (e.error) {
        entry = e;
      }
    });

    try {
      log.enter('throwing', () => {
        throw new Error('Test Failure');
      });
    }
    catch (e) { }

    expect(entry.error.message).to.equal('Test Failure');
  });

  it('should have correct start time on log entry', () => {
    let entry,
      testStart = new Date();

    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });
    pause(10);
    log.note();

    expect(testStart.valueOf()).to.be.lessThan(entry.time.valueOf());
    expect(testStart.valueOf()).to.be.lessThan(new Date().valueOf());
  });

  it('should have extensions from activity on log entry', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.with({ abc: 123 }).note('test');
    expect(entry.abc).to.equal(123);
  });

  it('should have extensions from enter activity on log entry', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (!e.entering) {
        entry = e;
      }
    });

    const activity = log.with({ abc: 123 }).enter();

    activity.note('test');

    expect(entry.abc).to.equal(123);
  });

  it('should not continue with activity after exit', () => {

    const log = new Log();
    const activity = log.with({ abc: 123 }).enter();
    activity.exit();

    expect(() => {
      activity.note('test');
    }).to.throw();
  });

  it('should throw throw on exit method on unentered activity', () => {
    const log = new Log();
    const activity = log.with();

    expect(() => activity.exit()).to.throw;
  });

  it('should apply activity extensions to each entry from log enter', () => {

    const log = new Log();
    const activity = log.with({ abc: 123 }).enter();

    let entry = activity.note('test note');

    expect(entry.abc).to.equal(123);
  });

  it('should pass current activity into section on log enter', () => {
    let entry;

    const log = new Log();
    log.with({ abc: 123 }).enter('activity', a => {
      entry = a.note('in method');
    });

    expect(entry.abc).to.equal(123);
  });
});
