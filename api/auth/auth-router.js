const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { checkUsernameExists, validateRoleName } = require("./auth-middleware");
const Users = require("../users/users-model");
const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../secrets"); // use this secret!

router.post("/register", validateRoleName, async (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  try {
    const hash = bcrypt.hashSync(req.body.password, 10);
    const newUser = await Users.add({
      username: req.body.username,
      password: hash,
      role_name: req.role_name,
    });
    res.status(201).json(newUser);
  } catch (e) {
    res.status(500).json(`Server error: ${e.message}`);
  }
});

router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
  try {
    const verified = bcrypt.compareSync(
      req.body.password,
      req.userData.password
    );
    if (verified) {
      const user = req.userData;
      const token = makeToken(user);
      const userName = user.username;
      res.status(200).json({ message: `${userName} is back`, token });
    } else {
      res.status(401).json({ message: "invalid credentials" });
    }
  } catch (e) {
    res.status(500).json(`login Server error: ${e}`);
  }
});

function makeToken(user){
  const payload={
    subject: user.user_id,
    username: user.username,
    role_name: user.role_name
  }
  const options = {
    expiresIn:"1d"
  }
  return jwt.sign(payload,JWT_SECRET,options)
}

module.exports = router;
