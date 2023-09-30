// Imports
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import GoogleStrategy from "passport-google-oauth20";
import Usuario from "./models/usuario.mjs";
import loginRoutes from "./routes/login.js"; // Importa las rutas de login
import signupRoutes from "./routes/signup.js";
import logoutRoutes from "./routes/logout.js";
import dashboardRoutes from "./routes/dashboard.js";
import preferencesRoutes from "./routes/preferences.js";
import rootRoutes from "./routes/root.js";
import taskRoutes from "./routes/tasks.js";

// Creamos APP Express
const app = express();
// Aplicamos Swagger
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//Configuramos Dotenv
dotenv.config();
// Configura EJS como motor de plantillas
app.set("view engine", "ejs");
// Servimos archivos estaticos desde public
app.use(express.static("public"));
// Habilitamos Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
// Activamos Helmet y le permitimos solo algunas cosas de estilos
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "cdn.jsdelivr.net",
          "code.jquery.com",
          "stackpath.bootstrapcdn.com",
        ],
        // Aquí puedes agregar otros recursos permitidos según tus necesidades
      },
    },
    // Configura las cabeceras de caché para evitar el almacenamiento en caché
    // Estas cabeceras evitan que las páginas se almacenen en caché en el navegador
    // y se vuelvan a cargar desde el servidor después de cerrar sesión.
    cacheControl: {
      noCache: true,
      noStore: true,
      mustRevalidate: true,
      proxyRevalidate: true,
    },
  })
);
// Logeamos eventos con Morgan
app.use(morgan("combined"));
// Conectamos a nuestro MongoDB con Mongoose
mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conexión exitosa a MongoDB");
  })
  .catch((error) => {
    console.error("Error de conexión a MongoDB:", error);
  });
// Middlewares de sesión
app.use(
  session({
    secret: process.env.SECRETOSESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 60000, // La sesion dura media hora
    },
  })
);
// Inicializamos passport, strategies y session
app.use(passport.initialize());
app.use(passport.session());
passport.deserializeUser(async function (id, done) {
  try {
    const user = await Usuario.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APPURL}:${process.env.PUERTO}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Busca un usuario existente por su identificador de Google
        let user = await Usuario.findOne({ googleId: profile.id });
        // Si se encuentra un usuario, simplemente devuelve ese usuario
        if (user) {
          return done(null, user);
        }
        const newUser = new Usuario({
          googleId: profile.id,
          name: `${profile.displayName}`,
          isVerified: true,

          // Otros campos que quieras asignar al nuevo usuario
        });

        user = await newUser.save();

        // Devuelve el nuevo usuario creado
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

// Empleamos un metodo para overridear POST por PATCH/DELETE
app.use(methodOverride("_method"));
// Endpoints
app.use(loginRoutes);
app.use(signupRoutes);
app.use(logoutRoutes);
app.use(rootRoutes);
app.use(dashboardRoutes);
app.use(preferencesRoutes);
app.use(taskRoutes);
// TODO: Crear endpoints para 'olvide mi clave!'
// Empezamos a escuchar
let puerto = process.env.PORT || 8000;
app.listen(puerto, () => {
  console.log(`Escuchando en puerto ${puerto}`);
});
