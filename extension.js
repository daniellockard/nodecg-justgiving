'use strict';

module.exports = function (nodecg) {
	const donationsRep = nodecg.Replicant('donations', {
		defaultValue: []
	});

	const totalRep = nodecg.Replicant('total', {
		defaultValue: 0
	});

	if (nodecg.bundleConfig.justgiving_appid === '') {
		nodecg.log.info(
			'Please set justgiving_appid in cfg/nodecg-justgiving.json'
		);
		return;
	}

	if (nodecg.bundleConfig.justgiving_shorturl === '') {
		nodecg.log.info(
			'Please set justgiving_shorturl in cfg/nodecg-justgiving.json'
		);
		return;
	}

	const axios = require('axios');
	const instance = axios.create({
		baseURL: 'https://api.staging.justgiving.com',
		timeout: 10000,
		headers: {'Content-Type': 'application/json'}
	});

	async function askJustGivingForDonations() {
		let response = {};
		try {
			response = await instance.get(
				`/${nodecg.bundleConfig.justgiving_appid}/v1/fundraising/pages/${nodecg.bundleConfig.justgiving_shorturl}/donations`
			);
		} catch (e) {
			nodecg.log.error(`Error: ${e}`);
		}

		const donationsData = response.data;

		for (let i = 0; i < donationsData.donations.length; i++) {
			const found = donationsRep.value.find(element => {
				return element.id === donationsData.donations[i].id;
			});
			if (found === undefined) {
				donationsData.donations[i].shown = false;
				donationsData.donations[i].read = false;
				donationsRep.value.push(donationsData.donations[i]);
			}
		}
	}

	async function askJustGivingForTotal() {
		const response = await instance.get(
			`/${nodecg.bundleConfig.justgiving_appid}/v1/fundraising/pages/${nodecg.bundleConfig.justgiving_shorturl}`
		);
		if (totalRep.value < response.data.totalRaisedOnline) {
			totalRep.value = response.data.totalRaisedOnline;
		}
	}

	function askJustGiving() {
		askJustGivingForDonations();
		askJustGivingForTotal();
	}

	setInterval(() => {
		askJustGiving();
	}, 5000);

	askJustGiving();
};
