(function($) {

	// document.ready
	$(function() {
		
		var person = {
			attributes: {
				"firstName": {
					type: "text"
				},
				"lastName": {
					type: "text"
				}
			}
		};

		$('.apeach').apeach([person]);
	});

})(jQuery);
