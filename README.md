# redux-pouch-pull

[![Greenkeeper badge](https://badges.greenkeeper.io/Qard/redux-pouch-pull.svg)](https://greenkeeper.io/)

This is a rewrite of [pouch-redux-middleware](https://github.com/pgte/pouch-redux-middleware)
to only support one-way pull syncing.

## Install

```
$ npm install redux-pouch-pull --save
```

## Use

Example of configuring a store:

```js
import * as types from '../constants/ActionTypes'
import ReduxPouchPull from 'redux-pouch-pull'
import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
import PouchDB from 'pouchdb'

export default function configureStore() {
  const db = new PouchDB('todos')

  const middleware = ReduxPouchPull({
    db,
    actions: {
      remove: doc => { return { type: types.DELETE_TODO, id: doc._id } },
      insert: doc => { return { type: types.INSERT_TODO, todo: doc } },
      update: doc => { return { type: types.UPDATE_TODO, todo: doc } },
    }
  })

  const store = createStore(
    rootReducer,
    undefined,
    applyMiddleware(middleware)
  )

  return store
}
```

## API

### PouchMiddleware(paths)

* `paths`: path or array containing path specs

A path spec is an object describing the behaviour of a sub-tree of the state it has the following attributes:

* `db`: a PouchDB database
* `actions`: an object describing the actions to perform when a change in the Po. It's an object containing a function that returns an action for each of the events (`remove`, `insert` and `update`)
* `changeFilter`: a function that receives a changed document, and if it returns
false, the document will be ignored for the path. This is useful when you have
multiple paths in a single database that are differentiated through an attribute
(like `type`).

Example of a path spec:

```js
{
  db,
  actions: {
    remove: doc => { return { type: types.DELETE_TODO, id: doc._id } },
    insert: doc => { return { type: types.INSERT_TODO, todo: doc } },
    update: doc => { return { type: types.UPDATE_TODO, todo: doc } },
  }
}
```

## License

ISC
