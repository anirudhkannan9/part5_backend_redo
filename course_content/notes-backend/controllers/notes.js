//event handlers related to routes ('controllers') moved into this dedicated module. This file contains all routes related to notes.

//creating a router object; a middleware used to define 'related routes' in a single place (module), that can be exported & used by other modules
const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

notesRouter.get('/', async (request, response) => {
    const notes = await Note.find({}).populate('user', { username: 1, name: 1 })
    response.json(notes)
})

//isolates the token from the authorization header
const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }

    return null
}

notesRouter.post('/', async (request, response) => {
    const body = request.body
    const token = getTokenFrom(request)
    //check validity of token; decodes token (returns Object that token was based on)
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!token) {
        return response.status(401).json({ error: 'token missing' })
    } else if (!decodedToken.id) {
        return response.status(401).json({ error: 'token invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const note = new Note({
        content: body.content,
        important: body.important === undefined ? false : body.important,
        date: new Date(),
        user: user._id
    })

    const savedNote = await note.save()
    user.notes = user.notes.concat(savedNote._id)
    await user.save()
    response.json(savedNote.toJSON())
})


notesRouter.get('/:id', async (request, response) => {
    const note = await Note.findById(request.params.id)
    if (note) {
        response.json(note.toJSON())
    } else {
        response.status(404).end()
    } 
})

notesRouter.delete('/:id', async (request, response) => {
    await Note.findByIdAndRemove(request.params.id)
    response.status(204).end()
})

notesRouter.put('/:id', (request, response, next) => {
    const body = request.body

    const note = {
        content: body.content, 
        important: body.important
    }

    Note
        .findByIdAndUpdate(request.params.id, note, { new: true })
        .then(updatedNote => {
            response.json(updatedNote)
        })
        .catch(error => next(error))

})

module.exports = notesRouter