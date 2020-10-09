const express = require ('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const { check, validationResult } = require('express-validator');


//@route   GET api/profile/me
//@desc    Get current users profile
//@acess   private

router.get('/me', auth, async (req, res) => {
    try{
        const profile =  await Profile.findOne({ user: req.user.id}).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'Profile not found'});
        }
        res.json(profile);

    } catch(err){
        console.error(err.message);
        res.status(500).send('Server error');

    }
});

//@route   POST api/profile
//@desc    Create or Update profile
//@acess   private

router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const{
        company,
        website,location,
        bio,status,
        githubusername,
        skills,youtube,
        facebook,twitter,
        instagram,linkedin
    } = req.body;
    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    //Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try{
            //Update //using upsert option(creates new doc if no match is found)
           let profile = await Profile.findOneAndUpdate(
                { user: req.user.id},
                { $set: profileFields },
                { new: true, upsert: true }
                );
                res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }

});
    
    //@route   GET api/profile/
    //@desc    Get all profile
    //@acess   public

    router.get('/', async (req, res) =>{
        try {
            const profiles = await Profile.find().populate('user', ['name', 'avatar']);
            res.json(profiles);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    });

    //@route   GET api/profile/user/:user_id
    //@desc    Get profile by user ID
    //@acess   public

    router.get('/user/:user_id', async (req, res) =>{
        try {
            const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);

            if(!profile)
            return res.status(400).json({ msg: 'there is no profile for this user ID'});
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            if(err.kind == 'ObjectId'){
                return res.status(400).json({ msg: 'Profile not found' });
            }
            res.status(500).send('Server error');
        }

    });

    //@route   DELETE api/profile/
    //@desc    Delete profile, user an dposts
    //@acess   private

    router.delete('/', auth, async (req, res) =>{
        try {
            //@todo - remove users posts

            //Remove profile
           await  Profile.findOneAndRemove({ user: req.user.id });
           //Remove User
           await  User.findOneAndRemove({ _id: req.user.id });
            res.json({ msg: 'User deleted '});
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    });

    //@route   PUT api/profile/experience
    //@desc    Add  profile experience
    //@acess   private

    router.put('/experience', [auth, [
        check('title', 'Title is required').not().isEmpty(),
        check('company', 'Company is required').not().isEmpty(),
        check('from', 'From date is required').not().isEmpty()
    ]], async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,company,location,
            from,to,current,description
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,to,current,description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.experience.unshift(newExp);
            await profile.save();
            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    });

    //@route   DELETE api/profile/experience
    //@desc    Delete experience from profile
    //@acess   private

    router.delete('/experience/:exp_id', auth, async (req, res) =>{
        try {
            const profile = await Profile.findOne({ user: req.user.id });

            //Get remove index
            const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
            profile.experience.splice(removeIndex, 1);
            await profile.save();
            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    });

    //@route   PUT api/profile/education
    //@desc    Add  profile education
    //@acess   private

    router.put('/education', [auth, [
        check('school', 'school is required').not().isEmpty(),
        check('degree', 'degree is required').not().isEmpty(),
        check('feildofstudy', 'Fieldofstudy date is required').not().isEmpty(),
        check('from', 'from is required').not().isEmpty()
    ]], async(req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,degree,fieldofstudy,
            from,to,current,description
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,to,current,description
        }
        try {
            const profile = await Profile.findOne({ user: req.user.id });
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    });

    //@route   DELETE api/profile/education
    //@desc    Delete education from profile
    //@acess   private

    router.delete('/education/:edu_id', auth, async (req, res) =>{
        try {
            const profile = await Profile.findOne({ user: req.user.id });

            //Get remove index
            const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
            profile.education.splice(removeIndex, 1);
            await profile.save();
            res.json(profile);
            
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }

    });



module.exports = router;