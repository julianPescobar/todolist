import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import Usuario from "./models/usuario.mjs";
import Tarea from "./models/tarea.mjs";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import methodOverride from "method-override";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js"; // Reemplaza con la ubicación de tu configuración
import GoogleStrategy from "passport-google-oauth20";
import axios from "axios";
// Creamos APP Express
const app = express();
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Configuramos Dotenv
dotenv.config();
// Configura EJS como motor de plantillas
app.set("view engine", "ejs");

// Sirve archivos estaticos desde public
app.use(express.static("public"));

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
      maxAge: 30 * 60 * 1000, // La sesion dura media hora
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
// Middleware de authentication
// Esto hace que por cada request donde inyectemos esta funcion, valide si tiene
// una sesion valida activa, en caso de no tenerlo, redirige a login.
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
      callbackURL: "http://localhost:8000/auth/google/callback",
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

/*
===============ENDPOINTS==================
 */

// ENDPOINTS LOGIN

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
app
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

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

// ENDPOINTS REGISTRARSE
app
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

// ENDPOINTS DESLOGUEARSE
app.get("/logout", authorize, function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// ENDPOINT CUANDO SE ACCEDE AL RAIZ
app.get("/", authorize, (req, res) => {
  // Verifica si el usuario está autenticado
  res.redirect("/tustareas");
});

// ENDPOINT PANEL PRINCIPAL
app.get("/tustareas", authorize, async (req, res) => {
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

// ENDPOINT PREFERENCIAS
app.get("/preferencias", authorize, (req, res) => {
  const user = req.user;
  res.render("pages/index", {
    user: user,
    partialBody: "preferences",
  });
});

// ENDPOINTS TAREAS
app
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

// TRAEMOS EL PUERTO Y ESCUCHAMOS
let puerto = process.env.PORT || 8000;
app.listen(puerto);
console.log(`Escuchando en puerto ${puerto}`);
console.log(`http://localhost:${puerto}`);
