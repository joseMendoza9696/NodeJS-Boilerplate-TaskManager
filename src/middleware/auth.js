const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        // aqui recibimos las cabeceras de la peticion
        // replace('lo q vamos a reemplazar', 'con lo q vamos a reemplazar')
        const token = req.header('Authorization').replace('Bearer ','');
        // aqui hacemos la validacion del token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // buscamos por id al usuario con el token proporcionado
        const user = await User.findOne({ _id: decoded._id, 'tokens.token':token });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        // hacemos saber que ya termino nuestra funcion de middleware
        next();

    } catch (error) {
        res.status(401).send({error: 'Please authenticate.'});
    }

}

module.exports = auth;