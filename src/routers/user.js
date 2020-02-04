const express = require('express');
// creamos el router para todas nuestras peticiones
const router = new express.Router();
// importamos el middleware que hemos creado
const auth = require('../middleware/auth');
const User = require('../models/user');
// importamos multer que nos servira subir archivos a nuestro servidor
const multer = require('multer');
// con sharp podemos editar nuestro archivos, formato, tamano, etc...
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

// peticion CREATE para users
router.post('/users', async (req, res) => {
    // req.body es la data enviada desde el cliente 
    const user = new User(req.body);
    try {
        await user.save();
        // al nuevo usuario le enviamos un email de bienvenida. automaticamente
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }

});
// post para verificar el login de nuestro usuario
router.post('/users/login', async (req, res) => {
    try {
        
        const user = await User.findByCredentials( req.body.email, req.body.password );
        // aqui generamos el token para el usuario
        const token = await user.generateAuthToken();

        res.send({ user , token });
    } catch (error) {
        res.status(400).send();
    }
});

// salirnos de una cuenta individual, solo de un dispositivo
router.post('/users/logout', auth, async (req,res) => {
    try {
        // buscamos un solo token ya que podemos tener varios
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req,res) => {
    try {
        // hacemos logout a todos los tokens
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

// peticion READ para users
// al medio esta nuestro middleware 
// el middleware se ejecuta antes del async
router.get('/users/me', auth ,async (req,res) => {
    res.send(req.user);
});

// peticion UPDATE users
router.patch('/users/me', auth, async (req,res) => {
    // convierte los que mandamos en el body a un arreglo de los nombres de los campos como: allowedUpdates
    const updates = Object.keys(req.body); 
    // arreglo de los campos que el cliente puede cambiar
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    // con los dos arreglos anteriores, comparamos cada uno de ellos si devuelve true entonces todo esta bien 
    // en caso de devolver falso no sale un error: Invalid updates 
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {
        // con un foreach actulizamos la propiedad con lo que mandamos
        // con esto nos aseguramos de que esta pasando por nuestro middleware 
        // que sirve para hashear nuestro password
        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        // finalmente guardamos la actualizacion
        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// peticion DELETE para users
router.delete('/users/me', auth, async (req,res) => {
    try {
        await req.user.remove();
        // aqui enviamos un email automatico, cuando el usuario borre su cuenta
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// creamos la instancia de multer y hacemos su configuracion
const upload = multer({
    // definimos los limites para subir archivos
    limits: {
        // el limite del tamano del archivo sera de 1MB
        fileSize: 1000000
    },
    // aqui vamos a limitar a los archivos por su extension(jpg, jpeg, png)
    fileFilter(req, file, cb) {
        // verificamos si nuestro archivo NO es un jpg, jpeg, png
        // en match() utilizamos regular expressions
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            // mandamos un mensaje cuando exista un error
            return cb(new Error('Please upload a image document.'));
        }
        // enviamos este mensaje satisfactorio si el archivo es pdf
        cb(undefined, true);      
    }
});
// POST para subir el profile del usuario
// al subir un archivo node js buscara el archivo llamado avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
   // aqui editamos nuestra imagen, le damos diferente formato, y le cambiamos los tamanos
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    // guardamos en la DB
    await req.user.save();
    res.send('Avatar recieved');
},(error, req, res, next) => {
    // retornamos un JSON con el error correspondiente
    res.status(400).send({ error: error.message });
});

// esta ruta es para eliminar la imagen de perfil de nuestro usuario
router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Avatar deleted');
});
// esta ruta es para ver la imagen de perfil (avatar) del usuario
router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        // si no existe el usuario o si el usuario no tiene avatar
        if (!user || !user.avatar) {
            throw new Error();
        }
        // hacemos las configuraciones previas de la imagen
        res.set('Content-Type', 'image/png');
        // mandamos como respuesta la imagen
        res.send(user.avatar);

    } catch (error) {
        res.status(404).send();
    }
});

module.exports = router;