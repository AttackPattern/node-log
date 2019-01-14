import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';

chai.use(chaiAsPromised);
chai.use(sinonChai);

import uuidV4 from 'uuid/v4';

import Log from '../src/log';
import UseAdHocPolicy from '../src/adHocPolicy';

function pause(ms) {
  const date = new Date();
  let curDate = null;
  do { curDate = new Date(); }
  while (curDate - date < ms);
}

describe('ad hoc policy', () => {

  before(() => {
    sinon.spy(console, 'log');
  });

  after(() => {
    console.log.restore();
  })

  it('should use ad hoc policy', function () {
    const log = new Log();
    UseAdHocPolicy(log)({ policy: 'console.log(entry.message)' });
    let msg = uuidV4();
    log.note(msg);

    expect(console.log.calledWith(msg)).to.be.true;
  });

  it('should expire ad hoc policy', function () {
    const log = new Log();
    UseAdHocPolicy(log)({ policy: 'console.log(entry.message)', expiration: .02 });

    let msg = uuidV4();
    log.note(msg);
    expect(console.log.calledWith(msg)).to.be.true;

    pause(25);

    let msg2 = uuidV4();
    log.note(msg2);
    expect(console.log.calledWith(msg2)).to.be.false;
  });
});
