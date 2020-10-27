const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

var appRouter = function (app) {
  app.get("/pet-owners/get-caretakers-information", get_caretakers_information);
  app.post(
    "/pet-owners/get-caretaker-pets-information",
    get_caretaker_pets_information
  );
  app.post(
    "/pet-owners/get-specific-caretakers-information",
    get_specific_caretakers_information
  );
};

async function get_caretakers_information(req, res) {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT username, name, AGE(birth_date) AS age, birth_date, gender, phone, email, address, 
      average_rating, AGE(date_started) AS years_exp FROM users NATURAL JOIN caretaker;`
    );

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_caretaker_pets_information(req, res) {
  try {
    const client = await pool.connect();
    const username = req.body.toGet.username;

    const result = await client.query(
      `SELECT type_name, current_daily_price FROM can_take_care NATURAL JOIN daily_price_rate 
      WHERE username = '${username}';`
    );

    res.setHeader("content-type", "application/json");
    res.send(JSON.stringify(result.rows));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}

async function get_specific_caretakers_information(req, res) {
  try {
    const client = await pool.connect();
    let commitment = req.body.caretaker.commitment;
    let date_from = req.body.caretaker.dates[0];
    let date_to = req.body.caretaker.dates[1];
    let rating_wanted = req.body.caretaker.rating;
    let sort_by = req.body.caretaker.order_by;
    let price_range_from = req.body.caretaker.start_price;
    let price_range_to = req.body.caretaker.end_price;
    let type_of_animal = req.body.caretaker.animal_type;
    let caretaker_username = req.body.caretaker.search_caretaker;

    var caretakerObject = { fullTime: {}, partTime: {} };

    if (commitment == "full-time") {
      let request_full_time = `SELECT username, name, AGE(birth_date) AS age, birth_date, gender, 
      phone, email, address, average_rating, AGE(date_started) AS years_exp FROM users NATURAL JOIN 
      full_time_caretaker NATURAL JOIN can_take_care NATURAL JOIN leave_days 
      NATURAL JOIN daily_price_rate WHERE`;

      if (caretaker_username != null) {
        request_full_time =
          request_full_time + ` username = '${caretaker_username}' AND`;
      }

      if (date_from != null && date_to != null) {
        let add_dates_requested = ` (start_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}') AND end_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}')) OR (start_date BETWEEN date('${date_from}') AND 
        date('${date_to}') AND end_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}'))`;

        request_full_time = request_full_time + add_dates_requested + " AND";
      }

      if (rating_wanted != null) {
        let add_rating_requested =
          " (rating >= " + parseFloat(rating_wanted) + ")";

        request_full_time = request_full_time + add_rating_requested + " AND";
      }

      if (type_of_animal != null) {
        type_of_animal = type_of_animal.replace(/,/g, "' OR type_name = '");
        let add_animal_type_requested =
          " (type_name = '" + type_of_animal + "')";

        request_full_time =
          request_full_time + add_animal_type_requested + " AND";
      }

      if (price_range_from != null && price_range_to == null) {
        let add_min_price =
          " (current_daily_price >= " + parseFloat(price_range_from) + ")";

        request_full_time = request_full_time + add_min_price + " AND";
      } else if (price_range_from == null && price_range_to != null) {
        let add_max_price =
          " (current_daily_price <= " + parseFloat(price_range_to) + ")";

        request_full_time = request_full_time + add_max_price + " AND";
      } else if (price_range_from != null && price_range_to != null) {
        let add_price_range =
          " (current_daily_price BETWEEN " +
          parseFloat(price_range_from) +
          " AND " +
          parseFloat(price_range_to) +
          ")";

        request_full_time = request_full_time + add_price_range + " AND";
      }

      let request_full_time_split_by_space = request_full_time
        .trim()
        .split(" ");
      if (
        request_full_time_split_by_space[
          request_full_time_split_by_space.length - 1
        ] == "AND" ||
        request_full_time_split_by_space[
          request_full_time_split_by_space.length - 1
        ] == "WHERE"
      ) {
        request_full_time = request_full_time_split_by_space
          .slice(0, -1)
          .join(" ");
      } else {
        request_full_time = request_full_time_split_by_space.join(" ");
      }

      if (sort_by != null) {
        if (sort_by.length > 1) {
          if (sort_by[0] == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z = " ORDER BY username ASC,";

            request_full_time =
              request_full_time + add_sort_alphebatically_a_to_z;
          } else if (sort_by[0] == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a = " ORDER BY username DESC,";

            request_full_time =
              request_full_time + add_sort_alphebatically_z_to_a;
          }

          if (sort_by[1] == "price low to high") {
            let add_sort_price_low_to_high = " current_daily_price ASC";

            request_full_time = request_full_time + add_sort_price_low_to_high;
          } else if (sort_by[1] == "price high to low") {
            let add_sort_price_high_to_low = " current_daily_price DESC";

            request_full_time = request_full_time + add_sort_price_high_to_low;
          }
        } else {
          if (sort_by == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z_only = " ORDER BY username ASC";

            request_full_time =
              request_full_time + add_sort_alphebatically_a_to_z_only;
          } else if (sort_by == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a_only = " ORDER BY username DESC";

            request_full_time =
              request_full_time + add_sort_alphebatically_z_to_a_only;
          } else if (sort_by == "price low to high") {
            let add_sort_price_low_to_high_only =
              " ORDER BY current_daily_price ASC";

            request_full_time =
              request_full_time + add_sort_price_low_to_high_only;
          } else if (sort_by == "price high to low") {
            let add_sort_price_high_to_low_only =
              " ORDER BY current_daily_price DESC";

            request_full_time =
              request_full_time + add_sort_price_high_to_low_only;
          }
        }
      }

      await client.query(request_full_time).then((resp) => {
        let arr = [];
        let len = resp.rows.length;
        for (var i = 0; i < len; i++) {
          let result = resp.rows[i];
          arr.push(result);
        }
        caretakerObject.fullTime = arr;
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(caretakerObject));
      });
    } else if (commitment == "part-time") {
      let request_part_time = `SELECT username, name, AGE(birth_date) AS age, birth_date, gender, 
      phone, email, address, average_rating, AGE(date_started) AS years_exp FROM users NATURAL JOIN
      part_time_caretaker NATURAL JOIN can_take_care NATURAL JOIN availabilities 
      NATURAL JOIN daily_price_rate WHERE`;

      if (caretaker_username != null) {
        request_full_time =
          request_full_time + ` username = '${caretaker_username}' AND`;
      }

      if (date_from != null && date_to != null) {
        let add_dates_requested =
          " (start_date <= date('" +
          date_from +
          "') AND end_date >= date('" +
          date_to +
          "'))";

        request_part_time = request_part_time + add_dates_requested + " AND";
      }

      if (rating_wanted != null) {
        let add_rating_requested =
          " (rating >= " + parseFloat(rating_wanted) + ")";

        request_part_time = request_part_time + add_rating_requested + " AND";
      }

      if (type_of_animal != null) {
        type_of_animal = type_of_animal.replace(/,/g, "' OR type_name = '");
        let add_animal_type_requested =
          " (type_name = '" + type_of_animal + "')";

        request_part_time =
          request_part_time + add_animal_type_requested + " AND";
      }

      if (price_range_from != null && price_range_to == null) {
        let add_min_price =
          " (current_daily_price >= " + parseFloat(price_range_from) + ")";

        request_part_time = request_part_time + add_min_price + " AND";
      } else if (price_range_from == null && price_range_to != null) {
        let add_max_price =
          " (current_daily_price <= " + parseFloat(price_range_to) + ")";

        request_part_time = request_part_time + add_max_price + " AND";
      } else if (price_range_from != null && price_range_to != null) {
        let add_price_range =
          " (current_daily_price BETWEEN " +
          parseFloat(price_range_from) +
          " AND " +
          parseFloat(price_range_to) +
          ")";

        request_part_time = request_part_time + add_price_range + " AND";
      }

      let request_part_time_split_by_space = request_part_time
        .trim()
        .split(" ");
      if (
        request_part_time_split_by_space[
          request_part_time_split_by_space.length - 1
        ] == "AND" ||
        request_part_time_split_by_space[
          request_part_time_split_by_space.length - 1
        ] == "WHERE"
      ) {
        request_part_time = request_part_time_split_by_space
          .slice(0, -1)
          .join(" ");
      } else {
        request_part_time = request_part_time_split_by_space.join(" ");
      }

      if (sort_by != null) {
        if (sort_by.length > 1) {
          if (sort_by[0] == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z = " ORDER BY username ASC,";

            request_part_time =
              request_part_time + add_sort_alphebatically_a_to_z;
          } else if (sort_by[0] == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a = " ORDER BY username DESC,";

            request_part_time =
              request_part_time + add_sort_alphebatically_z_to_a;
          }

          if (sort_by[1] == "price low to high") {
            let add_sort_price_low_to_high = " current_daily_price ASC";

            request_part_time = request_part_time + add_sort_price_low_to_high;
          } else if (sort_by[1] == "price high to low") {
            let add_sort_price_high_to_low = " current_daily_price DESC";

            request_part_time = request_part_time + add_sort_price_high_to_low;
          }
        } else {
          if (sort_by == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z_only = " ORDER BY username ASC";

            request_part_time =
              request_part_time + add_sort_alphebatically_a_to_z_only;
          } else if (sort_by == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a_only = " ORDER BY username DESC";

            request_part_time =
              request_part_time + add_sort_alphebatically_z_to_a_only;
          } else if (sort_by == "price low to high") {
            let add_sort_price_low_to_high_only =
              " ORDER BY current_daily_price ASC";

            request_part_time =
              request_part_time + add_sort_price_low_to_high_only;
          } else if (sort_by == "price high to low") {
            let add_sort_price_high_to_low_only =
              " ORDER BY current_daily_price DESC";

            request_part_time =
              request_part_time + add_sort_price_high_to_low_only;
          }
        }
      }

      await client.query(request_part_time).then((resp) => {
        let arr = [];
        let len = resp.rows.length;
        for (var i = 0; i < len; i++) {
          let result = resp.rows[i];
          arr.push(result);
        }
        caretakerObject.partTime = arr;
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(caretakerObject));
      });
    } else {
      // both full-time and part-time
      let request_full_time = `SELECT username, name, AGE(birth_date) AS age, birth_date, gender, 
      phone, email, address, average_rating, AGE(date_started) AS years_exp FROM users NATURAL JOIN 
      full_time_caretaker NATURAL JOIN can_take_care NATURAL JOIN leave_days 
      NATURAL JOIN daily_price_rate WHERE`;

      let request_part_time = `SELECT username, name, AGE(birth_date) AS age, birth_date, gender, 
      phone, email, address, average_rating, AGE(date_started) AS years_exp FROM users NATURAL JOIN
      part_time_caretaker NATURAL JOIN can_take_care NATURAL JOIN availabilities 
      NATURAL JOIN daily_price_rate WHERE`;

      if (caretaker_username != null) {
        request_full_time =
          request_full_time + ` username = '${caretaker_username}' AND`;

        request_part_time =
          request_part_time + ` username = '${caretaker_username}' AND`;
      }

      if (date_from != null && date_to != null) {
        let add_dates_requested_full_time = ` (start_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}') AND end_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}')) OR (start_date BETWEEN date('${date_from}') AND 
        date('${date_to}') AND end_date NOT BETWEEN date('${date_from}') AND 
        date('${date_to}'))`;

        let add_dates_requested_part_time =
          " (start_date <= date('" +
          date_from +
          "') AND end_date >= date('" +
          date_to +
          "'))";

        request_full_time =
          request_full_time + add_dates_requested_full_time + " AND";

        request_part_time =
          request_part_time + add_dates_requested_part_time + " AND";
      }

      if (rating_wanted != null) {
        let add_rating_requested =
          " (rating >= " + parseFloat(rating_wanted) + ")";

        request_full_time = request_full_time + add_rating_requested + " AND";
        request_part_time = request_part_time + add_rating_requested + " AND";
      }

      if (type_of_animal != null) {
        type_of_animal = type_of_animal.replace(/,/g, "' OR type_name = '");
        let add_animal_type_requested =
          " (type_name = '" + type_of_animal + "')";

        request_full_time =
          request_full_time + add_animal_type_requested + " AND";

        request_part_time =
          request_part_time + add_animal_type_requested + " AND";
      }

      if (price_range_from != null && price_range_to == null) {
        let add_min_price =
          " (current_daily_price >= " + parseFloat(price_range_from) + ")";

        request_full_time = request_full_time + add_min_price + " AND";

        request_part_time = request_part_time + add_min_price + " AND";
      } else if (price_range_from == null && price_range_to != null) {
        let add_max_price =
          " (current_daily_price <= " + parseFloat(price_range_to) + ")";

        request_full_time = request_full_time + add_max_price + " AND";

        request_part_time = request_part_time + add_max_price + " AND";
      } else if (price_range_from != null && price_range_to != null) {
        let add_price_range =
          " (current_daily_price BETWEEN " +
          parseFloat(price_range_from) +
          " AND " +
          parseFloat(price_range_to) +
          ")";

        request_full_time = request_full_time + add_price_range + " AND";

        request_part_time = request_part_time + add_price_range + " AND";
      }

      let request_full_time_split_by_space = request_full_time
        .trim()
        .split(" ");

      if (
        request_full_time_split_by_space[
          request_full_time_split_by_space.length - 1
        ] == "AND" ||
        request_full_time_split_by_space[
          request_full_time_split_by_space.length - 1
        ] == "WHERE"
      ) {
        request_full_time = request_full_time_split_by_space
          .slice(0, -1)
          .join(" ");
      } else {
        request_full_time = request_full_time_split_by_space.join(" ");
      }

      let request_part_time_split_by_space = request_part_time
        .trim()
        .split(" ");

      if (
        request_part_time_split_by_space[
          request_part_time_split_by_space.length - 1
        ] == "AND" ||
        request_part_time_split_by_space[
          request_part_time_split_by_space.length - 1
        ] == "WHERE"
      ) {
        request_part_time = request_part_time_split_by_space
          .slice(0, -1)
          .join(" ");
      } else {
        request_part_time = request_part_time_split_by_space.join(" ");
      }

      if (sort_by != null) {
        if (sort_by.length > 1) {
          if (sort_by[0] == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z = " ORDER BY username ASC,";

            request_full_time =
              request_full_time + add_sort_alphebatically_a_to_z;

            request_part_time =
              request_part_time + add_sort_alphebatically_a_to_z;
          } else if (sort_by[0] == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a = " ORDER BY username DESC,";

            request_full_time =
              request_full_time + add_sort_alphebatically_z_to_a;

            request_part_time =
              request_part_time + add_sort_alphebatically_z_to_a;
          }

          if (sort_by[1] == "price low to high") {
            let add_sort_price_low_to_high = " current_daily_price ASC";

            request_full_time = request_full_time + add_sort_price_low_to_high;
          } else if (sort_by[1] == "price high to low") {
            let add_sort_price_high_to_low = " current_daily_price DESC";

            request_full_time = request_full_time + add_sort_price_high_to_low;

            request_part_time = request_part_time + add_sort_price_high_to_low;
          }
        } else {
          if (sort_by == "alphabetical a to z") {
            let add_sort_alphebatically_a_to_z_only = " ORDER BY username ASC";

            request_full_time =
              request_full_time + add_sort_alphebatically_a_to_z_only;

            request_part_time =
              request_part_time + add_sort_alphebatically_a_to_z_only;
          } else if (sort_by == "alphabetical z to a") {
            let add_sort_alphebatically_z_to_a_only = " ORDER BY username DESC";

            request_full_time =
              request_full_time + add_sort_alphebatically_z_to_a_only;

            request_part_time =
              request_part_time + add_sort_alphebatically_z_to_a_only;
          } else if (sort_by == "price low to high") {
            let add_sort_price_low_to_high_only =
              " ORDER BY current_daily_price ASC";

            request_full_time =
              request_full_time + add_sort_price_low_to_high_only;

            request_part_time =
              request_part_time + add_sort_price_low_to_high_only;
          } else if (sort_by == "price high to low") {
            let add_sort_price_high_to_low_only =
              " ORDER BY current_daily_price DESC";

            request_full_time =
              request_full_time + add_sort_price_high_to_low_only;

            request_part_time =
              request_part_time + add_sort_price_high_to_low_only;
          }
        }
      }

      await client.query(request_full_time).then((resp) => {
        let full_time_arr = [];
        let full_time_len = resp.rows.length;
        for (var i = 0; i < full_time_len; i++) {
          let result = resp.rows[i];
          full_time_arr.push(result);
        }
        caretakerObject.fullTime = full_time_arr;
      });

      await client.query(request_part_time).then((resp) => {
        let part_time_arr = [];
        let part_time_len = resp.rows.length;
        for (var i = 0; i < len; i++) {
          let result = resp.rows[i];
          part_time_arr.push(result);
        }
        caretakerObject.partTime = part_time_arr;
        res.setHeader("content-type", "application/json");
        res.send(JSON.stringify(caretakerObject));
      });
    }
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