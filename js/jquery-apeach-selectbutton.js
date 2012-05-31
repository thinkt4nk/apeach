(function($) {

	// closure scope, used by both widget classes
	var
		/**
		 * Creates a unique identifier
		 * 
		 * @return {string} The unique identifier
		 */
		guid = function() {
			var S4 = function() {
				return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			};
			return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
		},
		/**
		 * Emits an event
		 * 
		 * @param {object} element a jQuery wrapped element to emit the event
		 * @param {string} event_name The name of the event
		 * @param {object} data The event data
		 * @return {void}
		 */
		triggerEvent = function(element, event_name, data) {
			var event = $.Event(event_name);
			element.trigger(event, [data]);
		};

	//============================================================================
	// Apeach Select Button Widget
	//============================================================================
	$.widget('demo.apeachselectbutton', {
		options: {
			dataProvider: [],
			style: null // {optional} May provide 'alt' to style with alt style
		},
		__hover: false,
		_create: function() {
			//console.log('selectbutton data provider::',this.options.dataProvider);
			this.elements = [];
			this._selected = null;
		},
		_init: function() {
			this._bindEvents();
			this._createSelectButton();
			this._createSelectOptions();
			this._repaint();
		},
		_setOption: function(key, value) {
			if (key === 'dataProvider') {
				this.options.dataProvider = value;
				this._selected = null;
				this._repaint();
			}
			else
				$.Widget.prototype._setOption.apply(this, arguments);
		},
		//..........................................................................
		// Event Handlers
		//..........................................................................
		_onButtonOptionClick: function(e) {
			e.stopPropagation();
			var
				target = $(e.target),
				selected = target.data('value'),
				event = {
					selected: selected
				};
			this._hideOptions();
			this.elements.options.detach();
			this.element
				.text(target.text())
				.append(this.elements.options);
			// update internal state
			this._selected = selected;
			triggerEvent(this.element, 'change', event);
		},
		//..........................................................................
		// Private Utility Methods
		//..........................................................................
		_bindEvents: function() {
			this.element.delegate('li.button-option', 'click', $.proxy(this._onButtonOptionClick, this));
			this.element.hover(
				$.proxy(this._showOptions, this),
				$.proxy(this._hideOptions, this)
			);
		},
		_showOptions: function() {
			this.elements.options.css({left: '-1px'});
		},
		_hideOptions: function() {
			this.elements.options.css({left: '-9999px'});
		},
		_createSelectButton: function() {
			var element_class = 'button-select';
			if (this.options.style != null && this.options.style === 'alt')
				element_class += '-alt';
			this.element.addClass(element_class);
		},
		_createSelectOptions: function() {
			this.elements.options = $('<ul/>').addClass('button-options');
			this.element.append(this.elements.options);
		},
		_repaint: function() {
			// empty options
			this.elements.options
				.detach()
				.html('');
			// rebuild options
			$.each(this.options.dataProvider, $.proxy(function(i, data) {
				var select_option = 
					$('<li/>')
						.addClass('button-option')
						.data('value',data.value)
						.text(data.label);
				this.elements.options.append(select_option);
				// set internal state for selected, and display in the select button
				if (
					(data.selected == null && i === 0) // nothing selected, but first in list
					|| (data.selected != null && data.selected === true)) // model attribute selected
				{
					select_option.addClass('selected');
					this.element.text(data.label);
					this._selected = data.value;
				}
			},this));
			this.element.append(this.elements.options);
		},
		//..........................................................................
		// Public Methods
		//..........................................................................
		getValue: function() {
			return this._selected;
		}
	});
})(jQuery);