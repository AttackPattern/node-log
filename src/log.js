const appStart = new Date();

export default class Log {
  bus = new Bus();

  with(extension) {
    return new LogActivity(this.bus).with(extension);
  }
  note(subject) {
    return new LogActivity(this.bus).note(subject);
  }
  enter(name, section) {
    return new LogActivity(this.bus).enter(name, section);
  }
  subscribe(subscription) {
    return this.bus.subscribe(subscription);
  }
}

class LogActivity {
  extensions = {}
  entries = []

  constructor(publisher) {
    this.publisher = publisher;
  }

  exit(error) {
    if (this.complete) {
      throw new Error('Exiting an unentered activity');
    }
    this.complete = true;
    const start = this.entries[0];
    const entry = new LogEntry(error || 'exiting activity', start.method);
    entry.entries = this.entries;
    entry.startTime = start.time;
    entry.exiting = true;
    entry.stopTime = new Date();

    this.publish(entry);
  }

  note(subject) {
    if (this.complete) {
      throw new Error('Note called on a completed activity');
    }
    const note = new LogEntry(subject);
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

  enter(name = '', section) {
    this.name = name;
    const entry = new LogEntry(`entering activity ${this.name}`.trim());
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

  publish(entry) {
    let publishEntry = {
      ...entry.copy(),
      ...this.extensions
    };
    this.entries.push(publishEntry);
    this.publisher.publish(publishEntry);
    return entry;
  }
}


class LogEntry {
  constructor(subject) {
    this.time = new Date();
    this.addNote(subject);
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

  stack = () => {
    return stack({ e: this.error });
  }

  copy = () => ({
    ...new LogEntry(null),
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
