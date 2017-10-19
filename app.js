(function(){
	init();

	var waitForRequests;
	var globalPrice;
	var exchangePrices = {};
	var isAltCors = location && location.hash && /altcors/.test(location.hash);

	var lastIlsWorth = 0.29;

	function init() {
		fetchAll();
		setInterval(fetchAll, 5000);
	}

	function fetchAll() {
		if (waitForRequests > 0)
			return;

		waitForRequests = 3;
		fetchGlobalPrice();
		fetchBit2CPrice();
		fetchBoGPrice();
	}

	function fetchGlobalPrice() {
		fetchApi('http://preev.com/pulse/units:btc+ils/sources:bitfinex+bitstamp+btce', function(data) {
			if (data && data.btc && data.ils) {
				var prices = Object.keys(data.btc.usd).map(function(x) { return data.btc.usd[x].last; }).map(parseFloat);
				var avgUsdPrice = avg(prices);
				$('.global-price-usd .cur').text(formatNum(avgUsdPrice));
				var ilsToUsd = parseFloat(_.get(data, 'ils.usd.other.last'));
				if (Number.isNaN(ilsToUsd)) {
					console.log('Invalid ILStoUSD ' + _.get(data, 'ils.usd.other.last'));
				}
				else {
					lastIlsWorth = ilsToUsd;
				}
				globalPrice = avgUsdPrice / lastIlsWorth;
				$('.global-price').text(formatNum(globalPrice));
				finishLoading();
				return;
			}

			showFatalError();
		});
	}

	function fetchBit2CPrice() {
		fetchApi('https://bit2c.co.il/Exchanges/BtcNis/Ticker.json', function(data) {
			if (data && data.ll && data.l && data.h) {
				exchangePrices['bit2c-last-price'] = parseFloat(data.ll);
				exchangePrices['bit2c-buy'] = parseFloat(data.l);
				exchangePrices['bit2c-sell'] = parseFloat(data.h);
				finishLoading();
				return;
			}
			showError();
			finishLoading();
		});
	}

	function fetchBoGPrice() {
		fetchApi('https://www.bitsofgold.co.il/api/btc', function(data) {
			if (data && data.buy && data.sell) {
				exchangePrices['bog-buy'] = parseFloat(data.buy);
				exchangePrices['bog-sell'] = parseFloat(data.sell);
				finishLoading();
				return;
			}

			showError();
			finishLoading();
		});
	}

	function finishLoading() {
		waitForRequests--;
		if (waitForRequests > 0)
			return;

		Object.keys(exchangePrices).forEach(function(x) {
			setPrice(x, exchangePrices[x]);
		});

		$('.loading').fadeOut();
	}

	function setPrice(source, price) {
		$('.' + source + ' .price').text(formatNum(price));

		var diff = price - globalPrice;
		var posClass = diff == 0 ? '' : diff > 0 ? 'positive' : 'negative';
		$('.' + source + ' .diff').removeClass('positive negative').addClass(posClass).text(formatNum(diff));
		$('.' + source + ' .diff-percentage').removeClass('positive negative').addClass(posClass).text(formatNum(diff / globalPrice * 100));
	}
	window.setPrice = setPrice;

	function fetchApi(url, callback) {
		url += '?r=' + (new Date()).getTime();		
		if (!isAltCors) {
			$.getJSON("https://cors-anywhere.herokuapp.com/" + url,
				function(data) {
					callback(data);
				}
			);
			return;
		}
		
		$.getJSON("https://query.yahooapis.com/v1/public/yql",
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

	}

	function showFatalError() {
		$('.loading').text('Unkown error').show();
		waitForRequests = 9999;
		location.hash = isAltCors ? '' : 'altcors';
		setTimeout(function(){location.reload();}, 1500);
	}
})();
