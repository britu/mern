const express = require("express");
const router = express.Router();

//@rout        GET api/users
//Description   Test route
//@access       Public

router.get("/", (req, res) => res.send("Post route"));

module.exports = router;
