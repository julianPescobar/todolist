import passport from "passport";
import LocalStrategy from "passport-local";
import Usuario from "../models/usuario.mjs";
function authorize(req, res, next) {
  // Utiliza el método isAuthenticated de Passport.js para verificar si el usuario está autenticado
  if (req.isAuthenticated()) {
    // Si el usuario está autenticado, continúa con la solicitud
    return next();
  } else {
    // Si el usuario no está autenticado, redirige a la página de inicio de sesión
    res.redirect("/login");
  }
}
// Configuración de Passport.js
passport.use(new LocalStrategy(Usuario.authenticate()));
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

export default authorize;
