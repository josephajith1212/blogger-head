//Importing dependencies
const express = require('express');
const path = require('path');
const {check, validationResult} = require('express-validator');
//Database setup
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/covidshop',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const Order = mongoose.model('Order', {
    name : String,
    address : String,
    city : String,
    province : String,
    postCode : String,
    phoneNum : String,
    email : String,
    product1 : Number,
    product2 : Number,
    product3 : Number,
    tax : Number,
    total : Number
});

var myApp = express();
myApp.use(express.urlencoded({extended:false}));

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');
//this is for the home page
myApp.get('/', function(req, res){
    res.render('home');
});
//validations happen here
myApp.post('/', [
    check('name')
    .notEmpty()
    .withMessage('Name can not be empty'),

    check('address')
    .notEmpty()
    .withMessage('Address can not be empty'),
    //cities do not have numbers
    check('city')
    .notEmpty()
    .withMessage('City can not be empty')
    .isAlpha()
    .withMessage('City can have alphabets only'),

    check('province', 'Please select your province').notEmpty(),

    check('phoneNum')
    .isMobilePhone()
    .withMessage('Phone number invalid'),

    check('email')
    .isEmail()
    .withMessage('Invalid email'),
    //for the products the validation and error kicks in if not null
    check('product1')
    .optional({nullable: true, checkFalsy: true})
    .isInt({min:1})//non negative numbers only
    .withMessage("Please enter a valid number for product 1"),

    check('product2')
    .optional({nullable: true, checkFalsy: true})
    .isInt({min:1})
    .withMessage("Please enter a valid number for product 2"),

    check('product3')
    .optional({nullable: true, checkFalsy: true})
    .isInt({min:1})
    .withMessage("Please enter a valid number for product 3")
    
],function(req, res){

    const errors = validationResult(req);
    const product1Price = 5;
    const product2Price = 10;
    const product3Price = 3;
    var product1 = req.body.product1;
    var product2 = req.body.product2;
    var product3 = req.body.product3;
    //converting json to array
    var errorList = errors.array()
    //before errors are rendered, checking if total < 10. If so, I push one more object to the array of error objects
    if (((product1*product1Price)+(product2*product2Price)+(product3*product3Price)) < 10) {
        errorList.push({msg: "Minimum order amount : $10.00"})
    }
    //If there are errors, display them
    if (!errors.isEmpty()){
        res.render('home', {
            errorList:errorList
        });
    }
    //if no errors
    else{
        //each province has different tax rates
        const tax = {
            "Alberta" : 11.5,
            "British Columbia" : 13,
            "Manitoba" : 14.2,
            "New Brunswick" : 12.4,
            "Newfoundland and Labrador" : 12,
            "Nova Scotia" : 11,
            "Ontario" : 15,
            "Prince Edward Island" : 12,
            "Quebec" : 13,
            "Saskatchewan" : 11,
            "Northwest Territories" : 10,
            "Nunavut" : 10.2,
            "Yukon" : 10
        }
        //getting all values
        var name = req.body.name;
        var address = req.body.address;
        var city = req.body.city;
        var province = req.body.province;
        var postCode = req.body.postCode;
        var phoneNum = req.body.phoneNum;
        var email = req.body.email;
        var product1 = req.body.product1;
        var product2 = req.body.product2;
        var product3 = req.body.product3;
        var deliveryTime = req.body.deliveryTime;
        var total = (product1 * product1Price) + (product2 * product2Price) + (product3 * product3Price);
        var taxToApply = total * (tax[province]/100);
        //creating new object to send to ejs
        var pageData = {
            name : name,
            address : address,
            city : city, 
            province : province,
            postCode : postCode,
            phoneNum : phoneNum,
            email : email,
            product1 : product1,
            product2 : product2,
            product3 : product3,
            product1Price : product1Price,
            product2Price : product2Price,
            product3Price : product3Price,
            deliveryTime : deliveryTime,
            total : total,
            tax : taxToApply
        }
        // res.render('home', pageData);//render file with the created object
        var OrderSave = new Order(pageData);
        OrderSave.save().then(()=>console.log("Saved to database successfully."))
        res.render('home', pageData);
    }
});
//reading from mondo db
myApp.get('/orders', (req, res) => {
    Order.find({}).exec(function (dbError, orders){
    dbError && console.log (dbError);
    res.render('orders', {orders : orders});
    });
});

myApp.listen(8099);
console.log('Website is up and running at: http://localhost:8099');