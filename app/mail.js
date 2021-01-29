const axios = require('axios');
const path = require('path');
const util = require(path.join(__dirname, 'lib/auth'));
const faker = require('faker');
const chalk = require('chalk');

require('dotenv-safe').config({
	path: path.join(__dirname, '../.env'),
	example: path.join(__dirname, '../.env.example')
});

function log() {
    let args = Array.prototype.slice.call(arguments);
    args.unshift(Date());
    console.log.apply(console, args);
}

function init() {
    return new Promise(function (resolve, reject) {
        util.getApplicationToken().then((token) => {
            axios.defaults.baseURL = 'https://graph.microsoft.com/v1.0';
            axios.defaults.headers = {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                'User-Agent': 'Puppy/0.3',
            };
            resolve();
        }, reason => reject(reason));
    });
}


function getUsers() {
    return new Promise(function (resolve, reject) {
        axios
            .get('/users')
            .then((res) => resolve(res.data.value.map((v) => v.mail)))
            .catch((error) => reject(error));
    });
}

function generateMessage(to) {
    let mail = {
        message: {
            subject: 'Title',
            body: { contentType: 'HTML', content: 'article' },
            toRecipients: [ { emailAddress: { address: to } } ],
        },
        saveToSentItems: 'false'
    };

    mail.message.subject =  faker.company.companyName()

    mail.message.body.content = '' +
        '<p>' + Date() + '</p>' + 
        '<img src="https://source.unsplash.com/random/300x300" alt="Wish I were there...">' +
        '<br>' + '<p>' + faker.lorem.paragraphs(3, '<br>') + '</p>';

    return mail;
}

async function sendMail(users) {

    async function broadcast(from) {
        for (let to of users) {
            if (from === to) continue;
            await axios.post(
                `/users/${from}/sendMail`,
                generateMessage(to)
            );
        }
        return true;
    }

    // node mail.js [ANY STUFF] will execute this function instead of broadcast
    async function me() {
        let u = users[Math.floor(Math.random()*users.length)];
        let master = process.env.EMAIL;
        
        await axios.post(`/users/${u}/sendMail`,generateMessage(master));
        return u;
    }

    if (process.argv.length > 2) {
        try {
            let u = await me();
            log(chalk.greenBright(u), 'done');
        } catch (error) {
            log(chalk.redBright(error));
        }
    } else {
        for (let i of users) {
            try {
                await broadcast(i);
                log(chalk.greenBright(i), 'done');
            } catch (error) {
                log(chalk.redBright(error.message));
            }
        }
    }

    return true
}

init()
    .then(getUsers)
    .then(sendMail);

