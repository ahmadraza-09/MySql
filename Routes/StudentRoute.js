const express = require("express");
const StudentController = require("../Controllers/StudentContorller");
const router = express.Router();

router.post("/studentlogin", StudentController.studentlogin);
router.get("/studentlist", StudentController.studentlist);
router.get("/singlestudentlist/:id", StudentController.singlestudentlist);
router.post("/studentregister", StudentController.studentregister);
router.put("/updatestudent/:id", StudentController.updatestudent);
router.delete("/deletestudent/:id", StudentController.deletestudent);

module.exports = router;
