const express = require('express');
require('./db/mongoose'); // importa todo el archivo y es ejecutado
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// hace el parse de data enviada del cliente en json se convierta en objeto para nuestro server
app.use(express.json());
// registramos nuestro router para poder usarlo
app.use(userRouter);
app.use(taskRouter);    

app.listen(port, () => {
    console.log(`Server is on port ${port}`);
}); 
