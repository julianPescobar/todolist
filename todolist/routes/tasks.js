import Tarea from "../models/tarea.mjs";
import express from "express";
import Usuario from "../models/usuario.mjs";
import authorize from "./authorize.js";
const router = express.Router();
router
  .get("/tareas/:userId", authorize, async (req, res) => {
    try {
      // Obtenemos el ID del usuario desde los parámetros de la URL
      const userId = req.params.userId;

      // Buscamos al usuario por su ID en la base de datos
      const usuario = await Usuario.findById(userId);

      // Verificamos si el usuario existe
      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Ahora que tenemos al usuario, podemos buscar todas las tareas relacionadas con ese usuario
      const tareas = await Tarea.find({ usuario: usuario._id });

      // Devolvemos las tareas encontradas como respuesta
      return res.json({ tareas });
    } catch (error) {
      console.error("Error al obtener las tareas:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  })
  .post("/tareas", authorize, async (req, res) => {
    try {
      // Obtenemos el usuario autenticado desde req.user (suponiendo que Passport.js esté configurado correctamente)
      const usuario = req.user;

      // Extraemos los datos de la tarea del cuerpo de la solicitud
      const { titulo, descripcion } = req.body;

      // Creamos una nueva tarea asociada al usuario actual
      const nuevaTarea = new Tarea({
        titulo,
        descripcion,
        completado: false,
        fechaCreacion: Date.now(),
        usuario: usuario._id, // Asociamos la tarea con el ID del usuario actual
      });

      // Guardamos la tarea en la base de datos
      await nuevaTarea.save();

      // Devolvemos la tarea creada como respuesta

      res.redirect("/tustareas");
    } catch (error) {
      console.error("Error al crear la tarea:", error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  })
  .patch("/tareas/:taskId/done", authorize, async (req, res) => {
    try {
      const taskId = req.params.taskId;
      // Obtén el ID de la tarea desde los parámetros de la URL

      // Busca la tarea por su ID en la base de datos y actualiza el campo "completado" a true
      const tareaActualizada = await Tarea.findByIdAndUpdate(
        taskId,
        {
          completado: true,
          fechaCompletado: Date.now(),
        },
        { new: true } // Esto asegura que devuelve la tarea actualizada
      );

      // Verifica si la tarea se encontró y se actualizó correctamente
      if (!tareaActualizada) {
        return res
          .status(404)
          .json({ message: "Tarea no encontrada o no se pudo actualizar." });
      }

      // Redirige de vuelta a la página de tareas
      res.redirect("/tustareas");
    } catch (error) {
      console.error("Error al marcar la tarea como completada:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  })
  .get("/tareas/:taskId/edit", authorize, async (req, res) => {
    const taskId = req.params.taskId;
    const tareaAEditar = await Tarea.findById(taskId);
    if (!tareaAEditar) {
      return res
        .status(404)
        .json({ message: "Tarea no encontrada o no se pudo editar." });
    }
    res.render("pages/index", {
      task: tareaAEditar,
      partialBody: "taskEdit",
    });
  })
  .patch("/tareas/:taskId/edit", authorize, async (req, res) => {
    const usuario = req.user;
    const { titulo, descripcion } = req.body;
    const taskId = req.params.taskId;
    const tareaActualizada = await Tarea.findByIdAndUpdate(
      taskId,
      {
        titulo: titulo,
        descripcion: descripcion,
      },
      { new: true } // Esto asegura que devuelve la tarea actualizada
    );

    if (!tareaActualizada) {
      return res
        .status(404)
        .json({ message: "Tarea no encontrada o no se pudo editar." });
    }
    res.redirect("/tustareas");
  })
  .delete("/tareas/:taskId/delete", authorize, async (req, res) => {
    const taskId = req.params.taskId;
    const tareaActualizada = await Tarea.findByIdAndDelete(taskId);

    if (!tareaActualizada) {
      return res
        .status(404)
        .json({ message: "Tarea no encontrada o no se pudo editar." });
    }
    res.redirect("/tustareas");
  });

export default router;
