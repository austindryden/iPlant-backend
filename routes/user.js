require('dotenv').config();
const SALTROUNDS = parseInt(process.env.SALTROUNDS || 10);
const SECRET = process.env.ACCESS_TOKEN_SECRET || "notsosecret";
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const post = require('../models/addquery');
const put = require('../models/updatequery');
const del = require('../models/deletequery');
const get = require('../models/getquery');
const {JWTCheck} = require('../models/userquery');

//POST 'app/user/login'
// Takes JSON object as body of request. requires 'username' and 'password' keys.
// returns JSON object. If username is not in database, ends back status 404 and {'error' : "invalid username"}
// If username is valid, check to see if password matches users hash. If no, returns status 403 and {'login':'FAILURE', 'error':'Invalid Password'}
// IF username and password are correct, returns status 200 and {'login':"SUCCESS", 'token':${JWT token containing {'userID':(id for username)}}
router.post('/login', async (req, res) =>{
    try{
        let login = req.body;
        let userInfo = await get.userByUsername(login.username);
        if(!userInfo){
            return res.status(404).json({error:"invalid username"});
        }
        let comp = bcrypt.compareSync(login.password, userInfo.hash);
        if (comp){
            let payload = {'userId':userInfo.id};
            let token = jwt.sign(payload, SECRET);
            return res.json({login:"SUCCESS", token});
        }
        return res.status(403).json({login:"FAILURE", error:"invalid username"});
    } catch(e){
        return res.status(404).json({error:"something went wrong"});
    }
});

//POST 'app/user/register'
// Takes JSON object as body of request. requires username, password, email. can also take firstname, lastname.
// if username or email already exist in DB, OR if either is not passed in, will send satus 404 and JSON {'register':"FAILURE", 'error': "(username or email) already exists"}
//if new user is created, will send JSON {'register':"SUCCESS", 'token':${JWT token containing {'userID':(id for username)}}
router.post('/register', async (req, res)=>{
    try{
        let newUser = req.body;
        let newHash = await bcrypt.hash(newUser.password || newUser.hash, SALTROUNDS);
        newUser.hash = newHash;
        let newRec = await post.addUser(newUser);

        if (!newRec.error){
            let payload = {'userId':newRec.id};
            let token = jwt.sign(payload, SECRET);
            return res.json({register:"SUCCESS", token});
        }
        return res.status(403).json({login:"FAILURE", error:newRec.error});
    }catch(e){
        console.log(e);
        return res.status(404).json({error:"something went wrong"});
    }
});

// This is the JWT validation check. Check if token is valid, attach token payload to req.body and call next. if not, return JSON login error.
router.use(JWTCheck);

// NEEDS TO get WRITTEN AFTER JWT REFRESH TOKENS AND TIMEOUTS ARE IMPLEMENTED!!
router.post('/logout', async (req, res)=>{
    return res.status(404).json({horse:"shit"})
});

router.get('/user', async (req, res)=>{
    try{
        let {userId} = req.body.token;
        let newRec = await get.oneUser(userId);
        return res.json(newRec);
    }catch(e){
        console.log(e);
        return res.json({horse:"shit"})
    }
});

router.put('/user', async (req, res)=>{
    try{
        let updateUser = req.body;
        let updateRec = await put.updateUser(updateUser);
        console.log(updateRec);    
        if (!updateRec.error){
            return res.json(updateRec);
        }
        return res.status(404).json(updateRec);
    }catch(e){
        console.log(e);
        res.json({horse:"shit"})
    }
});

router.delete('/user', async (req, res)=>{
    try{
        let delUser = req.body;
        let delRec = await del.deleteUser(delUser.id);
        if (!delRec.error){
            return res.json(delRec);
        }
        return res.status(404).json(updateRec);
    }catch(e){
        console.log(e);
        res.json({horse:"shit"})
    }
});

module.exports = router;