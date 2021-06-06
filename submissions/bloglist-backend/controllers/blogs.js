const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const userExtractor = require('../utils/middleware').userExtractor
//const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog.toJSON())
    } else {
        response.status(404).end()
    } 
})

blogsRouter.post('/', userExtractor, async (request, response) => {
    const body = request.body
    const user = request.user

    if (body.title === undefined || body.url === undefined) {
        response.send(400).end()
    } else {
       
        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes === undefined ? 0 : body.likes,
            user: user._id
        })
    
        const savedBlog = await blog.save()
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()

        response.json(savedBlog)
    }
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    const blogUserId = blog.user.toString()
    const userId = user.id.toString()
    if (blogUserId === userId) {
        await Blog.findByIdAndDelete(request.params.id)
        user.blogs = user.blogs.filter(b => b.id !== request.params.id)
        await user.save()
        response.sendStatus(204).end()
    } else {
        return response.status(401).json({ error: 'Blogs can only be deleted by the user who created them' })
    }
})

blogsRouter.put('/:id', userExtractor, async (request, response) => {
    const body = request.body
    const oldBlog = await Blog.findById(request.params.id)
    const user = request.user
    // const blogUserId = oldBlog.user.toString()
    // const userId = user.id.toString()
    if (!oldBlog) {
        response.sendStatus(400).end()
    } else if (oldBlog.user.toString() === user.id.toString()) {
        //DO NOT USE MONGOOSE SCHEMA OBJECT HERE i.e. no newBlog = new Blog({title: ...}) -- fails to update. Apparently normal JS objects are not only preferred but necessary
        const newBlog = {
            title: oldBlog.title, 
            author: oldBlog.author,
            url: oldBlog.url,
            likes: body.likes === undefined ? oldBlog.likes : body.likes
        }
    
        const resultUpdatedBlog = await Blog.findByIdAndUpdate(request.params.id, newBlog, { new: true })
        //output of next line doesn't change if we do response.json(resultUpdatedBlog) versus resultUpdatedBlog.toJSON(). Maybe .json(object) calls object's .toJSON() method
        response.json(resultUpdatedBlog.toJSON())
    } else {
        return response.status(401).json({ error: 'Blogs can only be updated by the user who created them' })
    }
})
  
module.exports = blogsRouter
