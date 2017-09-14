(function(){
	init();
	
	var waitForRequests = 2;	
	var globalPrice;
	var bit2cPrice;
	function init() {
		fetchGlobalPrice();	
		fetchBit2CPrice();	
	}
	
	function fetchGlobalPrice() {		
		$.getJSON("https://api.coinmarketcap.com/v1/ticker/bitcoin/?convert=ils",
		  function(data){
			  globalPrice = parseFloat(_.get(data, '[0].price_ils'));
			  //var priceUsd = _.get(data, '[0].price_usd');
			  if (globalPrice) {				  
				  $('.global-price').text(formatNum(globalPrice));
				  waitForRequests--;
				  finishLoading();
				  return;
			  }
			  showError();
		  }
		);
	}
	
	function fetchBit2CPrice() {		
		$.getJSON("http://query.yahooapis.com/v1/public/yql",
		  {
			q:      "select * from json where url=\"https://bit2c.co.il/Exchanges/BtcNis/Ticker.json?d=" + (new Date()).getTime() + "\"",
			format: "json"
		  },
		  function(data){
			  bit2cPrice = parseFloat(_.get(data, 'query.results.json.ll'));
			  if (bit2cPrice) {
				  $('.bit2c-price').text(formatNum(bit2cPrice));
				  waitForRequests--;
				  finishLoading();
				  return;
			}
			
			showError();
		  }
		);
	}
	
	function finishLoading() {
		if (waitForRequests > 0)
			return;
		
		var diff = bit2cPrice - globalPrice;
		$('.diff').text(formatNum(diff));
		$('.diff-percentage').text(formatNum(diff / globalPrice * 100));
		
		$('.loading').fadeOut();
	}	
	
	function formatNum(num) {
		return num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}	
})();