// Find consecutive lowest prices

// This script finds the start time for a period with a specified 
// number of consecutive hours, with the lowest total price.

// Argument should be a JSON object:
//
// {
//   "remaining_hours": 3, 
//   "finished_hour": 8, 
//   "prices": <POWER_PRICES_JSON>
// }
//
// Where <POWER_PRICES_JSON> is the price data fetched from Heating Controller
// Be aware of that the timestamps is in UTC time
//  [
//    {"startsAt":"2023-01-23T23:00:00.000Z","time":1674514800,"price":0.56033},
//    {"startsAt":"2023-01-24T00:00:00.000Z","time":1674518400,"price":0.5583},
//    {"startsAt":"2023-01-24T01:00:00.000Z","time":1674522000,"price":0.55841}
//  ]

const json = JSON.parse(args[0]);
const remaining_hours = parseInt(json.remaining_hours);
const finished_hour = parseInt(json.finished_hour);
const prices = json.prices;

function convertDate(dateIn, offset) {
  return new Date(dateIn.getTime() + (offset * 60 * 60 * 1000));
}

function epochToDate(epochInSec, offset) {
  const date = new Date(epochInSec*1000);
  return convertDate(date, offset);
}

function convertDateToEpochInSec(date) {
  return Math.round(date.getTime() / 1000);
}

function getTimeZoneOffsetForNorway() {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-based index, so we add 1
  const day = now.getDate();

  // CET is 1 hour ahead of UTC in the winter
  // CEST is 2 hours ahead of UTC in the summer
  if (month < 3 || month > 10) {
    return 1;
  }
  if (month > 3 && month < 10) {
    return 2;
  }

  //The last Sunday of March and October always falls on or after the 25th of the month.
  if (month === 3) {
    return day >= 25 ? 2 : 1;
  }
  if (month === 10) {
    return day < 25 ? 2 : 1;
  }
}

function getUtcEndDate(endHour, offset) {
  // create a date object with the given hour
  let endDate = new Date();
  //increasing the date by one day if the hour has already passed on the current date
  if (endDate.getHours() >= endHour) {
    endDate.setDate(endDate.getDate() + 1);
  }
  endDate.setHours(endHour);
  endDate.setMinutes(0,0,0);  

  return convertDate(endDate, offset)
}


function findLowestPriceSeries(data, numberOfHours) {
  let lowestSum = Number.MAX_VALUE;
  let lowestIndex = -1;

  // Iterate over the data array and find the lowest sum of prices
  for (let i = 0; i < data.length - numberOfHours + 1; i++) {
    let sum = 0;

    for (let j = i; j < i + numberOfHours; j++) {
      sum += data[j].price;
    }

    if (sum < lowestSum) {
      lowestSum = sum;
      lowestIndex = i;
    }
  }

  if (lowestIndex >= 0) {
    // Return the epoch for the first object in the series
    return data[lowestIndex].time;
  } else {
    console.log('Could not find interval. Defaulting to now.')
    // Get the epoch of the current hour
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    return convertDateToEpochInSec(currentHour);
  }
}



//
// MAIN
//
const timeZoneOffset = getTimeZoneOffsetForNorway();
console.log('timeZoneOffset: ', timeZoneOffset);

// Define startdate in UTC format, to this hour: ie. 2023-02-19T21:51:51.305 --> 2023-02-19T21:00:00.000
const utcStartDate = new Date();
utcStartDate.setMinutes(0,0,0);

// Define end time in UTC format
const utcEndDate = getUtcEndDate(finished_hour, -timeZoneOffset);

// filter ut prices for the date interval based by the given start and stop dates
const filteredData = prices.filter(item => {
  const itemDate = new Date(item.startsAt);
  return itemDate >= utcStartDate && itemDate < utcEndDate;
});
//console.log('filteredData: ', filteredData);

// find the start time of the cheapes date interval
const startEpoch = findLowestPriceSeries(filteredData, remaining_hours);
console.log('startEpoch: ', startEpoch);

const startDate = epochToDate(startEpoch, timeZoneOffset);
console.log("startDate: ", startDate.toLocaleString("no-NO"));

await tag('CheapestPricesStart',  startDate.toLocaleString("no-NO"));

return true;