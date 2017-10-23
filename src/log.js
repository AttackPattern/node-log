const appStart = new Date();

export default class Log {
  bus = new Bus();

  with(extension) {
    return new LogActivity(this.bus).with(extension);
  }
  note(subject) {
    return new LogActivity(this.bus).note(subject, this.note.caller);
  }
  enter(section) {
    return new LogActivity(this.bus).enter(section, this.enter.caller);
  }
  subscribe(subscription) {
    return this.bus.subscribe(subscription);
  }
}

class LogActivity {
  extensions = {}
  entries = []
  active = true

  constructor(publisher) {
    this.publisher = publisher;
  }

  publish(entry) {
    var publishEntry = {
      ...entry.copy(),
      ...this.extensions
    };
    this.entries.push(publishEntry);
    this.publisher.publish(publishEntry);
    return entry;
  }

  exit(error) {
    this.active = false;
    const start = this.entries[0];
    const entry = new LogEntry(error || 'exiting activity', start.method);
    entry.entries = this.entries;
    entry.startTime = start.time;
    entry.exiting = true;
    entry.stopTime = new Date();

    this.publish(entry);
  }

  note(subject, caller) {
    if (!this.active) {
      throw new Error('Note called on a completed activity');
    }
    const note = new LogEntry(subject, caller); // TODO (brett) - get these arguments: || this.note.caller);
    return this.publish({
      ...note,
      ...this.extensions
    });
  }

  with(extension) {
    if (extension) {
      this.extensions = {
        ...this.extensions,
        ...extension
      };
    }
    return this;
  }

  enter(section, caller) {
    var entry = new LogEntry('entering activity', caller || arguments.caller);
    entry.entering = true;
    this.publish(entry);

    if (!section) {
      this.enter = undefined;
      return this;
    }

    try {
      section(this);
      this.exit();
    }
    catch (e) {
      this.exit(e);
      throw e;
    }
    return null;
  }
}


class LogEntry {
  constructor(subject, caller = { name: 'anonymous' }) {
    this.method = caller.name;
    this.time = new Date();

    this.addNote(subject);
    this.addArguments(caller);
  }

  addNote = note => {
    if (!note) {
      return;
    }
    if (typeof note === 'string') {
      this.message = note;
    }
    else if (note instanceof Error) {
      this.error = note;
    }
    else {
      Object.assign(this, note);
    }
  }

  addArguments = caller => {
    try {
      if (caller.arguments) {
        // TODO (brett) - Why all the ceremony?
        const args = Array.prototype.slice.call(caller.arguments);
        JSON.stringify(args); // assure arguments are not cyclic
        this.arguments = args;
      }
    }
    catch (e) {
      this.arguments = 'Cyclic arguments';
    }
  }

  stack = () => {
    return stack({ e: this.error });
  }

  copy = () => ({
    ...new LogEntry(null, this.method),
    ...this,
    clone: true
  })
  appStart = () => appStart
  appElapsed = () => this.time - appStart
  elapsed = () => Math.max(0, this.time - this.startTime)
}

class Bus {
  subscriptions = []
  subscribe(callback) {
    return this.when().subscribe(callback);
  }
  when(condition) {
    return {
      subscribe: callback => {
        function sub(payload) {
          if (!condition || condition(payload)) {
            callback(payload);
          }
        }
        this.subscriptions.push(sub);

        return {
          unsubscribe: () => {
            this.subscriptions = this.subscriptions.filter(next => next !== sub);
          }
        };
      }
    };
  }
  publish(subject) {
    this.subscriptions.forEach(sub => {
      try {
        sub(subject);
      }
      catch (e) {
        // Honey badger
      }
    });
  }
}
