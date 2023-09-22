import express from "express";
import authorize from "./authorize.js";
const router = express.Router();
router.get("/", authorize, (req, res) => {
  // Verifica si el usuario está autenticado
  res.redirect("/tustareas");
});

export default router;
