import express from "express";
import authorize from "./authorize.js";
const router = express.Router();
router.get("/logout", authorize, function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

export default router;
