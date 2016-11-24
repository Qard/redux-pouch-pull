'use strict'

const redux = require('redux')
const PouchDB = require('pouchdb')
const db = new PouchDB('todos', {
  db: require('memdown')
})

// Actions
const ERROR = 'ERROR'
const ADD_TODO = 'ADD_TODO'
const INSERT_TODO = 'INSERT_TODO'
const DELETE_TODO = 'DELETE_TODO'
const EDIT_TODO = 'EDIT_TODO'
const UPDATE_TODO = 'UPDATE_TODO'
const COMPLETE_TODO = 'COMPLETE_TODO'
const COMPLETE_ALL = 'COMPLETE_ALL'
const CLEAR_COMPLETED = 'CLEAR_COMPLETED'

// Reducer
const todos = function todos(state, action) {
  state = state || []
  switch (action.type) {
    case ADD_TODO:
      return [
        {
          _id: action.id || id(),
          completed: false,
          text: action.text
        }
      ].concat(state)

    case INSERT_TODO:
      return [ action.todo ].concat(state)

    case DELETE_TODO:
      return state.filter(todo => todo._id !== action.id)

    case EDIT_TODO:
      return state.map(todo =>
        todo._id === action.id ?
          Object.assign({}, todo, { text: action.text }) :
          todo
      )

    case UPDATE_TODO:
      return state.map(todo =>
        todo._id === action.todo._id ?
          action.todo :
          todo
      )

    case COMPLETE_TODO:
      return state.map(todo =>
        todo._id === action.id ?
          Object.assign({}, todo, { completed: !todo.completed }) :
          todo
      )

    case COMPLETE_ALL:
      const areAllMarked = state.every(todo => todo.completed)
      return state.map(todo => Object.assign({}, todo, {
        completed: !areAllMarked
      }))

    case CLEAR_COMPLETED:
      return state.filter(todo => todo.completed === false)

    default:
      return state
  }
}
const rootReducer = redux.combineReducers({ todos })
function id() {
  return Math.random().toString(36).substring(7)
}

// Tests
const PouchMiddleware = require('../')

let pouchMiddleware
let store

test('can be created', done => {
  pouchMiddleware = PouchMiddleware({
    path: '/todos',
    db: db,
    actions: {
      remove(doc) {
        return {
          type: DELETE_TODO,
          id: doc._id
        }
      },
      insert(doc) {
        return {
          type: INSERT_TODO,
          todo: doc
        }
      },
      update(doc) {
        return {
          type: UPDATE_TODO,
          todo: doc
        }
      }
    },
    changeFilter: doc => !doc.filter
  })
  done()
})

test('can be used to create a store', done => {
  var createStoreWithMiddleware = redux.applyMiddleware(pouchMiddleware)(redux.createStore)
  store = createStoreWithMiddleware(rootReducer)
  done()
})

test('making insert in pouchdb...', done => {
  db.post({
    _id: 'a',
    text: 'pay bills',
  }, done)
})

test('waiting a bit', done => {
  setTimeout(done, 100)
})

test('...propagates update from pouchdb', done => {
  const matches = store.getState()
    .todos.filter(doc => doc._id == 'a')

  expect(matches[0].text).toEqual('pay bills')
  done()
})

test('...inserts filtered document', done => {
  db.post({
    _id: 'b',
    filter: true,
  }).then(() => done()).catch(done)
})

test('waiting a bit', done => {
  setTimeout(done, 100)
})

test('...filters documents', done => {
  const matches = store.getState()
    .todos.filter(doc => doc._id == 'b')

  expect(matches.length).toEqual(0)
  done()
})

test('making changes in pouchdb...', done => {
  db.get('a', (err, doc) => {
    expect(err).toBeNull()
    doc.text = 'wash some of the dishes'
    db.put(doc, done)
  })
})

test('waiting a bit', done => {
  setTimeout(done, 100)
})

test('...propagates update from pouchdb', done => {
  const matches = store.getState()
    .todos.filter(doc => doc._id == 'a')

  expect(matches[0].text).toEqual('wash some of the dishes')
  done()
})

test('making removal in pouchdb...', done => {
  db.get('a', (err, doc) => {
    expect(err).toBeNull()
    db.remove(doc, done)
  })
})

test('waiting a bit', done => {
  setTimeout(done, 100)
})

test('...propagates update from pouchdb', done => {
  const matches = store.getState()
    .todos.filter(doc => doc._id == 'a')

  expect(matches.length).toEqual(0)
  done()
})
