import { Schema, model } from "mongoose";

const tareaSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    unique: false,
  },
  descripcion: {
    type: String,
    required: true,
    unique: false,
  },
  completado: {
    type: Boolean,
    required: false,
    unique: false,
  },
  fechaCreacion: {
    type: Date,
    required: false,
    unique: false,
  },
  fechaCompletado: {
    type: Date,
    required: false,
    unique: false,
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
  },
});

export default model("Tarea", tareaSchema);
