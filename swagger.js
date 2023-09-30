import swaggerJSDoc from "swagger-jsdoc";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API todolist",
      version: "1.0.0",
      description: "Endpoints que expone",
    },
  },
  // Path para encontrar los archivos con anotaciones Swagger
  apis: ["./routes/*"], // Reemplaza con la ubicación de tus rutas
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
