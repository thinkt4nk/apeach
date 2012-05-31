(function($) {

	// document.ready
	$(function() {
		
		var person = {
			attributes: [
				{value: 'firstName', label: 'First Name', type: 'string'},
				{value: 'lastName', label: 'Last Name', type: 'number'},
			]
		};

		$('#apeach').apeach({
			model: person
		});
	});

})(jQuery);
