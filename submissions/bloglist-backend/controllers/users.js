const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1})
    response.json(users)

})

usersRouter.post('/', async (request, response) => {
    const body = request.body

    if (!body.password || body.password.isUndefined || body.password === null) {
        return response.status(400).json({ error: 'password missing; please provide a password with the request' })
    } else if (body.password.length < 3) {
        return response.status(400).json({ error: 'password must be at least 3 characters long' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
        username: body.username,
        name: body.name,
        //password sent in the request is not stored in the database. We store the hash of the password that is generated with the bcrypt.hash function.
        passwordHash
    })

    const savedUser = await user.save()
    response.json(savedUser)
})

module.exports = usersRouter
