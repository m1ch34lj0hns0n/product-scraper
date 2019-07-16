'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const mailgun = require('mailgun-js');
const sites = require('./sites.json');

module.exports.scraper = async (event, context, callback) => {
    console.log(event);
    let results = [];
    let table = [];

    for (let i = 0; i < sites.length; i++) {
        let result = await scraper(sites[i]);
        results.push(result);
    }

    for (let j = 0; j < results.length; j++) {
        table.push('<tr><td><a href="' + results[j].url + '">' + results[j].site + '</a></td><td>' + results[j].price + '</td></tr>');
    }

    const response = await send('<table><tr><th>Shop</th><th>Price</th></tr>' + table.join('') + '</table>');
    return callback(null, response);
};

class Model {
    constructor(site, url, price) {
        this.url = url;
        this.site = site;
        this.price = this.formatPrice(price);
    }

    formatPrice(price){
        return parseFloat(price.replace(/[^0-9.-]+/g,""));
    }
};

const scraper = store => {
    return axios.get(store.url).then(response => {
        try {
            const $ = cheerio.load(response.data);
            return new Model(
                store.name,
                store.url,
                eval(store.query)
            );
        } catch (error) {
            console.log(error);
        }
    }).catch(error => console.log(error));
};

const send = async html => {
    const mg = new mailgun({apiKey: process.env.EMAIL_SERVICE_KEY, domain: process.env.EMAIL_SERVICE_DOMAIN});
    return mg.messages().send({
        from: 'Mailgun Sandbox <postmaster@sandboxd6825d339c734a5cb681f1e2b63a41fa.mailgun.org>',
        to: process.env.EMAIL_SERVICE_TO,
        subject: 'Vans prices',
        html
    }).then(data => {
        return data;
    }).catch(error => {
        return error;
    });
};