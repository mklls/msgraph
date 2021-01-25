const axios = require('axios');

function toUrlEncoded (obj) {
    return Object.keys(obj)
        .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
        .join('&');
}

function getApplicationToken() {
    let tenantId = process.env.TENANT_ID;
    let data = {
        grant_type: 'client_credentials',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default'
    };
    
    return new Promise(function (resolve, reject) {
        axios({
            url: `/${tenantId}/oauth2/v2.0/token`,
            baseURL: 'https://login.microsoftonline.com',
            data: toUrlEncoded(data),
            responseType: 'json'
        }).then(
            (res) => resolve(res.data.access_token),
            (reason) => reject(reason)
        );
    });
}

module.exports = { getApplicationToken };