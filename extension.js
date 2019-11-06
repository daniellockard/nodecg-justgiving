"use strict";

module.exports = function(nodecg) {
  var donationsRep = nodecg.Replicant("donations", {
    defaultValue: []
  });

  if (nodecg.bundleConfig.justgiving_appid === "") {
    nodecg.log.info(
      "Please set justgiving_appid in cfg/nodecg-justgiving.json"
    );
    return;
  }

  if (nodecg.bundleConfig.justgiving_shorturl === "") {
    nodecg.log.info(
      "Please set justgiving_shorturl in cfg/nodecg-justgiving.json"
    );
    return;
  }

  const axios = require("axios");
  const instance = axios.create({
    baseURL: "https://api.staging.justgiving.com",
    timeout: 10000,
    headers: { "Content-Type": "application/json" }
  });

  async function askJustGivingForDonations() {
    const response = await instance.get(
      `/${nodecg.bundleConfig.justgiving_appid}/v1/fundraising/pages/${nodecg.bundleConfig.justgiving_shorturl}/donations`
    );

    const donationsData = response.data;

    nodecg.log.info(JSON.stringify(donationsData));

    for (let i = 0; i < donationsData.donations.length; i++) {
      var found = donationsRep.value.find(function(element) {
        return element.id === donationsData.donations[i].id;
      });
      if (found === undefined) {
        donationsData.donations[i].shown = false;
        donationsData.donations[i].read = false;
        donationsRep.value.push(donationsData.donations[i]);
      }
    }
  }

  function askJustGiving() {
    askJustGivingForDonations();
    // askJustGivingForTotal()
  }

  setInterval(function() {
    askJustGiving();
  }, 5000);

  askJustGiving();
};
