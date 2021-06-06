//this file only defines the Mongoose schema for notes

//instead of using official MongoDB Node.js driver library, using Mongoose library that offers 'higher level API'
//Mongoose can be thought of as a 'object document mapper' (ODM); this library facilitates saving JS objects as Mongo documents
const mongoose = require('mongoose')

//define schema for a note and matching model
const noteSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        minlength: 5
    },
    date: {
        type: Date,
        required: true
    },
    important: Boolean,
    //references are now stored in both documents: the note references the user who created it, and the user has an array of references to all of the notes created by them.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

//adjust toJSON method of Note so that __v is deleted, _id is made into a String instead of an Object
noteSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Note', noteSchema)
  