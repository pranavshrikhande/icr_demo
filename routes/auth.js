const mysql = require("mysql");
const express = require('express');

const fs =  require("fs");
const multer = require('multer');
const tesseract = require("tesseract.js");
var pdf2img = require('pdf-img-convert');

var { v4: uuidv4 }  =require('uuid');
const authController = require('../controllers/auth');
const router = express.Router();

const axios = require('axios');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    insecureAuth : true

});


router.post('/register', authController.register);


router.post('/login', authController.login)

router.get('/home',(req,res)=>{n  
    
    var passedVariable = req;

    
    console.log("passed Variables are-->",passedVariable);
    
    if(req.session.loggedin)
    {
        console.log('Inside home in authjs, line 39 LoggedIN');
        res.render('home');
    }
    else {
		// Not logged in
		response.send('Please login to view this page!');
	}
})


router.get('/createProfile',(req,res)=>{
    if(req.session.loggedin)
    {
        console.log('loggedIn');
        res.render('createProfile');
    }
    else
    {
        // Not logged in
		response.send('Please login to view this page!');

    }

});

//Storage
const storage=  multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"./uploads")
    },
    filename:(req,file,cb)=>{

       cb(null,file.originalname);

    }
});

const  upload =   multer({storage:storage}).single('avatar');

router.post('/upload', async (req,res)=>{

    console.log('INSIDE Upload---------');
    console.log(req.session.loggedin);
    console.log(req.session.userid);
    console.log('UUID IS--->',req.uuid);
    console.log(req.session.uuid)
    console.log(req.session.patientID)
    
    console.log('-------------------');
    
    let user_id = req.session.userid;
    let uuid = req.session.uuid
    let patientID = req.session.patientID;

    delete req.session.uuid;
    delete req.session.patientID;
    
    
  
    
    
    let op;




      console.log(__dirname);
      upload(req,res,err =>{
             
         fs.readFile(`./uploads/${req.file.originalname}`,(err,data)=>{
            if(err) return console.log('This is your error',err);
           

            //Conversion of pdf
            var outputImages1 = pdf2img.convert(`./uploads/${req.file.originalname}`);
            outputImages1.then(function(outputImages) {
            for (i = 0; i < outputImages.length; i++)
             fs.writeFile(`./images/${req.file.originalname}`+".png", outputImages[i], function (error) {
                if (error) { console.error("Error: " + error); }
                });
             });

            //  working code for image

            tesseract.recognize(`./images/${req.file.originalname}.png`,"eng",{logger : (m)=> console.log(m) }).then((result)=>{console.log(result.data.text);
                ocrText = result.data.text;
                console.log('-------------------------------------------');
                console.log(typeof ocrText);
                console.log(ocrText);

                let img_name = req.file.originalname;
                db.query('INSERT INTO conversionRecords SET ?',{
                    patientID:patientID,
                    uuid:uuid,
                    ocrText:ocrText,
                    img_name:img_name,
                    req_status:'Completed',
                    user_id:user_id
                },(error,results)=>{
                    if(error)
                    {
                        console.log(error);
                    }
                    else
                    {
                        /*return res.render('requestList',{
                            ocrText:ocrText
                        });*/

                        //return res.redirect('./../requestList');
                        
                        return res.redirect('./requestList');
                    }
                })

                //res.send(ocrText);
            }).catch((err)=>{
                console.log(err.message);
            });
    
        });

    });
    //res.send(op);
    
});


router.post('/createProfile',authController.createProfile);

router.post('/verifyUUID',authController.verifyUUID);


router.get('/requestList',authController.requestList);

router.get('/adminView',authController.adminView);


module.exports = router;