const express = require("express");
const router = express.Router();

//@rout        GET api/users
//Description   Test route
//@access       Public

router.get("/", (req, res) => res.send("Profile route"));

module.exports = router;
