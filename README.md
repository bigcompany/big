# Big

## v.0.5.0

## Installation

```bash
npm install big -g
```

## Starting Built-in Apps

```bash
big website
big load-balancer
big sink
big repl
```
## Debugging

To enable debugging in `big` you must set the environment variable `DEBUG`. There are two levels of debugging you'll want to inspect.

```bash
export DEBUG=big::*,resource::*
```
This will enable debugging messages for all `resources` and `big` itself.

## Discovery and Event Emitter Mesh

All big apps automatically create or join a new event emitter mesh when started. Each app is able to communicate to each other through the `big.mesh.emitter` Event Emitter API.

Default discovery settings use `localhost` for all apps. Custom `host` and `port` options can be passed into `big.start`

## Websocket gateway

If `big` is in server mode, a WebSocket gateway will be opened for incoming communication. This can be visited directly in the browser or connected to with the `mesh` resource.

Authorization examples are available [here](https://github.com/bigcompany/resource-mesh/tree/master/example/2_authorization)

# Apps built with `big`

## `website`

Minimal `express` based website application with built-in support for routes, sessions, static file-serving, etc.

Ideal for quickly serving up static content or quickly adding custom http route logic.

## `load-balancer`

Minimal `http-proxy` based HTTP load balancing for multiple websites. Will automatically add `website` apps to it's proxy table apps based on `domain`, `host`, and `port`.

Ideal for routing incoming HTTP traffic to many `websites`. The `website` app will register itself automatically with the `load-balancer.`

## `sink`

Event sink ( dump ) for `big.mesh.emitter`. The `sink` will capture any event emitted on the mesh network and write the event to STDOUT.

Ideal for aggregating all events on the mesh to standard output ( such as a log file ).

## `repl`

Simple interactive repl for communicating with the mesh network.

Ideal for debugging or communicating with nodes via `big.mesh.emitter`

## `voice-recognition`

Browser based Voice Recognition Gateway for communicating with the mesh network.

Ideal for triggering mesh events with voice commands.
