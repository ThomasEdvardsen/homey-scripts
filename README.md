# Homey scripts

Various scripts running on the Homey Pro.


## consecutive-lowest-prices.js

This script finds the X number of consecutive hours, with the cheapest total price.

The script uses price data in JSON format from the Homey app Heating Controller. You can advantageously use the Electricity prices app to calculate the electricity prices including the spot price and grid consumption tax.


### Dependencies:

You need to install the following apps:
 * [HomeyScript](https://homey.app/en-gb/app/com.athom.homeyscript/HomeyScript/)
 * [Heating Controller](https://homey.app/en-gb/app/no.almli.heatingcontroller/Heating-Controller/)

Install both apps, and create a new device from Heating Controller. Under advanced settings, configure the price settings. If you like, use the app [Norwegian Electricity Bill](https://homey.app/en-gb/app/no.almli.utilitycost/Norwegian-Electricity-Bill/) to calculate electricity and grid prices.

### Usage:

Create a flow to fetch prices from Heating Controller to a variable:
![Fetch price flow](https://user-images.githubusercontent.com/6429052/219173526-3892c8f8-51c1-4822-870d-1d81550d0063.png)


Open the HomeyScript tab on [my.homey.app](https://my.homey.app) and create a new script, paste the contents of the script file into the new script and save.

Use the THEN-flowcard `HomeyScript: Run <script> with argument <argument>` to run the script from a flow.

![Run script](https://user-images.githubusercontent.com/6429052/219174891-740e9a74-597f-4c6e-ab94-116bf22e0d7b.png)


Be aware of the format of the argument to the script. Since I have not found a good way to send more than one argument to the script, I have chosen to send all the arguments wrapped in a JSON object that the script parses.

    {
      "remaining_hours": 3, 
      "finished_hour": 8, 
      "prices": <#POWER_PRICES_JSON>
    }

After being run, the tag `CheapestPricesStart` contains the timestamp for the start of the period. 
