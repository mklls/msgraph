const axios = require('axios');
const path = require('path');
const util = require(path.join(__dirname, 'lib/auth'));
const faker = require('faker');
const fs = require('fs');
const chalk = require('chalk');

require('dotenv-safe').config({
	path: path.join(__dirname, '../.env'),
	example: path.join(__dirname, '../.env.example')
});

faker.locale = 'zh_CN'; //en_US

const quote = fs
    .readFileSync(path.join(__dirname, '/assets/quote.txt'))
    .toString()
    .split('\n');
const characters = fs
    .readFileSync(path.join(__dirname, '/assets/hans.txt'))
    .toString()
    .split('\n');
const skills = fs
    .readFileSync(path.join(__dirname, '/assets/skill.txt'))
    .toString()
    .split('\n');

const randomName = () => faker.name.lastName() + faker.name.firstName();
const randomQuote = () => quote[parseInt(Math.random() * quote.length - 1, 10)];
const randomSkill = () => {
    let suffix = skills[parseInt(Math.random()*skills.length, 10) - 1];
    let length = parseInt(Math.random() * 3 + 1, 10);
    let temp = ''
    for (let i = 0; i < length; i++) {
        temp += characters[parseInt(Math.random() * characters.length, 10) - 1];
    }

    return temp + suffix;
}

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
                'User-Agent': 'Puppy/0.2',
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
        saveToSentItems: 'false',
        
    };

    mail.message.subject =  randomName() + ' ' + 
        faker.hacker.verb() + ' ' +
        randomSkill();

    mail.message.body.content = '' +
        '<p><strong>' + randomQuote() + '</strong></p>' +
        '<strong>' + Date() + '</strong>' + 
        '<br>' +
        '<img src="https://source.unsplash.com/random/200x200" alt="Wish I were there...">' +
        '<p>' + faker.lorem.paragraphs(3, '<br>') + '</p>' + 
        '<br>' +
        '<strong>' + randomName()  + '</strong>'+ 
        '在' + faker.address.city() + '找到' + 
        '<strong>' + randomSkill() + '</strong>';

    return mail;
}

async function sendMail(users) {

    async function broadcast(from) {
        for (let to of users) {
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

