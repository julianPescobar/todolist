import express from "express";
import authorize from "./authorize.js";
const router = express.Router();
import Tarea from "../models/tarea.mjs";
router.get("/tustareas", authorize, async (req, res) => {
  const user = req.user;
  try {
    // Busca todas las tareas asociadas al usuario
    const tasks = await Tarea.find({ usuario: user._id, completado: false });

    res.render("pages/index", {
      name: user.name,
      partialBody: "taskAdd",
      tasks: tasks, // Pasa el arreglo de tareas a la vista
    });
  } catch (error) {
    console.error("Error al obtener las tareas:", error);
    res.redirect("/login");
  }
});

export default router;
