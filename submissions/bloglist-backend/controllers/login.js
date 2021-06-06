const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
    const body = request.body

    // searching for the user from the database by the username attached to the request
    const user = await User.findOne({ username: body.username })

    //if we can't find the user, we presume that the username isn't valid; send a corresponding error message. 
    //Code here diverges slightly from course material to facilitate more specific error messages. Logic still the same.
    if (user === null || user === undefined) {
        return response.status(401).json({ error: 'invalid username' })
    }

    //checks the password, also attached to the request. 
    //Because password hashes (not passwords) are saved to the DB, bcrypt.compare is used to check if password correct:
    const passwordCorrect = await bcrypt.compare(body.password, user.passwordHash)
    
    if (!passwordCorrect) {
        return response.status(401).json({ error: 'invalid password' })
    }

    const userForToken = {
        username: user.username,
        id: user._id
    }

    //token is created; contains username and user id in 'digitally signed form'
    //only people who know the environment variable named "SECRET" can generate valid tokens
    const token = jwt.sign(userForToken, process.env.SECRET)

    response
        .status(200)
        .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter
