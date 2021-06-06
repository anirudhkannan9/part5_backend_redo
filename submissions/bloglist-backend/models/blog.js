const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number,
    //references are now stored in both documents: the note references the user who created it, and the user has an array of references to all of the notes created by them.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})



blogSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Blog', blogSchema)





