const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const auth = require(path.join(__dirname, '/lib/auth'));

require('dotenv-safe').config({
        path: path.join(__dirname, '../.env'),
        example: path.join(__dirname, '../.env.example')
});

function log() {
    let args = Array.prototype.slice.call(arguments);
    args.unshift(Date());
    console.log.apply(console, args);
}

// common APIs
const common = [
    '/groups',
    '/domains',
    '/sites/root/drives',
    '/sites?search=123',
    '/sites/root/sites',
    '/sites/root/contentTypes',
    '/sites/root/lists',
    '/users/delta?$select=displayName,givenName,surname',
    '/applications?$count=true'
];

// need post with extra data
const REST = [
    '/',
    '/messages',
    '/events',
    '/drive/root',
    '/calendars',
    '/licenseDetails',
    '/drive/root/children',
    '/oauth2PermissionGrants',
    '/events?$select=attendees,start,end,location'
];

async function batching(batching, code) {
    for (let r of batching) {
        try {
            let res = await axios.post('/$batch', r.batch);
            for (let i of res.data.responses) {
                if (i.status != code) {
                    log(chalk.bold(r.user), chalk.redBright('error'), i.body.error.message);
                }
            }
            log(chalk.bold(r.user), chalk.blueBright('done'));
        } catch (error) {
            log(chalk.bold(r.user), chalk.redBright(error.message));
        }
    }
    return true;
}

function init() {
    return new Promise (function (resolve, reject) {
        auth.getApplicationToken().then((token) => {
            axios.defaults.baseURL = 'https://graph.microsoft.com/v1.0';
            axios.defaults.headers = {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
                'User-Agent': 'Puppy/0.1',
            };
            resolve();
        }, reason => reject(reason));
    });
}

function getUsers() {
    console.log(chalk.cyanBright('-----------------------------------'));
    return new Promise(function (resolve, reject) {
        axios
            .get('/users')
            .then((res) => resolve(res.data.value.map((v) => v.id)))
            .catch(error => reject(error));
    });
}

async function active(users) {

    let jobs = users.map(v => {
        let batch = { requests: [] };

        for (let i = 0; i < REST.length; i++) {
            batch.requests.push({
                id: i,
                method: 'GET',
                url: `/users/${v}${REST[i]}`,
            });
        }
        return {user: v, batch: batch};
    });

    log(chalk.blue('Application information'));
    await batching([{
        user: 'staff@xxx.cf', // any string in order to keep with api standard
        batch: {
            requests: common.map((v, i) => {
                return {
                    id: i,
                    method: 'GET',
                    url: v,
                };
            }),
        },
    }], 200);

    log(chalk.blue('profile'));
    await batching(jobs, 200);

    return users;
}

async function getMessages(users) {
    let jobs = []
    log(chalk.blue('fetch messages'));
    let us = await axios.get('/users');
    us = us.data.value.map((v) => v.mail);
    let filter = '$filter=';

    for (let i = 0; i < us.length; i++) {
        filter += `from/emailAddress/address eq '${us[i]}' `;
        
        if (i != us.length-1) filter += 'or ';
    }

    for (let u of users) {
        let res = await axios.get(`/users/${u}/mailFolders/inbox/messages?` + filter);
        let batch = { requests: [] };
        let temp = Array.from(res.data.value, (v) => v.id);
            temp = temp.slice(0, 4);
        if (temp.length === 0) continue;

        for (let i = 0; i < temp.length; i++) {
            batch.requests.push({
                id: i,
                method: 'DELETE',
                url: `/users/${u}/messages/${temp[i]}`
            });
        }

        jobs.push({
            user: u, 
            batch: batch 
        });
    }
    return jobs;
}
// TODO 
// read messages from inbox
async function readMessages(){}

async function deleteMessages(jobs) {
    log(chalk.blue('removing messages'))
    await batching(jobs, 204);
    console.log(chalk.yellowBright('-----------------------------------'));
}


init()
    .then(getUsers)
    .then(active)
    .then(getMessages)
    .then(deleteMessages)

