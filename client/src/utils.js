import { tsvParse } from  "d3-dsv";
import { timeParse } from "d3-time-format";
import { DateTime } from 'luxon';

function parseData(parse) {
	return function(d) {
		d.date = parse(d.date);
		d.open = +d.open;
		d.high = +d.high;
		d.low = +d.low;
		d.close = +d.close;
		d.volume = +d.volume;

		return d;
	};
}

const parseDate = timeParse("%Y-%m-%d");

export function getData() {
	const promiseMSFT = fetch("https://cdn.rawgit.com/rrag/react-stockcharts/master/docs/data/MSFT.tsv")
		.then(response => response.text())
		.then(data => tsvParse(data, parseData(parseDate)))
	return promiseMSFT;

}

// returns a boolean that indicates whether markets are open or not.
// we are using NYSE / NASDAQ US stock markets, so they open
// monday to friday 9:30am - 4pm ET.
// Normally, federal holidays are included, but for the sake 
// of simplicity we're not doing it here.
export const checkMarketOpen = () => {
  const { minute: mm, hour: hh, weekday: dow } = DateTime.local().setZone('America/New_York');

  const elapsedMinsDay = hh * 60 + mm;
  const isDuringTime = (9*60 + 30) <= elapsedMinsDay && elapsedMinsDay <= (16 * 60);

  const isWeekday = 1 <= dow && dow <= 5;
  return isDuringTime && isWeekday;
}


export function formatCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function generateRandomColor(){
	const color = Math.floor(Math.random()*16777215).toString(16);
	return "#" + color;
}

export function createChartInput(items){
	var labels_val = [];
      var bgcolor = [];
      var data_val = [];
      items.forEach(function (item){
        labels_val.push(item.symbol)
        bgcolor.push(generateRandomColor());
        data_val.push(item.quantity)
      });
//currently, only dummy values
//replace rhs with labels_val, bgcolor, and data_val 
	  const input = {
		labels: ['MSFT', 'AAPL', 'AMZN'],
		datasets: [{
			label: "Shares",
			backgroundColor: ['#ff0000', '#ff9500', '#2d9c00'],
			data: [10, 20, 30],
		}]
	}
	return input;
}
