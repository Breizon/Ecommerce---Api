require('dotenv').config();

// 1. Importar el modelo
const Server = require('./models/server')

//2. Instanciar el servidor o la clase
const server = new Server()

//3. Poner a escuchar mi servidor
server.listen()