const express = require("express");
var cfenv = require("cfenv");
const app = express();
const rp = require('request-promise');
const xsenv = require("@sap/xsenv");
const port = process.env.PORT || 4000;

var vcapLocal;
try {
  vcapLocal = require("./vcap-local.json");  
} catch (e) {
}
const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {};

var dest_service = cfenv.getAppEnv(appEnvOpts).getService("Northwind-destination").credentials;
const sUaaCredentials = dest_service.clientid + ':' + dest_service.clientsecret;
const sDestinationName = 'NorthWind';
app.get("/", (req, res)=> {
    res.send(dest_service.url);
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