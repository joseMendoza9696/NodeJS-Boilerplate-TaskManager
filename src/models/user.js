const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const Task = require('./task');

// creamos un nuevo esquema para nuestra base de datos
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true // trim es utilizado para quitar los espacios
    }, 
    email: {
        type: String,
        // indica que este email debe ser unico en toda la DB
        unique: true,
        required: true,
        trim: true,
        lowercase: true, // lowercase coloca el nombre en minusculas
        validate(value) {
            // aqui utilizamos el paquete validator para comprobar que es un email
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    age: {
         type: String,
         default: 0,
         // con validate podemos poner condiciones a los datos
         validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number');
            }
         }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase() === 'password') {
                throw new Error('Password must not contain password string');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        // nos permitira almacenar el archivo binario de nuestra imagen en la DB
        type: Buffer
    }
},{
    // le agregamos la fecha y hora que ha sido creada, y modificada
    timestamps: true
});

// el virtual nos ayuda a relacionar a los usuarios con las tareas
userSchema.virtual('tasks',{
    ref: 'Task',
    // el local field es el id del user que hace la relacion entre las tareas y el usuario
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject()
    
    // borramos el password, el array de tokens, y el avatar en la respuesta al cliente
    // asi ocultamos el password y los tokens, y no cargamos con mas info con el avatar
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    // user tiene el valor del Schema
    const user = this;
    // _id es la data q estara embebida en mi token
    // el segundo parametro es una llave secreta q puede ser culaquier cosa
    const token = jwt.sign( { _id: user._id.toString() }, process.env.JWT_SECRET );

    // dentro de los tokens del schema concatenamos el token creado
    user.tokens = user.tokens.concat({ token: token });
    // guardamos en la DB
    await user.save();

    // retornamos el token generado
    return token;
}

// aqui validamos el login para nuestro usuario
// recibimos el email y el password y comparamos con la DB
userSchema.statics.findByCredentials = async (email, password) => {
    // buscamos al usuario por su email y verificamos que sea el mismo q mando
    const user = await User.findOne({ email });
    if ( !user ) {
        // si no existe el usuario nos lanza un error
        throw new Error('Unable to login!');
    }

    // verificamos si su password es el correcto
    const isMatch = await bcrypt.compare( password, user.password );
    if ( !isMatch ) {
        // en caso de que este mal su password lanzamos un error
        throw new Error('Unable to login!');
    }

    // retornamos el usuario una vez verificado todo
    return user;
}

// hacemos el hasheo de nuestro password antes de guardarlo
// pre es para hacer un proceso antes de guardar en nuestra DB
// y post es una accion despues de guardar
userSchema.pre('save', async function(next) {
    const user  = this

    // preguntamos si el password ha sido actulizado o creado
    // y cumpliendo esta condicion hasheamos el password
    if ( user.isModified('password') ) {
        user.password = await bcrypt.hash( user.password, 8 );
    }
    // next se lo llama cuando finalizamos esta funcion
    next();
});

// delete user's tasks when user is removed
userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({ owner: user._id });

    next();
});

// creamos el modelo para nuestra DB
const User = mongoose.model('User', userSchema);

module.exports = User;
