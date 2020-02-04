const sgMail = require('@sendgrid/mail');
// aqui definimos nuestra API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// creamos una funcion para enviar un email a los nuevos usuarios
const sendWelcomeEmail = (email, name) => {
    // aqui enviamos el email, y especificamos todo sobre este email para enviar
    sgMail.send({
        to: email,
        from: 'jmendozacarrasco@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jmendozacarrasco@gmail.com',
        subject: 'Cancelation Email',
        text: `Vuelve pronto ${name}, esperemos darte un mejor servicio la siguiente`
    });
};

module.exports = {
    sendWelcomeEmail: sendWelcomeEmail,
    sendCancelationEmail: sendCancelationEmail
}