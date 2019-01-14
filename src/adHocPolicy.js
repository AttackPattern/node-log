export default log => ({ policy = '', expiration = 10 } = {}) => {
  console.log('ad hoc policy time', policy)
  if (policy.includes('global')) {
    throw Error('Invalid attempt to update log policy (accessing global)');
  }
  if (expiration > 3600) {
    throw Error('Invalid attempt to update log policy (expiration too long)');
  }

  const callback = Function('entry', policy); // eslint-disable-line no-new-func
  const subscriptionExpiration = new Date();
  subscriptionExpiration.setSeconds(subscriptionExpiration.getSeconds() + expiration);

  log.note(`Enabling ad hoc log policy until ${subscriptionExpiration} (${expiration} seconds)`);
  log.note('~~~~~~~~~~~');
  log.note(policy);
  log.note('~~~~~~~~~~~');

  const subscription = log.subscribe(entry => {
    if (new Date() > subscriptionExpiration) {
      subscription.unsubscribe();
      log.note('Removed ad hoc log policy');
      return;
    }
    callback(entry);
  });
};
