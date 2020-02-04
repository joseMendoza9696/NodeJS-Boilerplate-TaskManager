const mongoose = require('mongoose');

// aqui hacemos toda la configuracion de mongoose
// en la url debe estar el nombre de nuestra base de datos .../task-manager-api
mongoose.connect( process.env.MONGODB_URL , {  
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false // elimina el warning de DeprecationWarning
});

