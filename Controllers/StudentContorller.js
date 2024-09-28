const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

exports.studentlist = (req, res) => {
  db.query(
    "SELECT id, name, email, dateofbirth, mobilenumber, username, password FROM students",
    [],
    (error, user) => {
      try {
        res.send(JSON.stringify({ status: "200", error: error, user: user }));
      } catch (error) {
        res.send(JSON.stringify({ status: "404", error: error }));
      }
    }
  );
};

exports.singlestudentlist = (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM students WHERE id = ?", [id], (error, user) => {

    if (user == '') {
      return res.status(404).json({ status: 404, error: "user not found", message: "User Does Not Exist" });
    }

    try {
      res.send(JSON.stringify({ status: "200", error: error, user: user }));
    } catch (error) {
      res.send(JSON.stringify({ status: "404", error: error }));
    }
  });
};

exports.deletestudent = (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM students WHERE id = ?", [id], (error, user) => {
    if (user.length == '') {
      return res.status(404).json({ status: 404, error: "user not found", message: "User Does Not Exist" });
    }

    db.query("DELETE FROM students WHERE id = ?", [id], (error, user) => {
      try {
        res.send(JSON.stringify({ status: "200", error: error, message: "Student Deleted Successfully", user: user }));
      } catch (error) {
        res.send(JSON.stringify({ status: "404", error: error }));
      }
    });
  });
};

exports.updatestudent = (req, res) => {
  const id = req.params.id;
  const { name, email, mobilenumber, dateofbirth } = req.body;

  if (!name || !email || !dateofbirth || !mobilenumber) {
    return res.status(400).json({
      status: 400,
      error: "Missing Fields",
      message: "All fields must be provided",
    });
  }

  db.query("SELECT * FROM students WHERE id = ?", [id], (error, user) => {
    if (error) {
      return res.status(500).json({ status: 500, message: "Database query error", error });
    }

    if (user.length === 0) {
      return res.status(404).json({ status: 404, message: "User does not exist" });
    }

    db.query("SELECT * FROM students WHERE (email = ? OR mobilenumber = ?) AND id != ?", [email, mobilenumber, id], (error, user) => {
      if (error) {
        return res.status(500).json({ status: 500, message: "Database query error", error });
      }

      if (user.length > 0) {
        const existingUser = user[0];
        if (existingUser.email === email) {
          return res.status(400).json({ status: 400, message: "Email Already Exists" });
        }
        if (existingUser.mobilenumber === mobilenumber) {
          return res.status(400).json({ status: 400, message: "Mobile Number Already Exists" });
        }
      }

      db.query("UPDATE students SET ? WHERE id = ?", [{ name, email, mobilenumber, dateofbirth }, id], (error, user) => {
        if (error) {
          return res.status(500).json({ status: 500, message: "Database update error", error });
        }

        res.status(200).json({ status: 200, message: "Student updated successfully", user });
      });
    });
  });
};


exports.studentregister = async (req, res) => {
  const { name, email, mobilenumber, dateofbirth, username, password } = req.body;

  const hashPassword = await bcrypt.hash(password, 10);

  if (mobilenumber.length !== 10) {
    return res.status(400).json({ status: 400, message: "Mobile number must be 10 digits long" });
  }

  db.query("SELECT * FROM students WHERE email = ?", [email], (err, user) => {
    if (user != "") {
      res.send(JSON.stringify({ status: 200, error: null, message: "Email already exists", }));
    } else {
      db.query("SELECT * FROM students WHERE mobilenumber = ?", [mobilenumber], (err, user) => {
        if (user.length > 0) {
          res.send(JSON.stringify({ status: 200, error: null, message: "Mobile Number already exists", }));
        } else {
          db.query("SELECT * FROM students WHERE username = ?", [username], (err, user) => {
            if (user != "") {
              res.send(JSON.stringify({ status: 200, error: null, message: "Username already exists", }));
            } else {
              db.query("INSERT INTO students SET ?", {
                name: name,
                email: email,
                dateofbirth: dateofbirth,
                mobilenumber: mobilenumber,
                username: username,
                password: hashPassword,
              }, (error, user) => {
                try {
                  res.send(JSON.stringify({ status: "200", error: error, user: user, }));
                } catch (error) {
                  res.send(JSON.stringify({ status: "404", error: error }));
                }
              });
            }
          });
        }
      });
    }
  });
};

exports.studentlogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send(JSON.stringify({
      status: 400, error: "Missing Fields",
      message: "username and password are required",
    })
    );
  }

  try {
    db.query("SELECT * FROM students WHERE username = ?", [username], async (err, user) => {
      if (err) {
        return res.send(JSON.stringify({ status: 500, error: "Database error" }));
      }

      if (user.length === 0) {
        return res.send(JSON.stringify({ status: 404, message: "User not found" }));
      }

      try {
        const hashedPassword = user[0].password;
        const isMatch = await bcrypt.compare(password, hashedPassword);

        if (!isMatch) {
          return res.send(JSON.stringify({ status: 401, message: "Password Incorrect" }));
        }

        const Token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.send(JSON.stringify({ status: 200, message: "Login Successfully !", user, Token, }));
      } catch (error) {
        res.send(JSON.stringify({ status: 500, error: "Server error" }));
      }
    }
    );
  } catch (error) {
    res.send(JSON.stringify({ status: 500, error: "Server error" }));
  }
};
