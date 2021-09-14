const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const { Client } = require('pg');
const excel = require("exceljs");

require('dotenv').config();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const connectionString = process.env.DATABASE_URL;

app.get('/', (req, res) => {
  res.send('Welcome to Battery Data Logger.');
});

app.post('/voltages', (req, res) => {

  if (req.body.voltage_array && req.body.voltage_array.length == 0) {
    res.status(400).send({
      error: "No voltage array items"
    });
  } else {
    var batch_datetime = req.body.batch_datetime;
    var voltage_array = `{${req.body.voltage_array.toString().split(',')}}`;

    var query_str = `INSERT INTO public.voltages(
  	id, batch_datetime, voltage_array)
  	VALUES ((select nextval('voltage_id_seq'::regclass)), '${batch_datetime}', '${voltage_array}');`;

    client.query(query_str, (err, result) => {
      if (err) {
        res.status(400).send(err);
      } else {
        res.send({rows_created: result.rowCount});
      }
    });
  }

});

app.get('/voltages', (req, res) => {

  var query_str = `SELECT batch_datetime datetime, voltage_array voltage from public.voltages;`;

  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send({
        dados: result.rows
      });
    }
  });
});

app.delete('/voltages', (req, res) => {

  var query_str = `delete from public.voltages;`;

  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.send({rows_deleted: result.rowCount});
    }

  });
});

app.listen(PORT, () => {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  client.connect();
  console.log(`Battery Data Logger running at http://localhost:${PORT}`);
});
