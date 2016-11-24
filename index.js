'use strict'

const extend = require('xtend')

module.exports = function middleware(paths) {
  paths = paths || []
  if (!Array.isArray(paths)) {
    paths = [paths]
  }
  if (!paths.length) {
    throw new Error('no paths')
  }

  const defaultSpec = {
    docs: {},
    propagateDelete(doc, dispatch) {
      dispatch(this.actions.remove(doc))
    },
    propagateUpdate(doc, dispatch) {
      dispatch(this.actions.update(doc))
    },
    propagateInsert(doc, dispatch) {
      dispatch(this.actions.insert(doc))
    },
    actions: {
      remove: defaultAction('remove'),
      update: defaultAction('update'),
      insert: defaultAction('insert')
    }
  }

  paths = paths.map(path => {
    const spec = extend({}, defaultSpec, path)
    spec.actions = extend({}, defaultSpec.actions, spec.actions)
    spec.docs = {}
    if (!spec.db) {
      throw new Error('needs a db')
    }
    return spec
  })

  return options => {
    paths.forEach(path => listen(path, options.dispatch))
    return next => next
  }
}

function listen(path, dispatch) {
  const changes = path.db.changes({
    include_docs: true,
    live: true
  })

  changes.on('change', change => {
    onChange(change, path, dispatch)
  })
}

function onChange(change, path, dispatch) {
  const changeDoc = change.doc
  if (path.changeFilter && !path.changeFilter(changeDoc)) {
    return
  }

  if (changeDoc._deleted) {
    if (path.docs[changeDoc._id]) {
      delete path.docs[changeDoc._id]
      path.propagateDelete(changeDoc, dispatch)
    }
  } else {
    const oldDoc = path.docs[changeDoc._id]
    path.docs[changeDoc._id] = changeDoc
    if (oldDoc) {
      path.propagateUpdate(changeDoc, dispatch)
    } else {
      path.propagateInsert(changeDoc, dispatch)
    }
  }
}

function defaultAction(action) {
  return () => {
    throw new Error('no action provided for ' + action)
  }
}
