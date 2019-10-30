little-process-box
==================

> A little toolkit for running and managing child processes

<a name="installation"></a>
## Installation

```sh
$ npm install little-process-box
```

<a name="status"></a>
## Status

> **Development/Testing/Documentation**

> [![Actions Status](https://github.com/little-core-labs/little-process-box/workflows/Node%20CI/badge.svg)](https://github.com/little-core-labs/little-process-box/actions)

<a name="usage"></a>
## Usage

```js
const { Supervisor } = require('little-process-box')

const supervisor = new Supervisor()
const pool = supervisor.pool()

supervisor.service('http-server', {
  pool,
  exec: 'node',
  args: ['server.js'],
  env: { PORT: 3000 }
})

supervisor.service('discovery', {
  pool,
  exec: 'node',
  args: ['discovery.js'],
  env: { PORT: 9000 },
})

supervisor.start((err) => {
  // http + discovery should both started
  supervisor.stat({name: 'http-server'}, (err, stats) => {
    console.log(stats)
  })

  supervisor.stat({name: 'discovery'}, (err, stats) => {
    console.log(stats)
  })

  supervisor.stop() // stops all services
})
```

## API

<a name="process-pool"></a>
### `const pool = new ProcessPool([Factory])`

The `ProcessPool` class represents a container of running processes
managed by the instance. This class extends the `Pool` class from the
[nanoresource-pool][nanoresource-pool] module. You can override the
[default factory](#process]) by supplying your own `Factory` that should
implement the [nanoresource][nanoresource]

#### `pool.spawn(command[, args[, opts]])`

Creates and spawns a command in a new [process][nanoprocess] managed
by the pool.

#### `pool.stat([where], callback)`

Collects the [stats][nanoprocess#stats] of all running process
calling `callback(err, stats)` upon success or error. The
`where` object can be used to filter the results that get queried
for stats.

#### `pool.launch(pathspec[, opts])`

Launches a program by way of an input `pathspec` that may be an
application URL, path to an application directory, or something
suitable for the operating system to [launch][open] ("open").

<a name="supervisor"></a>
### `const supervisor = new Supervisor()`

The `Supervisor` class represents a higher level container for
`ProcessPool` instances in which it provides abilities to manage processes
as services with consolidated logging, mutex locks, graceful shutdowns, and
connected message channels.

#### `supervisor.pools`

A list of all pools.

#### `supervisor.pool(opts)`

Creates a new [`SupervisorProcessPool`](#supervisor-process-pool) instance.

#### `supervisor.service(name, opts)`

Creates a named service with options from a new or
given pool (`opts.pool`).

#### `supervisor.stat([where], callback)`

Queries all services in all process pools based on an optional
`where` filter calling `callback(err, results)` upon success or
error.

#### `supervisor.start([callback])`

Starts all services in all pools calling `callback(err)` upon success
or error.

#### `supervisor.stop([callback])`

Stops all services in all pools calling `callback(err)` upon success
or error.

#### `supervisor.restart([callback])`

Restarts all services in all pools calling `callback(err)` upon success
or error.

<a name="supervisor-process-pool"></a>
### `const pool = new SupervisorProcessPool([opts])`

The `SupervisorProcessPool` class represents an extended
[`ProcessPool`](#process-pool) that creates `Service` instances
as the process resource.

<a name="service"></a>
### `const service = new Service(options)`

The `Service` class represents a named process that can be started,
restarted, and stopped. The `Service` class inherits all properties from
the [`Process`](#process) class.

#### `service.env`

Environment object for the service.

#### `service.pool`

The [pool](#supervisor-process-pool) that created this service.

#### `service.type`

The service type. This can be anything.

#### `service.exec`

The command used to execute the service.

#### `service.args`

The command arguments used to execute the service.

#### `service.description`

A description of the service.

#### `service.stdin`

A `Writable` stream for the service's `stdin`.

#### `service.stdout`

A `Readable` stream for the service's `stdout`.

#### `service.stderr`

A `Readable` stream for the service's `stderr`.

#### `service.started`

`true` if the service has successfully started.

#### `service.starting`

`true` if the service is in the middle of starting.

#### `service.start([callback])`

Starts the services calling `callback(err)` upon success or error.

#### `service.stop([callback])`

Stops the services calling `callback(err)` upon success
or error. This function will reset the `nanoresource`
state (opened, opening, closed, closing, actives) to their
initial values.

#### `service.restart([callback])`

Restarts the services calling `callback(err)` upon success
or error. This function will call `service.stop(callback)`

#### `service.stat([callback])`

Same as [`Process#stat()`][nanoprocess#stat].

<a name="process"></a>
### `const proc = new Process(command[, args[, opts]])`

The [`Process`][nanoprocess#process] class exported from
[nanoprocess][nanoresource].

## License

MIT

## See Also

- [open][open]
- [nanoprocess][nanoprocess]
- [nanoresource][nanoresource]
- [nanoresource-pool][nanoresource-pool]


[open]: https://github.com/sindresorhus/open
[nanoprocess]: https://github.com/little-core-labs/nanoprocess
[nanoprocess#stats]: https://github.com/little-core-labs/nanoprocess#childstatcallback
[nanoprocess#process]: https://github.com/little-core-labs/nanoprocess#child-process
[nanoresource]: https://github.com/mafintosh/nanoresource
[nanoresource-pool]: https://github.com/little-core-labs/nanoresource-pool
