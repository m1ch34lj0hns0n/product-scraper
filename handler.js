'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const mailgun = require('mailgun-js');
const sites = require('./sites.json');

module.exports.scraper = async (event, context, callback) => {
    
    const resultsArray = sites.map(item => {
        let result = scraper(item);
        return result;
    });

    const results = await Promise.all(resultsArray);
    const table = results.map(item => '<tr><td><a href="' + item.url + '">' + item.site + '</a></td><td>' + item.price + '</td></tr>');
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
    return axios.get(store.url, {
        headers: {'User-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36'}
    }).then(({status, data}) => {
        if (status === 200) {
            try {
                const $ = cheerio.load(data);
                return new Model(
                    store.name,
                    store.url,
                    eval(store.query)
                );
            } catch (error) {
                console.log(error);
            }
        }
        return new Model(
            store.name,
            store.url,
            'error'
        );
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