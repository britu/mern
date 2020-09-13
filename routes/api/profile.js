const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { body, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@rout        GET api/profile/me
//Description   Get current users profile
//@access       Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//@rout        GET api/profile
//Description   Create or update user profile
//@access       Private

router.post(
  "/",
  [
    auth,
    [
      body("status", "Status is required").not().isEmpty(),
      body("skills", "Skills are required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object //
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    //trun that into an array for skills
    if (skills) {
      profileFields.skills = skills.split(" , ").map((skill) => skill.trim());
    }
    //console.log(profileFields.skills);

    //  Build social object //
    profileFields.social = {}; //initialise this field first
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    // Update and insert the data //

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // Create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }

    res.send("Hello");
  }
);

//@rout        GET All api/profile/
//Description   GET current users profile
//@access       Public

router.get("/", async (req, res) => {
  try {
    const profile = await Profile.find().populate(["user", "avatar"]);
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@rout        GET All api/profile/user/:user_id
//Description   GET profile by user ID
//@access       Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate(["user", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@rout        GET All api/profile/
//Description   DELETE Profile, user & posts
//@access       Private

router.delete("/", auth, async (req, res) => {
  try {
    // @todo - remove users posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

//@rout        GET All api/profile/expreience
//Description   ADD PROFILE EXPERIENCE
//@access       Private

router.put(
  "/experiences",
  [
    auth,
    [
      body("title", "Title is require").not().isEmpty(),
      body("company", "Company is required").not().isEmpty(),
      body("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    //deal with mango db
    try {
      const profile = await Profile.findOne({ user: req.user.id }); //we get this from token coz auth

      profile.experiences.unshift(newExp); //same is push in begininig

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.errors(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@rout        DELETE All api/profile/expreience/:exp_id
//Description   Delete experience from profile
//@access       Private

router.delete("/experiences/:exp_id", auth, async (req, res) => {
  try {
    //getting the profile user
    const profile = await Profile.findOne({ user: req.user.id });
    //Get remove index need to reiterate
    const removeIndex = profile.experiences
      .map((experience) => experience.id)
      .indexOf(req.params.exp_id);
    profile.experiences.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@rout        GET All api/profile/education
//Description   ADD profile EDUCATION
//@access       Private

router.put(
  "/education",
  [
    auth,
    [
      body("school", "School is require").not().isEmpty(),
      body("degree", "Degree is required").not().isEmpty(),
      body("fieldofstudy", "Field of study required").not().isEmpty(),
      body("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    //deal with mango db
    try {
      const profile = await Profile.findOne({ user: req.user.id }); //we get this from token coz auth

      profile.education.unshift(newEdu); //same is push in begininig

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.errors(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@rout        DELETE All api/profile/education/:edu_id
//Description   DELETE profile EXPERIENCE
//@access       Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    //getting the profile user
    const profile = await Profile.findOne({ user: req.user.id });
    //Get remove index need to reiterate
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@rout        Get api/profile/github/:username
//Description   Get user repos from Github
//@access       Public

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: " No Github profile found" });
      }

      res.json(JSON.parse(body)); // it's gonna be
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;

/*
{
	"company":"Britu Media",
	"status": "Developer",
	"website":"http://www.mero.esy.es",
	"skills": "HTML, CSS, PHP, Python",
	"location": "London",
	"Bio": "I am a Senior Developer and insructor for myself",
	"githubusername":"britu",
	"twitter": "https://twitter.com/britu",
	"facebook": "https://facebook.com/britu",
	"youtube": "https://youtube.com/britu"
}
*/
