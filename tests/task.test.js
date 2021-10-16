const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { userOneId, userTwoId, userOne, userTwo, taskOne, taskTwo, taskThree, setupDataBase } = require('./fixtures/db');

// esta funcion se ejecuta antes que los tests se ejecuten
beforeEach( setupDataBase );

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBe(false);
});

test('Should get all tasks from user two', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    expect(response.body.length).toEqual(2);
});

test('First task should not be deleted by user two', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404);
    const task = await Task.findById(taskOne._id);
    // nos aseguramos de que esa tarea sigue en la base de datos
    expect(task).not.toBeNull();
});