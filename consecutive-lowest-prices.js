//This script finds consecutive lowest prices

//Argument should be a JSON object:
//{
//  "remaining_hours": 3, 
//  "finished_hour": 8, 
//  "prices": POWER_PRICES_JSON
//}
const arguments = JSON.parse(args[0]);
const hours = parseInt(arguments.remaining_hours);

//typically at 08:00 -> 8
const finished_hour = parseInt(arguments.finished_hour);

// Price data fetched from Heating Controller
// Be aware of that the timestamps is in UTC time
//  [
//    {"startsAt":"2023-01-23T23:00:00.000Z","time":1674514800,"price":0.56033},
//    {"startsAt":"2023-01-24T00:00:00.000Z","time":1674518400,"price":0.5583},
//    {"startsAt":"2023-01-24T01:00:00.000Z","time":1674522000,"price":0.55841}
//  ]
const priceData = arguments.prices;

function findLowestPriceSeries(data, hours) {
  let lowestSum = Number.MAX_VALUE;
  let lowestIndex = -1;

  // Iterate over the data array and find the lowest sum of prices
  for (let i = 0; i < data.length - hours + 1; i++) {
    let sum = 0;

    for (let j = i; j < i + hours; j++) {
      sum += data[j].price;
    }

    if (sum < lowestSum) {
      lowestSum = sum;
      lowestIndex = i;
    }
  }

  // Return the epoch for the first object in the series
  if (lowestIndex >= 0) {
    return data[lowestIndex].time;
  }

  return -1;
}


function getUTCDate(date, offset) {
  return new Date(date.getTime() - (offset * 60 * 60 * 1000));
}


// Norwegian standard time (CET) is one hour ahead of universal time (UTC). 
// Transition to Central European Summer Time (CEST) is done by setting the clock forward one hour, 
// and then Norwegian time is two hours ahead of universal time (UTC). 
// It will take place at 02.00 last Sunday in March. 
// Return to normal time takes place at 03.00 on the last Sunday in October.
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

//
// MAIN
//

const offset = getTimeZoneOffsetForNorway();

// Define startdate to this hour
const utcStartDate = new Date();
utcStartDate.setMinutes(0);
utcStartDate.setSeconds(0);
utcStartDate.setMilliseconds(0);

// Define end time
let endDate = new Date();
if (endDate.getHours() >= finished_hour) {
  endDate.setDate(endDate.getDate() + 1);
}
endDate.setHours(finished_hour);
endDate.setMinutes(0);
endDate.setSeconds(0);
endDate.setMilliseconds(0);

const utcEndDate = getUTCDate(endDate, offset);

// filter ut prices for the given date interval
const filteredData = priceData.filter(item => {
  //convert epoch time to date
  const givenDate = new Date(item.time*1000);
  return givenDate >= utcStartDate && givenDate < utcEndDate;
});

console.log('filteredData: ', filteredData);

// find the interval
const epochStart= findLowestPriceSeries(filteredData, hours);

const startDate =  getUTCDate(new Date(epochStart*1000), offset);
console.log("start: ", startDate.toLocaleString("no-NO"));

await tag('CheapestPricesStart',  startDate.toLocaleString("no-NO"))

return true;