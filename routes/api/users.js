const express = require ('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/Users');
const config = require('config');
const { wait } = require('@testing-library/react');


//@route   Post api/users
//@desc    Reister user 
//@acess   public

router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'please include valid email').isEmail(),
    check('password', 'password length must be 6 or more characters').isLength({min: 6})
] ,async (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()){
       return res.status(400).json({errors: errors.array() });
   }

   const {name, email, password} = req.body;

   try{
    //see if user exists
    let user = await User.findOne({ email });
     if(user){
         return res.status(400).json({ errors: [{msg: 'User already exist'}] });
     }

   //Get users gravatar
   const avatar = gravatar.url(email, {
       s:'200',
       r: 'pg',
       d: 'mm'
   });

   user = new User({ name, email, password, avatar});

   //Encrypt password
   const salt = await bcrypt.genSalt(10);
   user.password  = await bcrypt.hash(password, salt);
   await user.save();
   
   //Return Jsonwebtoken
   const payload = {
       user: {
           id: user.id
       }
   }

   jwt.sign(payload, 
    config.get('jwtSeceret'),
    { expiresIn: 360000},
    (err, token) => {
        if(err) throw err;
        res.json({token});
    });

   } catch(err){
       console.error(err.message);
       res.status(500).send('Server error');
   }
   
});

module.exports = router;