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
  it('should subscriber recieves noted message', () => {
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

  it('should log note with string subject attaches to message member', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    let msg = uuidV4();

    log.note(msg);
    expect(entry.message).to.equal(msg);
  });

  it('should log note with object subject extends entry', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.note({ abc: 123, def: 456 });

    expect(entry.abc).to.equal(123);
    expect(entry.def).to.equal(456);
  });

  it('should log enter writes entry', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.enter();
    expect(entry.message).to.equal('entering activity');
  });

  it('should log exit writes exit', () => {
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

  it('should log exit has elapsed time', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (e.exiting) {
        entry = e;
      }
    });

    log.enter(() => {
      pause(50);
    });

    expect(entry.elapsed()).to.be.greaterThan(49);
  });

  it('should log enter writes exception to entry on throw', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      if (e.error) {
        entry = e;
      }
    });

    try {
      log.enter(() => {
        throw new Error('Test Failure');
      });
    }
    catch (e) { }

    expect(entry.error.message).to.equal('Test Failure');
  });

  it('should log note has correct calling method name and arguments', () => {
    let entry;

    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    function testCall(value) {
      log.note('test');
    }

    testCall('testValue');

    expect(entry.method).to.equal('testCall');
    expect(entry.arguments[0]).to.equal('testValue');
  });

  it('should log enter has correct caller name and arguments', () => {
    let entry;

    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    function testCall(value1) {
      log.enter();
    }

    testCall('testValue');

    expect(entry.method).to.equal('testCall');
    expect(entry.arguments[0]).to.equal('testValue');
  });

  it('should log entry has correct start time', () => {
    let entry,
      testStart = new Date();

    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.note();

    expect(testStart).to.be.lessThan(entry.time);
    expect(testStart).to.be.greaterThan(new Date());
  });

  it('should log entry has extensions from activity', () => {
    let entry;
    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    log.with({ abc: 123 }).note('test');

    expect(entry.abc).to.equal(123);
  });

  it('should log entry has extensions from enter activity', () => {
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

  it('should log entry does not throw on cyclic arguments', () => {
    let entry;

    const log = new Log();
    log.subscribe(function (e) {
      entry = e;
    });

    function testCall(value) {
      log.note('test');
    }

    const cyclic = {};
    cyclic.cycle = cyclic;
    testCall(cyclic);
    expect(entry.arguments).to.equal('Cyclic arguments');
  });

  it('should log entry copy returns complete clone', () => {
    const log = new Log();
    let clone;

    log.subscribe(function (e) {
      clone = e.copy();
    });
    log.with({ test: 'test extension' }).note('test hello');

    expect(clone.message).to.equal('test hello');
    expect(clone.test).to.equal('test extension');
  });

  it('should can not continue with activity after exit', () => {

    const log = new Log();
    const activity = log.with({ abc: 123 }).enter();
    activity.exit();

    expect(() => {
      activity.note('test');
    }).to.throw();
  });

  it('should entered activity has no enter method', () => {
    const log = new Log();
    const activity = log.enter();

    expect(activity.enter).to.be.null;
  });

  it('should unentered activity has no exit method', () => {
    const log = new Log();
    const activity = log.with();

    expect(activity.exit).to.be.null;
  });

  it('should log enter applies activity extensions to each entry', () => {

    const log = new Log();
    const activity = log.with({ abc: 123 }).enter();

    let entry = activity.note('test note');

    expect(entry.abc).to.equal(123);
  });

  it('should log enter passes current activity into section', () => {
    let entry;

    const log = new Log();
    log.with({ abc: 123 }).enter(function (a) {
      entry = a.note('in method');
    });

    expect(entry.abc).to.equal(123);
  });
});
