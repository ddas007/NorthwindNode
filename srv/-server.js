const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const vcapFile = "default-services.json";

const rp = require('request-promise');
const xsenv = require("@sap/xsenv");
const cfenv = require('cfenv');
//const dest_service = xsenv.getServices({ destination: { name: 'Northwind-destination-service' } });
//const dest = cfenv.getAppEnv().getService("Northwind-destination");
//const dest_service = dest.credentials;
console.log(cfenv.getAppEnv({ "vcapFile": vcapFile }).getServices() );
// const dest_service = xsenv.getServices({ destination: { name: 'Northwind-destination-service' } }).destination[0].credentials;

const sUaaCredentials = dest_service.clientid + ':' + dest_service.clientsecret;
const sDestinationName = 'NorthWind';
app.get("/", (req, res)=> {
    res.send(dest_service.url);
    //res.send(JSON.parse(dest_service.url));
});

app.get("/Products", (req, res) => {
    return rp({
        uri: dest_service.url + "/oauth/token",
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(sUaaCredentials).toString('base64'),
            'Content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            'client_id': dest_service.clientid,
            'grant_type': 'client_credentials'
        }
    }).then((data) => {            
            const token = JSON.parse(data).access_token;
            return rp({
                uri: dest_service.uri + '/destination-configuration/v1/destinations/' + sDestinationName,
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
        }).then((data) => {
            const oDestination = JSON.parse(data);
            const url = oDestination.destinationConfiguration.URL + "/Products?$format=json";
            return rp({
                method: 'GET',
                uri: url,
                headers: {
                    'Content-type': 'application/json'
                }
            });
        }).then((result) => {
            console.log(result);
            res.send(result);
        })
        .catch((error) => {
            res.send(error);
            console.log(error);
        })
});


app.listen(port, function () {
    console.log(port);
})