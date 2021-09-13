const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const { Client } = require('pg');

require('dotenv').config();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const connectionString = process.env.PG_CONN;

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to Battery Data Logger.');
});

app.post('/voltages', (req, res) => {

  var batch_datetime = req.body.batch_datetime;
  var batch_data = `{${req.body.batch_data.toString().split(',')}}`;

  var query_str = `INSERT INTO public.voltages(
	id, batch_datetime, batch_data)
	VALUES ((select nextval('voltage_id_seq'::regclass)), '${batch_datetime}', '${batch_data}');`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) throw err;
    res.send({rows_count: result.rowCount});
  });
});

app.get('/voltages', (req, res) => {

  var query_str = `SELECT * from public.voltages;`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});


app.listen(PORT, () => {
  console.log(`Battery Data Logger running at http://localhost:${PORT}`);
});
