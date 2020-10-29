const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

var appRouter = function (app) {
  app.post("/caretakers/get-past-jobs-information", get_past_jobs_information);
  app.post(
    "/caretakers/get-specific-past-jobs-information",
    get_specific_past_jobs_information
  );
  app.post(
    "/caretakers/get-ongoing-jobs-information",
    get_ongoing_jobs_information
  );
  app.post(
    "/caretakers/get-upcoming-jobs-information",
    get_upcoming_jobs_information
  );
  app.post(
    "/caretakers/get-specific-upcoming-jobs-information",
    get_specific_upcoming_jobs_information
  );
};

async function get_past_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;

    const result = await client.query(
      `SELECT u.username AS username, p.pet_name AS pet_name, 
      bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
      bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
      bt.amount AS amount, bt.rating AS rating, bt.review AS review, u.name AS name, 
      u.gender AS gender, u.phone AS phone, u.email AS email, u.address AS address, 
      AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
      p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
      FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
      WHERE bt.cusername = '${username}' AND 
      bt.job_start_datetime < current_timestamp AND 
      bt.job_end_datetime < current_timestamp;`
    );

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_specific_past_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;
    const start_date = req.body.toGet.dates[0];
    const end_date = req.body.toGet.dates[1];
    let query = "";

    if (start_date != null) {
      query = `SELECT u.username AS username, p.pet_name AS pet_name, 
        bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
        bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
        bt.amount AS amount, bt.rating AS rating, bt.review AS review, u.name AS name, 
        u.gender AS gender, u.phone AS phone, u.email AS email, u.address AS address, 
        AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
        p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
        FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
        WHERE bt.cusername = '${username}' AND 
        bt.job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        bt.job_end_datetime BETWEEN '${start_date}' AND '${end_date}';`;
    } else {
      query = `SELECT u.username AS username, p.pet_name AS pet_name, 
        bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
        bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
        bt.amount AS amount, bt.rating AS rating, bt.review AS review, u.name AS name, 
        u.gender AS gender, u.phone AS phone, u.email AS email, u.address AS address, 
        AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
        p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
        FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
        WHERE bt.cusername = '${username}' AND 
        bt.job_start_datetime < current_timestamp AND 
        bt.job_end_datetime < current_timestamp;`;
    }

    const result = await client.query(query);

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_ongoing_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;

    const result = await client.query(
      `SELECT u.username AS username, p.pet_name AS pet_name, 
      bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
      bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
      bt.amount AS amount, u.name AS name, u.gender AS gender, u.phone AS phone, u.email AS email, 
      u.address AS address, AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
      p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
      FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
      WHERE bt.cusername = '${username}' AND 
      bt.job_start_datetime <= current_timestamp AND 
      bt.job_end_datetime >= current_timestamp;`
    );

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_upcoming_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;

    const result = await client.query(
      `SELECT u.username AS username, p.pet_name AS pet_name, 
      bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
      bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
      bt.amount AS amount, u.name AS name, u.gender AS gender, u.phone AS phone, u.email AS email, 
      u.address AS address, AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
      p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
      FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
      WHERE bt.cusername = '${username}' AND  
      bt.job_start_datetime > current_timestamp;`
    );

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));

    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_specific_upcoming_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;
    const start_date = req.body.toGet.dates[0];
    const end_date = req.body.toGet.dates[1];
    let query = "";

    if (start_date != null) {
      query = `SELECT u.username AS username, p.pet_name AS pet_name, 
        bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
        bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
        bt.amount AS amount, bt.rating AS rating, bt.review AS review, u.name AS name, 
        u.gender AS gender, u.phone AS phone, u.email AS email, u.address AS address, 
        AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
        p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
        FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
        WHERE bt.cusername = '${username}' AND 
        bt.job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        bt.job_end_datetime BETWEEN '${start_date}' AND '${end_date}';`;
    } else {
      query = `SELECT u.username AS username, p.pet_name AS pet_name, 
        bt.job_start_datetime AS job_start_datetime, bt.job_end_datetime AS job_end_datetime, 
        bt.start_transfer_method AS start_transfer_method, bt.end_transfer_method AS end_transfer_method, 
        bt.amount AS amount, bt.rating AS rating, bt.review AS review, u.name AS name, 
        u.gender AS gender, u.phone AS phone, u.email AS email, u.address AS address, 
        AGE(p.birth_date) AS pet_age, p.gender AS pet_gender, p.breed AS breed, 
        p.type_of_animal AS type_of_animal, p.med_hist AS med_hist, p.special_req AS special_req
        FROM (users u INNER JOIN bid_transaction bt ON u.username = bt.pusername) NATURAL JOIN pet p 
        WHERE bt.cusername = '${username}' AND 
        bt.job_start_datetime > current_timestamp;`;
    }

    const result = await client.query(query);

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));

    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

module.exports = appRouter;