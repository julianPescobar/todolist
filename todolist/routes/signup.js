import express from "express";
import Usuario from "../models/usuario.mjs";
import bcrypt from "bcrypt";
const router = express.Router();
// TODO: Hacer que al registrarse envie un mail con alguna clave o link para validar la cuenta
router
  .get("/signup", (req, res) => {
    res.render("pages/signup", { message: "" });
  })
  .post("/signup", async (req, res) => {
    try {
      // Captura los datos del formulario
      const { name, email, password } = req.body;
      const user = await Usuario.findOne({ email });
      if (user) {
        return res.render("pages/signup", {
          message: "Este email ya fue registrado",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      // El segundo argumento es el número de rondas de sal

      // Crea un nuevo usuario
      const newUser = new Usuario({ name, email, password: hashedPassword });

      // Guarda el usuario en la base de datos
      await newUser.save();

      // Redirige al usuario a una página de éxito o a donde prefieras
      res.redirect("/login");
    } catch (error) {
      // Manejo de errores, por ejemplo, si el correo electrónico ya existe en la base de datos
      console.error("Error al registrar el usuario:", error);

      res.redirect("/signup"); // Puedes redirigir a la página de registro nuevamente con un mensaje de error si es necesario
    }
  });
export default router;
