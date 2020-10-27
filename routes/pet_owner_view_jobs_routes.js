const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

var appRouter = function (app) {
  app.post("/pet-owners/get-past-jobs-information", get_past_jobs_information);
  app.post(
    "/pet-owners/get-specific-past-jobs-information",
    get_specific_past_jobs_information
  );
  app.post(
    "/pet-owners/get-ongoing-jobs-information",
    get_ongoing_jobs_information
  );
  app.post(
    "/pet-owners/get-upcoming-jobs-information",
    get_upcoming_jobs_information
  );
  app.post(
    "/pet-owners/get-specific-upcoming-jobs-information",
    get_specific_upcoming_jobs_information
  );
};

async function get_past_jobs_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;

    const result = await client.query(
      `SELECT *
      FROM users u INNER JOIN bid_transaction bt ON u.username = bt.cusername 
      WHERE bt.pusername = '${username}' AND 
      job_start_datetime < current_timestamp AND 
      job_end_datetime < current_timestamp;`
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
    let pet_names = req.body.toGet.animal_names;
    let query = "";

    if (start_date != null && pet_names != null) {
      if (pet_names.includes(",")) {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        job_end_datetime BETWEEN '${start_date}' AND '${end_date}' AND (`;
        let pet_names_split = pet_names.split(",");
        let length = pet_names_split.length;
        for (let i = 0; i < length; i++) {
          query += `pet_name = '${pet_names_split[i]}' OR `;
        }
        query = query.slice(0, -4);
        query += `);`;
      } else {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        job_end_datetime BETWEEN '${start_date}' AND '${end_date}' AND pet_name = '${pet_names}';`;
      }
    } else if (start_date != null && pet_names == null) {
      query = `SELECT * FROM bid_transction WHERE pusername = '${username}' AND 
      job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
      job_end_datetime BETWEEN '${start_date}' AND '${end_date}';`;
    } else if (start_date == null && pet_names != null) {
      if (pet_names.includes(",")) {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime < current_timestamp AND 
        job_end_datetime < current_timestamp AND (`;
        let pet_names_split = pet_names.split(",");
        let length = pet_names_split.length;
        for (let i = 0; i < length; i++) {
          query += `pet_name = '${pet_names_split[i]}' OR `;
        }
        query = query.slice(0, -4);
        query += `);`;
      } else {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime < current_timestamp AND 
        job_end_datetime < current_timestamp AND pet_name = '${pet_names}';`;
      }
    } else {
      query = `SELECT * FROM bid_transction WHERE pusername = '${username}' AND 
        job_start_datetime < current_timestamp AND 
        job_end_datetime < current_timestamp;`;
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
      `SELECT *
      FROM users u INNER JOIN bid_transction bt ON u.username = bt.cusername 
      WHERE bt.pusername = '${username}' AND 
      job_start_datetime <= current_timestamp AND 
      job_end_datetime >= current_timestamp;`
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
      `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
      job_start_datetime > current_timestamp;`
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
    let pet_names = req.body.toGet.animal_names;
    let query = "";

    if (start_date != null && pet_names != null) {
      if (pet_names.includes(",")) {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        job_end_datetime BETWEEN '${start_date}' AND '${end_date}' AND (`;
        let pet_names_split = pet_names.split(",");
        let length = pet_names_split.length;
        for (let i = 0; i < length; i++) {
          query += `pet_name = '${pet_names_split[i]}' OR `;
        }
        query = query.slice(0, -4);
        query += `);`;
      } else {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
        job_end_datetime BETWEEN '${start_date}' AND '${end_date}' AND pet_name = '${pet_names}';`;
      }
    } else if (start_date != null && pet_names == null) {
      query = `SELECT * FROM bid_transction WHERE pusername = '${username}' AND 
      job_start_datetime BETWEEN '${start_date}' AND '${end_date}' AND 
      job_end_datetime BETWEEN '${start_date}' AND '${end_date}';`;
    } else if (start_date == null && pet_names != null) {
      if (pet_names.includes(",")) {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime > current_timestamp AND (`;
        let pet_names_split = pet_names.split(",");
        let length = pet_names_split.length;
        for (let i = 0; i < length; i++) {
          query += `pet_name = '${pet_names_split[i]}' OR `;
        }
        query = query.slice(0, -4);
        query += `);`;
      } else {
        query = `SELECT * FROM bid_transaction WHERE pusername = '${username}' AND 
        job_start_datetime > current_timestamp AND pet_name = '${pet_names}';`;
      }
    } else {
      query = `SELECT * FROM bid_transction WHERE pusername = '${username}' AND 
        job_start_datetime > current_timestamp;`;
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