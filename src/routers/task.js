const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// peticion CREATE para tasks
router.post('/tasks',auth, async (req,res) => {
    // definimos que la nueva tarea sera del usuario autenticado
    const task = new Task({
        ...req.body,
        // definimos que esta tarea pertenece a un usuario
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }

});

// peticion READ para tasks
router.get('/tasks', auth, async (req,res) => {
    
    // creamos un objeto vacio para nuestro match y sort
    const match = {};
    const sort = {};

    // verificamos si el valor de completed ha sido mandado desde el cliente
    if (req.query.completed) {
        // si el string es true entonces match.completed es true, de lo contrario es falso
        // hacemos esto porque lo que recibimos de la url es un string
        // necesitamos convertirlo a boolean
        match.completed = req.query.completed === 'true';
    }

    // verificamos si sortBy es mandado por la URL desde el cliente
    if (req.query.sortBy) {
        // separamos el valor cuando encuentre el caracter :
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
        
    try {
        // busca las tareas que pertenezcan al usuario logueado
        await req.user.populate({
            // vamos a mostrar las tareas
            path: 'tasks',
            // devuelve las tareas segun lo que solicitemos, completadas o no completadas
            match: match,
            // aqui realizamos la paginacion
            options: {
                // definimos el limite de tareas devueltas al cliente
                limit: parseInt(req.query.limit),
                // skip es el numero de cuantos nos vamos a saltar desde la primera tarea
                skip: parseInt(req.query.skip),
                // aqui hacemos la clasificacion de las tareas
                // vamos a mostrar de forma descendente(-1) o ascendente(1)
                // podemos elegir por: createdAt, updatedAt, completed, etc...
                sort: sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(400).send(error);
    }
    
});
// leer un task de un usuario
router.get('/tasks/:id', auth, async (req,res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});
// peticion UPDATE tasks
router.patch('/tasks/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description','completed'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid Updates!'})
    }

    try {        
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => {
            task[update] = req.body[update];
        });
        await task.save();

        res.send(task);
    
    } catch (error) {
        res.status(400).send(error);
    }

});
// peticion DELETE para tasks
router.delete('/tasks/:id', auth,async(req,res) => {
    
    try {
        const task =  await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;