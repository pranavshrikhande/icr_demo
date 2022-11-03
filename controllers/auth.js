const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const dotenv = require('dotenv');
const { request } = require("express");
var { v4: uuidv4 }  =require('uuid');

dotenv.config({ path: './.env'});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    insecureAuth : true

});


exports.login=async (req,res)=>{

    try{

        console.log(req.body);
        
        
        const { email, password,role } = req.body;



        console.log(email,password,role);
        if(!email || !password)
        {
            return res.status(400).render('login',{message:'Please enter email and password'})
        }
       
        /*===============New Code added here==============*/
       
        if(role=='Admin')
        {
            db.query('SELECT * FROM users WHERE email=? and role=?',[email,'Admin'],async(error,results)=>{
                console.log('results in Admin section are',results);


                if(!results || await !(bcrypt.compare(password,results[0].password)))
                {
                    res.status(400).render('login',{
                        message:'WRONG EMAIL, PASSWORD OR ROLE'
                    })
                }
                else{
                        let id =results[0].id;
                        req.session.loggedin = true;
                        req.session.name = results[0].name;
                        req.session.userid = results[0].id;
        
                        
                        console.log(req.session.loggedin, req.session.name,req.session.userid);
        
                        const token = jwt.sign({id:id}, process.env.JWT_SECRET, {expiresIn : "1h" });
                        res.cookie('token',token,{ httpOnly: true});
                        //res.status(200).render('./adminView');
                        return res.redirect('./adminView')
                    }
            })
        }
        /*==================New Code Ends here==============*/
        /*REGULAR LOGIN STARTS FROM HERE*/
        else{

        db.query('SELECT * FROM users WHERE email = ?', [email] , async(error,results)=>{

            console.log('results in else are', results);
            console.log('--------------//////////////*****************')
            console.log(results[0].role!==role) ;
            console.log(role)
            
            if(!results || await !(bcrypt.compare(password, results[0].password)) || results[0].role!=='User')
            {
                console.log(results);
                res.status(400).render('login',{
                    message:'WRONG EMAIL OR PASSWORD, OR ROLE!'
                })
            }
            else{
                const id =results[0].id;
                /*const token = jwt.sign({ id:id }, process.env.JWT_SECRET,{
                    expiresIn : process.env.JWT_EXPIRE_IN
                });*/

                req.session.loggedin = true;
                req.session.name = results[0].name;
                req.session.userid = results[0].id;

                
                console.log(req.session.loggedin, req.session.name)

                const token = jwt.sign({id:id}, process.env.JWT_SECRET, {expiresIn : "1h" });


                /*const cookieOptions = {
                    expires: new Date (Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 *1000),
                    httpOnly: true,
                }*/
                //res.cookie('jwt',token, cookieOptions);
                
                res.cookie('token',token,{ httpOnly: true});


                //res.status(200).render('home',{message:'Logged in System'});
                //return res.status(200).redirect('./home');
                return res.status(200).redirect('./createProfile');
                            
            }
        })
        
    /*------------REGULAR LOGIN ENDS HERE-----------------*/
    }
    }
    catch(err)
    {
        console.log(err);
    }

}


exports.register = (req,res)=>{
    console.log(req.body);
    
    const { name, email, password, passwordConfirm, role} = req.body;

    db.query('SELECT email FROM users WHERE email=?', [email], async(error,results)=>{
        if(error)
        {
            console.log(error);
        }

        if(results.length>0)
        {
            return res.render('register', {
                message:'That email is already in use'
            })
        }
        else if(password !== passwordConfirm){
            return res.render('register', {
                message:'Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

       db.query('INSERT INTO users SET ?',{name :name, email:email, password:hashedPassword, role:role},(error,results)=>{
        if(error)
        {
            console.log(error);
        }
        else{
            return res.render('register',{
                message:'User registered'
            });
        }

       })
    });


  //  res.send("Form Submitted");
}

exports.createProfile = (req,res)=>{

    console.log(req.body);

    const { patientName, patientId, bloodPressure, age,weight} = req.body;

    db.query('SELECT patientId FROM patientProfile WHERE patientId=?',[patientId], async(error,results)=>{

        if(error)
        {
            console.log(error);
        }

        if(results.length>0)
        {
            return res.render('createProfile',{message:'patient Id already exist'})
        }


        let uuid = uuidv4();
        
        if(!req.session.userid)
        {
            return res.render('createProfile',{message:'Please login'})
        }

        let user_id = req.session.userid;

        
        //console.log('uuid is-->',uuid)
        console.log("Current Session name is",req.session.name);
        console.log("current session id is",req.session.userid);

        let status_current;
       if(uuid)
       {
        status_current = "Done";
       }
       else
       {
        status_current="Incomplete";
       }

        db.query('INSERT INTO patientProfile SET ?',{
            user_id:user_id,
            uuid:uuid,
            patientName:patientName,
            patientId:patientId,
            bloodPressure:bloodPressure,
            age:age,
            weight:weight,
            status_current:status_current
        },(error,results)=>{
            if(error)
            {
                console.log(error);
            }
            else
            {
                return res.render('uuidVerify',{
                    message:`Patient Registered. please note the id ${uuid}`

                });
            }
        })


    })
    

};

exports.verifyUUID = (req,res)=>{

    console.log(req.body);

    const {uuid} = req.body;

    let user_id = req.session.userid;
    
    console.log(user_id);

    db.query('SELECT * FROM patientProfile WHERE uuid = ? and user_id =?',[uuid,user_id],async(error,results)=>{

            console.log('results in query are',results[0]);
            console.log('results II are',results);

        if(!results)
        {
            res.status(400).render('uuidVerify',{
                message:'UUID not present'
            });
        }
        else{
            req.session.uuid = uuid;
            req.session.patientID = results[0].patientID;

            return res.status(200).render('./home',{
                uuid:uuid,
                patientId:results[0].patientID,
                user_id:user_id
            });
            /*res.status(200).render('./home',{
                uuid:uuid,
                patientId:results[0].patientID,
                user_id:user_id
            })*/

            /*res.render('./home').send({uuid:uuid,
                patientId:results[0].patientID,
                user_id:user_id});
        }*/

    }

})



};

exports.requestList = (req,res)=>{


    console.log('inside requestListController------')
    console.log(req.session.userid);
    
    let user_id=req.session.userid;

    //let userid = req.session.userid;

    db.query('select cr.ocrText, cr.img_name, pp.patientId, pp.patientName from  patientProfile pp join conversionRecords cr on pp.patientID = cr.patientID where cr.user_id=?',[user_id],async(error,results)=>{

        
        
            console.log(results);
        
        if(!results)
        {
            res.status(400).render('./requestList');
        }
        else{
            console.log(results);

        }

        return res.render('./requestList',{
            output:results

    })})


    }


exports.adminView = (req,res)=>{

    console.log('inside adminView');

    console.log(req.session.userid);

    let user_id=req.session.userid;

    db.query('select cr.ocrText, cr.img_name, pp.patientId, pp.patientName from patientProfile pp join conversionRecords cr on pp.patientId = cr.patientID', async(error,results)=>{


        console.log(results);

        if(!results)
        {
            res.status(400).render('./adminView');
        }

        return res.render('./adminView',{
            output:results
        })
    })




}
