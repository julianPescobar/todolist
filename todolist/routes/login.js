import express from "express";
import passport from "passport";
import Usuario from "../models/usuario.mjs";
import bcrypt from "bcrypt";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: html
 *   description: Endpoints que devuelven HTML
 */
/**
 * @swagger
 * tags:
 *   name: json
 *   description: Endpoints que devuelven JSON
 */
/**
 * @swagger
 * /login:
 *   get:
 *     summary: Renderiza la pagina de login al cliente
 *     tags:
 *      - html
 *     responses:
 *       200:
 *         description: Respuesta exitosa.
 *       500:
 *         description: Error del servidor.
 */
router
  .get("/login", (req, res) => {
    res.render("pages/login", { message: "" });
  })
/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *      - html
 *     summary: Inicia una sesion
 *     description: Inicia sesión con un usuario y contraseña. Devuelve HTML
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del usuario.
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *       400:
 *         description: Datos de inicio de sesión inválidos.
 */
  .post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    try {
      // Buscar al usuario por su correo electrónico en la base de datos
      const user = await Usuario.findOne({ email });

      // Verificar si el usuario existe
      if (!user) {
        return res.render("pages/login", { message: "Usuario no encontrado" });
      }
      // Comparar la contraseña proporcionada con la contraseña almacenada en la base de datos
      const isPasswordValid = await bcrypt.compare(password, user.password);

      // Verificar si la contraseña es válida
      if (!isPasswordValid) {
        return res.render("pages/login", { message: "Credencial Inválida" });
      }

      // Autenticación exitosa: Iniciar sesión del usuario
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Redirigir al usuario después de un inicio de sesión exitoso
        return res.redirect("/tustareas");
      });
    } catch (error) {
      console.error("Error al intentar iniciar sesión:", error);
      // Manejo de errores
      return res.render("pages/login", {
        message: "Error al intentar iniciar sesión",
      });
    }
  });

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

export default router;
