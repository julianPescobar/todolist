import { name } from "ejs";
import { Schema, model } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const usuarioSchema = new Schema({
  //_id: Schema.Types.ObjectId, // Campo explícito para el ID
  name: {
    type: String,
    required: true,
    unique: false,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  verificationCode: {
    type: String,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});
// Utiliza passportLocalMongoose para simplificar la autenticación local
usuarioSchema.plugin(passportLocalMongoose, {
  usernameField: "email", // Usa el campo 'email' para el inicio de sesión
});

// Método para hashear la contraseña antes de guardarla en la base de datos
usuarioSchema.methods.hashPassword = async function () {
  this.password = await bcrypt.hash(this.password, 10);
};

// Método para verificar la contraseña ingresada por el usuario
usuarioSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
export default model("Usuario", usuarioSchema);
