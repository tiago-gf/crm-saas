import express from "express";

const router = express.Router();

// rota principal
router.get("/", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/crm/dashboard");
  }
  res.redirect("/login");
});

router.get("/login", (req, res) => {
  if (req.session?.user) {
    return res.redirect("/crm/dashboard");
  }
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

export default router;