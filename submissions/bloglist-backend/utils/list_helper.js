var _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item
    }

    return blogs.map(blog => blog.likes).reduce(reducer, 0)

}

const favoriteBlog = (blogs) => {
    let favouriteBlog = blogs[0]

    for (let i=0; i < blogs.length; i++) {
        if (blogs[i].likes > favouriteBlog.likes) {
            favouriteBlog = blogs[i]
        }
    }

    return favouriteBlog
}
//Define a function called mostBlogs that receives an array of blogs as a parameter. 
//The function returns the author who has the largest amount of blogs. 
//The return value also contains the number of blogs the top author has:

const mostBlogs = (blogs) => {
    const authorsArray = _.uniq(blogs.map(b => b.author))
    var authors = []
    for (var i=0; i < authorsArray.length; i++) {
        authors.push({ author: authorsArray[i], blogs: 0})
    }

    //loop through array of blogs, this time incrementing the author's numBlogs in the authors object each time we come across a blog by them
    for (var j=0; j < blogs.length; j++) {
        //for each blog, find the author who wrote it and increment his blogs in the object
        for (var k=0; k <authors.length; k++) {
            if (authors[k].author === blogs[j].author) {
                //console.log('Found the author who wrote', blogs[j], 'his names are: ', blogs[j].author, authors[k].author)
                authors[k].blogs = authors[k].blogs += 1
            }
        }        
    }
    //console.log(authors)
    //loop through authors object, storing author with most blogs seen so far, and returning that by the end of it
    var mostBlogsAuthor = authors[0]
    for (var l=1; l < authors.length; l++) {
        if (authors[l].blogs > mostBlogsAuthor.blogs) {
            mostBlogsAuthor = authors[l]
        }
    }
    return mostBlogsAuthor

}

const mostLikes = (blogs) => {
    const authorsArray = _.uniq(blogs.map(b => b.author))
    var authors = []
    for (var i=0; i < authorsArray.length; i++) {
        authors.push({ author: authorsArray[i], likes: 0})
    }

    //loop through array of blogs, this time incrementing the author's likes in the authors object each time we come across a blog by them
    for (var j=0; j < blogs.length; j++) {
        //for each blog, find the author who wrote it and increment his blogs in the object
        for (var k=0; k <authors.length; k++) {
            if (authors[k].author === blogs[j].author) {
                //console.log('Found the author who wrote', blogs[j], 'his names are: ', blogs[j].author, authors[k].author)
                authors[k].likes = authors[k].likes += blogs[j].likes
            }
        }        
    }

    //loop through authors object, storing author with most blogs seen so far, and returning that by the end of it
    var mostLikesAuthor = authors[0]
    for (var l=1; l < authors.length; l++) {
        if (authors[l].likes > mostLikesAuthor.likes) {
            mostLikesAuthor = authors[l]
        }
    }
    return mostLikesAuthor
    
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}