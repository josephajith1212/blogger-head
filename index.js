//Importing dependencies
const express = require('express');
const path = require('path');
const {check, validationResult, body} = require('express-validator');
//Database setup
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bloggerheads',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
//model for logins
const Admin = mongoose.model('Admin',{
    username : String,
    password : String
});
// model for blogs
const Blog = mongoose.model('Blog',{
    blogtitle : String,
    blogslug : String,
    blogimage : String, 
    blogbody : String
})

var myApp = express();

const fileUpload = require('express-fileupload');
myApp.use(fileUpload());

//Express sessions
const session = require('express-session');
//Setup the session
myApp.use(session({
    secret: "confidential1212",
    resave: false,
    saveUninitialized: true
}));
myApp.use(express.urlencoded({extended:false}));
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');
//this is for the home page
myApp.get('/', function(req, res){
    Blog.find({}).exec(function (dbError, blogs){
        dbError && console.log (dbError);
        var data = {
            blogs : blogs,
            isLoggedIn : req.session.userLoggedIn
        }
        res.render('home', {data : data});
    });
    // res.render('home');
});
//loginPage
myApp.get('/login', (req, res) => {
    if (req.session.userLoggedIn){
        res.redirect("createBlog");
    }else{
        res.render('login');
    }
});
myApp.post('/login', (req, res) => {
    var user = req.body.username;
    var pwd = req.body.password;
    Admin.findOne({username : user, password : pwd}).exec(function(error, admin){
        if (admin) {
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            res.redirect("createBlog");
        }else{
            res.render('login', {error:"Incorrect Username or Password! Try again."});
            console.log("Error: " + error);
        }
    });
});
myApp.get('/createBlog', (req, res) => {
    if (req.session.userLoggedIn){
        Blog.find({}).exec(function (dbError, blogs){
            dbError && console.log (dbError);
            res.render('createBlog', {blogs : blogs});
        });
    }else{
            res.redirect('login');
    }
});
//new blog will be created and saved
myApp.post('/createBlog', (req, res) => {
    var blogtitle = req.body.blogtitle;
    var blogslug = req.body.blogslug;
    var blogbody = req.body.blogbody;
    var imageName = req.files.blogimage.name;
    var image = req.files.blogimage;
    var imagePath = 'public/blog_images/'+imageName;
    image.mv(imagePath, function(err){
        console.log(err);
    });
    var blogData = {
        blogtitle : blogtitle,
        blogslug : blogslug,
        blogimage : imageName,
        blogbody : blogbody
    }
    var BlogSave = new Blog(blogData);
        BlogSave.save().then(()=>console.log("Saved to database successfully."))
    res.redirect("/");
});
//to fetch a particular blog
myApp.get('/edit/:id', (req, res) => {
    var id = req.params.id;
    Blog.findOne({_id : id}).exec((err, blog) => {
        var data = {
            blogtitle : blog.blogtitle,
            blogslug : blog.blogslug,
            blogbody : blog.blogbody
        }
        res.render('edit', {data : data});
    })
});
//to edit a particular blog
myApp.post('/edit/:id', (req, res) => {
    var id = req.params.id;
    Blog.findOne({_id : id}).exec((err, blog) => {
        blog.blogtitle = req.body.blogtitle;
        blog.blogbody =  req.body.blogbody;
        blog.save();
        var data = {
            blogtitle : blog.blogtitle,
            blogbody : blog.blogbody
        }
    })
    res.render('edited');
});

myApp.get('/logout', (req, res) => {
    req.session.username = "";
    req.session.userLoggedIn = false;
    res.redirect('login');
});
myApp.get('/singleBlog/:id', (req, res) => {
    var id = req.params.id;
    Blog.findOne({_id:id}).exec((err, blog)=>{
        err && console.log("Error: "+err);
        res.render('singleBlog', {blog:blog});
    })
});
myApp.get('/delete/:id', (req, res) => {
    var id = req.params.id;
    Blog.findOneAndDelete({_id:id}).exec((err, blog) =>{
        err && console.log("Error: "+err);
        res.render("delete");
    })
});

myApp.listen(8099);
console.log('Website is up and running at: http://localhost:8099');