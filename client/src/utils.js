import { DateTime } from 'luxon';

// returns a boolean that indicates whether markets are open or not.
// we are using NYSE / NASDAQ US stock markets, so they open
// monday to friday 9:30am - 4pm ET.
// Normally, federal holidays are included, but for the sake 
// of simplicity we're not doing it here.
export const checkMarketOpen = () => {
	const { minute: mm, hour: hh, weekday: dow } = DateTime.local().setZone('America/New_York');

	const elapsedMinsDay = hh * 60 + mm;
	const isDuringTime = (9 * 60 + 30) <= elapsedMinsDay && elapsedMinsDay <= (16 * 60);

	const isWeekday = 1 <= dow && dow <= 5;
	//return isDuringTime && isWeekday;
	return true;
}

export function formatCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export function generateRandomColor() {
	const color = Math.floor(Math.random() * 16777215).toString(16);
	return "#" + color;
}

export function getStockValueNumber(quantity, price_per_share) {
	return ((Number(quantity) * Number(price_per_share)).toFixed(2));
}
export function createChartInput(items) {
	var labels_val = [];
	var bgcolor = [];
	var data_val = [];
	items.forEach(function (item) {
		if (item.symbol != 'USD') {
			labels_val.push(item.symbol)
			bgcolor.push(generateRandomColor());
			var stock_val = getStockValueNumber(item.quantity, item.price_per_share);
			//console.log(stock_val);
			data_val.push(stock_val);
		}
	});
	//currently, only dummy values
	//replace rhs with labels_val, bgcolor, and data_val 
	const input = {
		labels: labels_val, //['MSFT', 'AAPL', 'AMZN'],
		datasets: [{
			label: "Shares",
			backgroundColor: bgcolor,//['#ff0000', '#ff9500', '#2d9c00'],
			data: data_val, //[6826.80, 20114.10, 585.60, 50.00],
		}]
	}

	return input;
}