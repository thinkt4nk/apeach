(function($) {

	/**
	 * A jQuery-UI Widget to build structured data about persistence queries
	 *
	 * @author Ryan Bales
	 * @version 0.1
	 */

	$.widget('demo.apeach', {
		options: {
			models: [],
			onSubmit: null // required handler, accepts single argument: the query's structured data representation
		},
		_create: function() {
			this.element.addClass('apeach-container');
		},
		_setOption: function(key, value) {
			// wrap any specific functionality here


      $.Widget.prototype._setOption.apply( this, arguments );
		},
		destroy: function() {
			// wrap any specific functionality here


			$.Widget.prototype.destroy.call(this);
		}
	});

})(jQuery);
