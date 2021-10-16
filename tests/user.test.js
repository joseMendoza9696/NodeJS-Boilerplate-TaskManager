const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDataBase } = require('./fixtures/db');


// esta funcion se ejecuta antes que los tests se ejecuten
beforeEach( setupDataBase );


test('Should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'jose',
        email: 'j@gmail.com',
        password: 'holabebe'
    }).expect(201);

    // assert that the database was changed correctly
    // consultamos a la base de datos sobre el nuevo usuario
    const user = await User.findById( response.body.user._id );
    // verificamos que el nuevo usuario no es nulo
    expect(user).not.toBeNull();

    // Assertions about the response
    // verificamos que este con los datos correctos
    expect(response.body).toMatchObject({
        user: {
            name: 'jose',
            email: 'j@gmail.com'
        },
        token: user.tokens[0].token
    });
    // verificamos que nuestro password no este en plano texto
    // el password debe estar cifrado
    expect(user.password).not.toBe('holabebe');
});

test('Should login exisiting user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(userOneId);
    expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexisting user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: '123412341234'
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    // verificamos que realmente se borro el usuario
    expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    
    const user = await User.findById(userOneId);
    expect( user.avatar ).toEqual( expect.any(Buffer) );
});

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'michael'
        })
        expect(200);
    
    const user = await User.findById(userOneId);

    expect(user).not.toEqual(userOne);
    
});

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'uber'
        })
        expect(400);
});
