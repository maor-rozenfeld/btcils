(function(){
	init();

	var waitForRequests = 3;
	var globalPrice;
	var bit2cPrice;
	var bogBuy;
	var bogSell;
	function init() {
		fetchGlobalPrice();
		fetchBit2CPrice();
		fetchBoGPrice();
	}

	function fetchGlobalPrice() {
		fetchApi('http://preev.com/pulse/units:btc+ils/sources:bitfinex+bitstamp+btce', function(data) {
			if (data && data.btc && data.ils) {
				var prices = Object.keys(data.btc.usd).map(function(x) { return data.btc.usd[x].last; }).map(parseFloat);
				console.log(prices);
				globalPrice = avg(prices) / data.ils.usd.other.last;
				$('.global-price').text(formatNum(globalPrice));
				finishLoading();
				return;
			}
			showError();
		});
	}

	function fetchBit2CPrice() {
		fetchApi('https://bit2c.co.il/Exchanges/BtcNis/Ticker.json', function(data) {
			bit2cPrice = parseFloat(_.get(data, 'll'));
			if (bit2cPrice) {
				$('.bit2c-price').text(formatNum(bit2cPrice));
				finishLoading();
				return;
			}

			showError();
		});
	}

	function fetchBoGPrice() {
		fetchApi('https://www.bitsofgold.co.il/api/btc', function(data) {
				if (data && data.buy && data.sell) {
					bogBuy = parseFloat(data.buy);
					bogSell = parseFloat(data.sell);
					$('.bog-buy').text(formatNum(bogBuy));
					$('.bog-sell').text(formatNum(bogSell));
					finishLoading();
					return;
				}

				showError();
		});
	}

	function finishLoading() {
		waitForRequests--;
		if (waitForRequests > 0)
			return;

		setDiff('bit2c', bit2cPrice);
		setDiff('bog-buy', bogBuy);
		setDiff('bog-sell', bogSell);		

		$('.loading').fadeOut();
	}

	function setDiff(source, price) {
		var diff = price - globalPrice;
		$('.' + source + '-diff').text(formatNum(diff));
		$('.' + source + '-diff-percentage').text(formatNum(diff / globalPrice * 100));
	}

	function fetchApi(url, callback) {
		url += '?r=' + (new Date()).getTime();
		$.getJSON("http://query.yahooapis.com/v1/public/yql",
			{ q: "select * from json where url=\"" + url + "\"", format: "json" },
			function(data) {
				callback(_.get(data, 'query.results.json'));
			}
		);
	}

	function formatNum(num) {
		return num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function avg(nums) {
		return nums.reduce(function(a,b,c,arr){ return a + b / arr.length; },0);
	}

	function showError() {
		alert('Unkown error');
		location.reload();
	}
})();
