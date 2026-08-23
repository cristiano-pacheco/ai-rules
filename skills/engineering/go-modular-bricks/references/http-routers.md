# HTTP routers

## Responsibility

Place a module router in `http/chi/router/`.

The router owns paths, HTTP methods, route groups, and middleware scope. It
does not own application policy, validation, persistence, provider calls, or
response mapping.

## Structure

A router holds handler pointers, its constructor returns a pointer, and its
`Setup(server *chi.Server)` method gets the Chi router from `server.Router()`
before registering routes.

## HTTP contract

Use versioned paths below `/api/v1/`. Name resource path segments with plural
nouns. Use `{id}` for a resource identifier, nested resource paths for owned
sub-resources, and a verb suffix only for a non-CRUD state transition.

Use `GET` to retrieve a resource or collection, `POST` to create or trigger an
action, `PUT` for full replacement, `PATCH` for partial update, and `DELETE`
to remove a resource. Keep a bulk operation explicit in its path and method.

## Registration patterns

Register each handler method directly. A router may receive more than one
handler when it owns routes for closely related resources. Group routes when a
middleware applies only to that group, so the scope stays visible and does not
affect unrelated endpoints.

Register the concrete router from the owning module's Fx composition root as a
Bricks route contribution. The server discovers the route through its route
group rather than a manual registration outside the module.

## Naming

Name the type `<Resource>Router`, its constructor `New<Resource>Router`, and
its file `<resource>_router.go`. Use the matching `Handle...` method from the
handler when registering a route.
