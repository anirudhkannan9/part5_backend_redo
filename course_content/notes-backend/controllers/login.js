const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
    const body = request.body

    const user = await User.findOne({ username: body.username })

    if (!user) {
        return response.status(401).json({
            error: 'invalid username'
        })
    }

    //checks the password, also attached to the request
    const passwordCorrect = user === null
        ? false
        //Because the passwords themselves are not saved to the database, but hashes calculated from the passwords, the bcrypt.compare method is used to check if the password is correct:
        : await bcrypt.compare(body.password, user.passwordHash)

    if (!passwordCorrect) {
        return response.status(401).json({
            error: 'invalid password'
        })
    }

    const userForToken = {
        username: user.username,
        id: user._id

    }



    //token is created with the method jwt.sign. The token contains the username and the user id in a digitally signed form.
    // token expires in 60*60 seconds, that is, in one hour
    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60*60 })

    response
        .status(200)
        .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter