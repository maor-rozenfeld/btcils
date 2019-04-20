(function(){
	var waitForRequests;
	var globalPrice;
	var exchangePrices = {};
	var lastIlsWorth = 0.29;
	var updated;
	var updatedTimeout;

	init();

	function init() {
		fetchAll();
		setInterval(fetchAll, 5000);
	}

	function fetchAll() {
		if (waitForRequests > 0)
			return;

		waitForRequests = 3;
		$.getJSON("http://btcils-server.apphb.com/get-prices").then(function(x){ 		
			x = x || {};
			var previousPrice = globalPrice;
			fetchGlobalPrice(x.preev);
			fetchBit2CPrice(x.btc);
			fetchBoGPrice(x.bog);
			if (globalPrice != previousPrice) {
				updated = 0;
				showUpdateTime();
			}
		}).catch(function(err) { console.log('Fatal error in get-prices API'); console.log(err); showFatalError(); });;
	}

	function showUpdateTime() {
		$('.updated').text('Last updated ' + updated + ' second(s) ago');
		updated++;
		clearTimeout(updatedTimeout);
		updatedTimeout = setTimeout(showUpdateTime, 1000);
	}

	function fetchGlobalPrice(data) {
		data = JSON.parse(data);
		if (!data || !data.btc || !data.ils) {
			showError();
			finishLoading();
		}
		
		var prices = Object.keys(data.btc.usd)
			.filter(function(x) { return data.btc.usd[x] && data.btc.usd[x].last; })
			.map(function(x) { return data.btc.usd[x].last; })
			.map(parseFloat);
		var avgUsdPrice = avg(prices);
				var formattedUsdPrice = formatNum(avgUsdPrice);
				$('.global-price-usd .cur').text(formattedUsdPrice);
		var ilsToUsd = parseFloat(_.get(data, 'ils.usd.other.last'));
		if (Number.isNaN(ilsToUsd)) {
			console.log('Invalid ILStoUSD ' + _.get(data, 'ils.usd.other.last'));
		}
		else {
			lastIlsWorth = ilsToUsd;
		}
		globalPrice = avgUsdPrice / lastIlsWorth;
		var formattedIlsPrice = formatNum(globalPrice);
		$('.global-price').text(formattedIlsPrice);
		$(document).attr("title", "₪ " + formattedIlsPrice + " ($" + formattedUsdPrice + ") Bitcoin Price in ILS ");
		finishLoading();
		return;
		
	}

	function fetchBit2CPrice(data) {
		        try {
				data = JSON.parse(data);
				if (data && data.ll && data.l && data.h) {
					exchangePrices['bit2c-last-price'] = parseFloat(data.ll);
					exchangePrices['bit2c-buy'] = parseFloat(data.l);
					exchangePrices['bit2c-sell'] = parseFloat(data.h);
					finishLoading();
					return;
				}
			}
			catch {
			}
			showError();
			finishLoading();
		
	}

	function fetchBoGPrice(data) {
			try {
				/*bog: "{"btc_spot":{"ILS":19097.33654433701,"EUR":4724.94732843,"USD":5313.07},
					"eth_spot":{"ILS":623.4325514898817,"EUR":154.24590553659735,"USD":173.44517015},
						"buy_btc":{"ILS":20305.514667024996,"USD":5649.197235513025,"EUR":5023.867441180223},
							"buy_eth":{"ILS":662.8735263050311,"USD":184.4180437533227,"EUR":164.00415261732837},
								"sell_btc":{"ILS":17961.045019948957,"USD":4996.942335,"EUR":4443.812962388415},
								"sell_eth":{"ILS":586.3383146762337,"USD":163.125182526075,"EUR":145.0682741571698}}"
								*/
				data = JSON.parse(data);
				if (data && data.buy_btc && data.sell_btc) {
					exchangePrices['bog-buy'] = parseFloat(data.buy_btc.ILS);
					exchangePrices['bog-sell'] = parseFloat(data.sell_btc.ILS);
					finishLoading();
					return;
				}
			}
			catch {
			}
			showError();
			finishLoading();
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
		//setTimeout(function(){location.reload();}, 1500);
	}
})();
