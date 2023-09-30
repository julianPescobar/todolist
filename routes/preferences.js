import express from "express";
import authorize from "./authorize.js";
const router = express.Router();
router.get("/preferencias", authorize, (req, res) => {
  const user = req.user;
  res.render("pages/index", {
    user: user,
    partialBody: "preferences",
  });
});

export default router;
