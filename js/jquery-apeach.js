(function($) {

	/**
	 * A jQuery-UI Widget to build structured data about persistence queries
	 *
	 * @author Ryan Bales
	 * @version 0.1
	 */

	// closure scope, used by both widget classes
	var
		// "constants" for group types
		GROUP_TYPE_INCLUSION = 0,
		GROUP_TYPE_EXCLUSION = 1,
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
			var event = $.Event(event_name, data);
			element.trigger(event);
		};

	//============================================================================
	// Apeach Controller Widget
	//============================================================================
	$.widget('demo.apeach', {
		options: {
			model: {},
			operators: null // {optional} custom operators
		},
		elements: {
			groups: {}
		},
		//..........................................................................
		// Overriden Methods
		//..........................................................................
		/**
		 * Creation Method
		 * 
		 * @return {void}
		 */
		_create: function() {
			this.element.addClass('apeach-container');
		},
		/**
		 * Initialize all elements
		 * 
		 * @return {void}
		 */
		_init: function() {
			this._bindEvents();
			this._initializeGroupCreator();
			this._addGroup(GROUP_TYPE_INCLUSION);
		},
		/**
		 * Destructor
		 * 
		 * @return {void}
		 */
		destroy: function() {
			delete this.elements;
			this.element.children().remove();
			$.Widget.prototype.destroy.call(this);
		},

		//..........................................................................
		// Event Handlers
		//..........................................................................
		_onRemoveGroup: function(e, data) {
			if (data.uid == null)
				return;

			this.elements.groups[data.uid]
				.apeachgroup('destroy')
				.remove();
			delete this.elements.groups[data.uid];
		},
		_onCreateGroup: function(e) {
			var
				target = $(e.target),
				group_type = parseInt(target.val());
			this._addGroup(group_type);
		},
		//..........................................................................
		// Private Utility Methods
		//..........................................................................
		_bindEvents: function() {
			this.element.bind('removegroup', $.proxy(this._onRemoveGroup, this));
			this.element.delegate('.apeach-and-selection select', 'change', $.proxy(this._onCreateGroup, this));
		},
		_initializeGroupCreator: function() {
			var
				and_segment = $('<div/>').addClass('apeach-and-segment').text('and'),
				and_selection = $('<div/>')
					.addClass('apeach-and-selection')
					.append($('<span/>').text("Add 'AND' statement")),
				group_creator = $('<div/>')
					.addClass('apeach-add-and')
					.append(and_segment)
					.append(and_selection);
			this.elements.groupSelection = and_selection;
			this.elements.groupCreator = group_creator;
			group_creator.appendTo(this.element);
		},
		_addGroup: function(group_type) {
			var 
				model = this.options.model,
				operators = this.options.operators,
				uid = guid(),
				group_div = $('<div/>').apeachgroup({
					model: model,
					operators: operators,
					type: group_type,
					uid: uid
				});
			this.elements.groups[uid] = group_div;
			this.elements.groupCreator.before(group_div);
		},

		//..........................................................................
		// Public Methods
		//..........................................................................
		getQuery: function() {
			var groups = [];
			$.each(this.elements.groups, function(uid, group) {
				groups.push(group.apeachgroup('getQuery'));
			});
			return {groups: groups};
		}
	});


	//============================================================================
	// Apeach Group Widget
	//============================================================================
	// closure scope, used by group widget
	var operators = {
		'string': [
			{value: 'eq_text', label: 'Equals'},
			{value: 'has', label: 'Contains'},
			{value: 'noteq_text', label: 'Not Equal To'}
		],
		'number': [
			{value: 'eq_number', label: 'Equals'},
			{value: 'lt', label: 'Less Than'},
			{value: 'gt', label: 'Greater Than'},
			{value: 'noteq_number', label: 'Not Equal To'}
		]
	}
	$.widget('demo.apeachgroup', {
		options: {
			model: {},
			type: null, // {required} The type of group
			uid: null, // {required} The uid of group
			operatorSelectText: 'Group Operator Type: ' // override not currently supported
		},
		elements: {
			rules: {}
		},
		//..........................................................................
		// Overriden Methods
		//..........................................................................
		/**
		 * Creation Method
		 * 
		 * @return {void}
		 */
		_create: function() {
			this.element.addClass('apeach-group');
		},
		/**
		 * Initialize all elements
		 * 
		 * @return {void}
		 */
		_init: function() {
			this._bindEvents();
			this._installRemoveGroup();
			this._installGroupTypeSelector();
			this._installRuleCreator();
			this._addRule();
		},
		/**
		 * Destructor
		 * 
		 * @return {void}
		 */
		destroy: function() {
			delete this.elements;
			this.element.children().remove();
			$.Widget.prototype.destroy.call(this);
		},

		//..........................................................................
		// Event Handlers
		//..........................................................................
		_onRemoveGroup: function(e) {
			var uid = this.options.uid;
			triggerEvent(this.element, 'removegroup', $.extend(e, {
				uid: uid
			}));
		},
		_onGroupOperatorChange: function(e) {
			// stub
		},
		_onGroupRuleMetricChange: function(e) {

		},
		//..........................................................................
		// Private Utility Methods
		//..........................................................................
		_bindEvents: function() {
			this.element.delegate('.remove-group', 'click', $.proxy(this._onRemoveGroup, this));
			this.element.delegate('select.group-operator-type', 'change', $.proxy(this._onGroupOperatorChange, this));
			this.element.delegate('select.group-rule-metric', 'change', $.proxy(this._onGroupRuleMetricChange, this));
		},
		_installRemoveGroup: function() {
			var remove_element = $('<div/>').addClass('remove-group').text('Remove');
			this.element.append(remove_element);
		},
		_installGroupTypeSelector: function() {
			// create the elements for the group type selection
			var
				operator_select = 
					$('<select/>')
						.addClass('group-operator-type'),
				operator_select_label =
					$('<label/>').text(this.options.operatorSelectText);
				operator_container =
					$('<div/>')
						.addClass('apeach-operator-type')
						.append(operator_select_label)
						.append(operator_select);
			// create list for options, using the type constants
			var operator_options = [];
			operator_options[GROUP_TYPE_INCLUSION] = 'Inclusion';
			operator_options[GROUP_TYPE_EXCLUSION] = 'Exclusion';
			// build the options for the select
			$.each(operator_options, $.proxy(function(i, label) {
				var option = $('<option/>').val(i).text(label);
				// if type is this group's type, set selected
				if (i === this.options.type)
					option.attr('selected','selected');
				operator_select.append(option);
			},this));
			// add to this element
			this.element.append(operator_container);
		},
		_installRuleCreator: function() {
			var 
				rule_container = $('<div/>').addClass('apeach-group-or'),
				metric_selector = $('<div/>').addClass('group-rule-metric'),
				operator_selector = $('<div/>');

			// build the options for the metric and operator
			var 
				metric_options = [],
				operator_options = [];
			$.each(this.options.model.attributes, function(i, metric_definition) {
				var 
					label = metric_definition.label || metric_definition.value,
					metric_option = {value: metric_definition.value, label: label};
				// build the operator options for the first metric, set selected
				if (operator_options.length < 1) {
					// set first metric selected
					metric_option.selected = true;
					// build operator options
					if (metric_definition.type != null) {
						$.each(operators[metric_definition.type], function(j, metric_operator_definition) {
							var operator_option = $.extend({}, metric_operator_definition);
							if (operator_options.length < 1)
								operator_option.selected = true;
							operator_options.push(operator_option);
						});
					}
					else {
						throw new Exception('You must provide an operator type for this metric');
					}	
				}
				metric_options.push(metric_option);
			});

			metric_selector.apeachselectbutton({dataProvider: metric_options});
			operator_selector.apeachselectbutton({dataProvider: operator_options});
			rule_container
				.append(metric_selector, operator_selector)
				.appendTo(this.element);
		},
		_addRule: function() {

		},

		//..........................................................................
		// Public Methods
		//..........................................................................
		getQuery: function() {
			// stub
		},
		getType: function() {
			return this.options.type;
		}
	});

	//============================================================================
	// Apeach Select Button Widget
	//============================================================================
	$.widget('demo.apeachselectbutton', {
		options: {
			dataProvider: [],
			style: null // {optional} May provide 'alt' to style with alt style
		},
		selected: null,
		_create: function() {
			console.log('selectbutton data provider::',this.options.dataProvider);
		},
		_init: function() {

		},
		_setOption: function(key, value) {
			if (key === 'dataProvider') {
				this.options.dataProvider = value;
				this.selected = null;
				this._repaint();
			}
			else
				$.Widget.prototype._setOption.apply(this, arguments);
		},
		//..........................................................................
		// Event Handlers
		//..........................................................................

		//..........................................................................
		// Private Utility Methods
		//..........................................................................
		_repaint: function() {

		},
		//..........................................................................
		// Public Methods
		//..........................................................................
		getValue: function() {
			// stub
		},
		setSelected: function(selected) {
			// stub
		}
	});
})(jQuery);
