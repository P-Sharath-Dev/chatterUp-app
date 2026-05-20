import express from "express";

const router = express.Router();

//default route
router.get("/", (req, res) => {
  res.render("index"); // rendering index.ejs file
});

export default router;
