//Ideally, server's DB should be the same each time we run  tests, so our tests are reliably, easily repeatable.
//As with unit and integration tests, with E2E tests it is the best to empty the database and possibly format it before the tests are run. 
//The challenge with E2E tests is that they do not have access to the database.
//Solution: create API endpoints to the backend for the test. Can empty the DB with these endpoints

const router = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

//an HTTP POST request to the /api/testing/reset endpoint empties the database.
router.post('/reset', async (request, response) => {
    await Note.deleteMany({})
    await User.deleteMany({})

    response.status(204).end()
})

module.exports = router