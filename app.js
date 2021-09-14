const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const { Client } = require('pg');
const excel = require("exceljs");

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

  if (req.body.voltage_array && req.body.voltage_array.length == 0) {
    res.status(400).send({
      error: "No voltage array items"
    });
  }

  var batch_datetime = req.body.batch_datetime;
  var voltage_array = `{${req.body.voltage_array.toString().split(',')}}`;

  var query_str = `INSERT INTO public.voltages(
	id, batch_datetime, voltage_array)
	VALUES ((select nextval('voltage_id_seq'::regclass)), '${batch_datetime}', '${voltage_array}');`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    }
    res.send({rows_created: result.rowCount});
  });

});

app.get('/voltages', (req, res) => {

  var query_str = `SELECT * from public.voltages;`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    }
    res.send(result.rows);
  });
});

app.delete('/voltages', (req, res) => {

  var query_str = `delete from public.voltages;`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    }
    res.send({rows_deleted: result.rowCount});
  });
});


app.get('/voltages/csv', (req, res) => {

  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet("Voltages");

  worksheet.columns = [
    { header: "ID", key: "id", width: 5 },
    { header: "DateTime", key: "batch_datetime", width: 25 },
    { header: "VoltagesArray", key: "voltage_array", width: 100 }
  ];

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "voltages_report.csv"
  );

  const options = {
    dateFormat: 'DD/MM/YYYY HH:mm:ss'
  };

  var query_str = `SELECT * from public.voltages;`;

  client.connect();
  client.query(query_str, (err, result) => {
    if (err) {
      res.status(400).send(err);
    }
    worksheet.addRows(result.rows);
    workbook.csv.write(res, options).then(function () {
      res.status(200).end();
    });
  });
});

app.listen(PORT, () => {
  console.log(`Battery Data Logger running at http://localhost:${PORT}`);
});
