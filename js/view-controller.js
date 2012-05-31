(function($) {

	// document.ready
	$(function() {
		
		var person = {
			attributes: [
				{value: 'firstName', label: 'First Name', type: 'string'},
				{value: 'lastName', label: 'Last Name', type: 'number'},
			]
		};

		var apeach_container = $('#apeach');
		apeach_container.apeach({
			model: person
		});

		$('#submitButton').click(function() {
			console.log('query::',apeach_container.apeach('getQuery'));
		});
	});

})(jQuery);
