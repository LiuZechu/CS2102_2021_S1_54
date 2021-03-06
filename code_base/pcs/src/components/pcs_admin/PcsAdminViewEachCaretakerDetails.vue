<template>
  <v-container>
    <div style="width: 20%; float: left">
      <PcsAdminNavBar />
    </div>
    <div style="width: 80%; float: right">
      <h2 style="text-align:center">
        Number of pet-days and number of pets taken care of by each Caretaker in
        {{ month }} {{ year }}
      </h2>
      <br />
      <h4>
        To view a caretaker's profile, click on the row containing the desired
        caretaker's username.
      </h4>
      <br />
      <h4>
        Note:
      </h4>
      <h4>
        1. "Total Number of Pets Taken Care of" considers jobs that ended between the start of the month
        and the current time.
      </h4>
      <h4>
        2. "Total Number of Pet Days" considers jobs that ended between the start of the month
        and the current time. All days within a job are counted (even if some of the days fall within the previous month).
      </h4>
      <h4>
        3. For a full-time Caretaker, "Salary" shows the expected salary of the whole month. 
        For a part-time Caretaker, "Salary" shows how much he/she has earned from the jobs that ended between the start of the month
        and the current time.  
      </h4>
      <br />
      <template v-if="loaded && bid_transaction.length > 0">
        <v-data-table
          multi-sort
          :headers="headers"
          :items="bid_transaction"
          :items-per-page="10"
          class="elevation-1"
          @click:row="handleClick"
        >
        </v-data-table>
      </template>
      <template v-else-if="loaded && bid_transaction == 0">
        <v-row>
          <v-card
            class="mx-auto"
            width="60%"
            height="160"
            color="#ECEFF1"
            rounded
          >
            <v-card-title>
              <v-row align="center" justify="center">
                <v-icon light large center>mdi-emoticon-sad</v-icon>
              </v-row>
            </v-card-title>
            <p class="text-center">
              No information regarding the salary, number of pet-days and number
              of pets taken care of by each caretaker for this month can be
              found at the moment.
              <br />Sorry!
            </p>
          </v-card>
        </v-row>
      </template>
      <template v-else-if="!loaded">
        <v-row justify="center">
          <v-progress-circular
            indeterminate
            :size="70"
            :width="7"
            color="#01579B"
          />
        </v-row>
      </template>
    </div>
  </v-container>
</template>

<script>
import PcsAdminNavBar from "./PcsAdminNavBar";
import * as constants from "../constants";
import axios from "axios";

export default {
  name: "PcsAdminViewEachCaretakerDetails",
  components: {
    PcsAdminNavBar,
  },
  data: () => ({
    loaded: true,
    month: null,
    year: null,
    bid_transaction: [],
    headers: [
      {
        text: "No.",
        value: "number",
        align: "left",
      },
      {
        text: "Caretaker's Username",
        value: "cusername",
        align: "center",
      },
      {
        text: "Total Number of Pets Taken Care of",
        value: "totalNumPets",
        align: "center",
      },
      {
        text: "Total Number of Pet-Days",
        value: "totalNumDays",
        align: "center",
      },
      {
        text: "Salary",
        value: "salary",
        align: "center",
      },
    ],
  }),
  methods: {
    handleClick: function(value) {
      console.log(value.number);
      console.log(this.bid_transaction[value.number - 1].cusername);
      window.location.href =
        constants.pcs_admin_show_caretaker_details +
        "&caretaker_username=" +
        this.bid_transaction[value.number - 1].cusername;
      // console.log(this.bid_transaction[index]);
    },
  },
  async mounted() {
    this.loaded = false;
    let date = new Date();
    this.month = date.toLocaleString("default", { month: "long" });
    this.year = date.getFullYear();

    await axios
      .get(
        "https://pet-care-service.herokuapp.com/pcs-admin/get-num-pets-and-pet-days-and-salary-for-each-caretaker"
      )
      .then((response) => {
        console.log(response.data);
        for (let i = 0; i < response.data.length; i++) {
          let num_pets = 0;
          let num_pet_days = 0;
          if (response.data[i].num_pets == null) {
            num_pets = 0;
          } else {
            num_pets = response.data[i].num_pets;
          }

          if (response.data[i].num_pet_days == null) {
            num_pet_days = 0;
          } else {
            num_pet_days = response.data[i].num_pet_days;
          }

          let caretaker_data = {
            number: i + 1,
            cusername: response.data[i].cusername,
            totalNumPets: num_pets,
            totalNumDays: num_pet_days,
            salary: response.data[i].salary,
          };
          this.bid_transaction.push(caretaker_data);
        }
      });
    this.loaded = true;
  },
};
</script>
