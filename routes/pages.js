const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.get('/',(req,res)=>{
    res.render('index');
});

router.get('/register',(req,res)=>{
    res.render('register');
});

router.get('/login',(req,res)=>{
    res.render('login');
})


router.get('/home',(req,res)=>{

    if(req.session.loggedin)
    {
        console.log('LoggedIN Home');
    }

    res.render('home');

})

router.get('/requestList',(req,res)=>{
    if(req.session.loggedin)
    {
        console.log('LoggedIN in requestList');
        //authController.requestList
    }
    
        res.render('requestList');
    

    

})


router.get('/logout', async(req,res)=>{

    console.log('INSIDE LOGOUT');
    if(req.session.loggedin)
    {
        req.session.loggedin = false;
        delete req.session.name;
        res.render('index');
    }
    
})
module.exports = router;