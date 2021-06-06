/* eslint-disable quotes */

const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const { request } = require('express')


beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})

describe('when there are some initial blogs saved', () => {
    test('blogs are returned as JSON', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/) 
    })

    test('correct amount of blogs (all blogs) returned', async () => {
        const response = await api.get('/api/blogs')
    
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    //specific blog is within returned blogs
    test('specific blog is within returned blogs', async () => {
        const response = await api.get('/api/blogs')
        const contents = response.body.map(r => r.title)
        expect(contents).toContain(
            'testBlog2'
        )

    })
})

describe('viewing a specific blog', () => {
    test('succeeds with a valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const blogToView = blogsAtStart[0]

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

        expect(resultBlog.body).toEqual(processedBlogToView)


    })

    // eslint-disable-next-line quotes
    test("fails w statuscode 404 if blog doesn't exist", async () => {
        const validNonExistingId = await helper.nonExistingId()

        await api
            .get(`/api/blogs/${validNonExistingId}`)
            .expect(404)
    })
})

describe('addition of a new blog', () => {
    test('posting works correctly', async () => {
        const blogObject = {
            title: 'new blog to test that posting works',
            author: 'Anirudh poster',
            url: 'www.testblogPOST.xyz',
            likes: 8
        }

        const loginObject = {
            "username": "kannana1",
            "password": "secret"
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send(loginObject)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        userAfterLogin = userAfterLogin.body
        const token = userAfterLogin.token

        let postResponse = await api
            .post('/api/blogs')
            .auth(token, { type: 'bearer' })
            .send(blogObject)
            .expect(response => console.log(response.body))
            .expect(200)
            .expect('Content-Type', /application\/json/)

        postResponse = postResponse.body
        expect(postResponse.title).toEqual('new blog to test that posting works')
        expect(postResponse.author).toEqual('Anirudh poster')
        expect(postResponse.url).toEqual('www.testblogPOST.xyz')
        expect(postResponse.likes).toEqual(8)
    
        let getResponse = await api.get('/api/blogs')
        getResponse = getResponse.body
        expect(getResponse.length).toEqual(helper.initialBlogs.length + 1) 
        const newBlog = getResponse[2]
        expect(newBlog.title).toEqual('new blog to test that posting works')
        expect(newBlog.author).toEqual('Anirudh poster')
        expect(newBlog.url).toEqual('www.testblogPOST.xyz')
        expect(newBlog.likes).toEqual(8)
    })

    test('fails w statuscode 400 if data invalid (missing url or title)', async () => {
        const blogObject1 = {
            title: 'new blog to test correct behaviour if no url',
            author: 'Anirudh poster no url',
            likes: 1
        }

        const loginObject = {
            "username": "kannana1",
            "password": "secret"
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send(loginObject)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        userAfterLogin = userAfterLogin.body
        console.log('USER: ', userAfterLogin)
        
        const token = userAfterLogin.token
        console.log(token)

    
        await api
            .post('/api/blogs')
            .auth(token, { type: 'bearer' })
            .send(blogObject1)
            .expect(400)
    
        const blogObject2 = {
            url: 'www.testblogpostNOTITLE.abc',
            author: 'Anirudh poster no title',
            likes: 2
        }

        await api
            .post('/api/blogs')
            .auth(token, { type: 'bearer' })
            .send(blogObject2)
            .expect(400)
    
        let getResponse = await api.get('/api/blogs')
        getResponse = getResponse.body
        expect(getResponse.length).toEqual(helper.initialBlogs.length)
    
    })

    test('id property of blog posts is defined as per toJSON method', async () => {
        const result = await api.get('/api/blogs')
    
        expect(result.body[0].id).toBeDefined()
        expect(result.body[1].id).toBeDefined()
    })

    test('succeeds w statuscode 200 if likes property missing and other data valid', async () => {
        const loginObject = {
            "username": "kannana1",
            "password": "secret"
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send(loginObject)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        userAfterLogin = userAfterLogin.body
        console.log('USER: ', userAfterLogin)
        
        const token = userAfterLogin.token
        console.log(token)

        const blogObject = {
            title: 'new blog to test correct behaviour if likes property missing',
            author: 'Anirudh poster no likes',
            url: 'www.testblogpostNOLIKES.zerolikes'
        }
    
        let postResponse = await api
            .post('/api/blogs')
            .auth(token, { type: 'bearer' })
            .send(blogObject)
            .expect(200).expect('Content-Type', /application\/json/)
        postResponse = postResponse.body
        expect(postResponse.title).toEqual('new blog to test correct behaviour if likes property missing')
        expect(postResponse.author).toEqual('Anirudh poster no likes')
        expect(postResponse.url).toEqual('www.testblogpostNOLIKES.zerolikes')
        expect(postResponse.likes).toEqual(0)
    })

    test('fails with statuscode 401 if token not provided', async () => {
        const blogObject = {
            title: 'new blog to test correct behaviour if likes property missing',
            author: 'Anirudh poster no likes',
            url: 'www.testblogpostNOLIKES.zerolikes'
        }
    
        let postResponse = await api
            .post('/api/blogs')
            .send(blogObject)
            .expect(401)

        let getResponse = await api.get('/api/blogs')
        getResponse = getResponse.body
        expect(getResponse.length).toEqual(helper.initialBlogs.length)


    })
    
})

describe('deletion of a blog', () => {
    test('succeeds w statuscode 204 if id valid and correct user', async () => {
        const blogsInDb = await helper.blogsInDb()

        let userAfterLogin = await api
            .post('/api/login')
            .send({
                "username": "root",
                "password": "sekret"
            })
            .expect(200)

        userAfterLogin = userAfterLogin.body
        console.log(userAfterLogin)
        const token = userAfterLogin.token
        
        const blogToDelete = blogsInDb[1]
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .auth(token, { type: 'bearer' })
            .expect(204)
        
        const blogsInDbAfterDelete = await helper.blogsInDb()
        expect(blogsInDbAfterDelete.length).toEqual(blogsInDb.length - 1)
        const blogTitlesAfterDelete = blogsInDbAfterDelete.map(b => b.title)
        expect(blogTitlesAfterDelete).toContain(blogsInDb[0].title)
        expect(blogTitlesAfterDelete).not.toContain(blogsInDb[1].title)
    })

    test('fails with 401 if a user tries to delete a blog they did not create', async () => {
        const blogsInDb = await helper.blogsInDb()
        console.log(blogsInDb)

        let userAfterLogin = await api
            .post('/api/login')
            .send({
                "username": "kannana1",
                "password": "secret"
            })
            .expect(200)

        userAfterLogin = userAfterLogin.body
        const token = userAfterLogin.token

        const blogToDelete = blogsInDb[1]
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .auth(token, { type: 'bearer' })
            .expect(401)

        const blogsInDbAfterDelete = await helper.blogsInDb()
        expect(blogsInDbAfterDelete.length).toEqual(blogsInDb.length)
        console.log(blogsInDbAfterDelete)
        const blogTitlesAfterDelete = blogsInDbAfterDelete.map(b => b.title)
        expect(blogTitlesAfterDelete).toContain(blogsInDb[0].title)
        expect(blogTitlesAfterDelete).toContain(blogsInDb[1].title)

    })
})

describe('updating a blog', () => {

    test('updating only likes of blog with valid id succeeds with statuscode 200', async () => {
        const oldBlogs = await helper.blogsInDb()

        //get object we're trying to update
        const oldBlog = oldBlogs[0]

        //create new object
        const newBlog = {
            title: oldBlog.title,
            author: oldBlog.author,
            url: oldBlog.url,
            likes: 7,
            user: '60bbd013bf4c35848f604f46'
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send({
                "username": "root",
                "password": "sekret"
            })
            .expect(200)

        userAfterLogin = userAfterLogin.body
        const token = userAfterLogin.token

        //send
        let updatedBlog = await api
            .put(`/api/blogs/${oldBlog.id}`)
            .auth(token, { type: 'bearer' })
            .send(newBlog)
            .expect(200)
        updatedBlog = updatedBlog.body

        //check same amount of blogs, same other properties, different likes property
        const newBlogs = await helper.blogsInDb()
        //console.log('OLD BLOGS: ', oldBlogs)
        console.log('\n\n\n UPDATED BLOG', updatedBlog)
        //console.log('\n\n\n NEW BLOGS', newBlogs)
        expect(newBlogs.length).toEqual(oldBlogs.length)
        expect(newBlogs[0].title).toEqual(oldBlog.title)
        expect(newBlogs[0].author).toEqual(oldBlog.author)
        expect(newBlogs[0].url).toEqual(oldBlog.url)
        expect(newBlogs[0].likes).toEqual(7)
        expect(updatedBlog.title).toEqual(oldBlog.title)
        expect(updatedBlog.author).toEqual(oldBlog.author)
        expect(updatedBlog.url).toEqual(oldBlog.url)
        expect(updatedBlog.likes).toEqual(7) 
    })

    test('updating with nonexistent id fails w statuscode 400', async () => {
        const validNonExistingId = await helper.nonExistingId()

        const newBlog = {
            likes: 1000
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send({
                "username": "root",
                "password": "sekret"
            })
            .expect(200)

        userAfterLogin = userAfterLogin.body
        const token = userAfterLogin.token


        await api
            .put(`/api/blogs/${validNonExistingId}`)
            .auth(token, { type: 'bearer' })
            .send(newBlog)
            .expect(400)

    })

    test('updating blog by user who did not create it fails with statuscode 401', async () => {
        const oldBlogs = await helper.blogsInDb()

        //get object we're trying to update
        const oldBlog = oldBlogs[0]

        //create new object
        const newBlog = {
            title: oldBlog.title,
            author: oldBlog.author,
            url: oldBlog.url,
            likes: 7,
            user: '60bbd013bf4c35848f604f46'
        }

        let userAfterLogin = await api
            .post('/api/login')
            .send({
                "username": "kannana1",
                "password": "secret"
            })
            .expect(200)

        userAfterLogin = userAfterLogin.body
        const token = userAfterLogin.token

        //send
        let updatedBlog = await api
            .put(`/api/blogs/${oldBlog.id}`)
            .auth(token, { type: 'bearer' })
            .send(newBlog)
            .expect(response => console.log(response.error))
            .expect(401)
    

        //check same amount of blogs, same properties incl. likes
        const newBlogs = await helper.blogsInDb()
        //console.log('OLD BLOGS: ', oldBlogs)
        console.log('\n\n\n UPDATED BLOG', updatedBlog)
        //console.log('\n\n\n NEW BLOGS', newBlogs)
        expect(newBlogs.length).toEqual(oldBlogs.length)
        expect(newBlogs[0].title).toEqual(oldBlog.title)
        expect(newBlogs[0].author).toEqual(oldBlog.author)
        expect(newBlogs[0].url).toEqual(oldBlog.url)
        expect(newBlogs[0].likes).toEqual(3)
    })



})

describe('when there is initially one user in db', () => {
    //The beforeEach block adds a user with the username 'root' to the database
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'kannana1',
            name: 'Anirudh Kannan',
            password: 'secret'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'secret'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` to be unique')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with statuscode 400 and appropriate message if password is missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'anotherUser',
            name: 'Another User'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('password missing')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with statuscode 400 and appropriate message if password is undefined', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'anotherUser',
            name: 'Another User',
            password: undefined
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('password missing')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)

    })

    test('creation fails with statuscode 400 and appropriate message if password is null', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'anotherUser',
            name: 'Another User',
            password: null
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('password missing')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with statuscode 400 and appropriate message if password is empty string', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'anotherUser',
            name: 'Another User',
            password: ''
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('password missing')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
    
    test('creation fails with statuscode 400 and an appropriate message if password is less than 3 characters long', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'anotherUser',
            name: 'Another User',
            password: 'n'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('password must be at least')
        
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})

afterAll(() => {
    mongoose.connection.close()
  })