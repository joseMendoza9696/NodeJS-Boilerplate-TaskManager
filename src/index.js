// cargamos el archivo que contiene las otras configuraciones app.js
const app = require('./app');
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is on port ${port}`);
}); 
