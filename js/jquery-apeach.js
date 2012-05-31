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
			var event = $.Event(event_name);
			element.trigger(event, [data]);
		},
		getObjectKeys = function(object) {
			var keys = [];
			$.each(object, function(key, value) {
				keys.push(key);
			});
			return keys;
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
			this.elements.rules = {};
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
			triggerEvent(this.element, 'removegroup', {
				uid: uid
			});
		},
		_onGroupOperatorChange: function(e) {
			var 
				target = $(e.target),
				group_type = parseInt(target.val()),
				operator_text = null;

			switch (group_type)
			{
				case GROUP_TYPE_INCLUSION:
					operator_text = 'or';
					break;
				case GROUP_TYPE_EXCLUSION:
					operator_text = 'and';
					break;
			}
			this.element
				.find('.apeach-or-segment')
					.text(operator_text)
					.end()
				.find('.apeach-or-selection span')
					.text("Add '" + operator_text.toUpperCase() + "' statement");
			this.options.type = group_type;
		},
		_onGroupRuleMetricChange: function(e, data) {
			var target = $(e.target);
			if (data.selected != null) {
				var
					container = target.closest('.apeach-group-or'),
					related_operator = container.find('.group-rule-operator');
				// update the operator select's data provider
				var metric_operators = [];
				$.each(this.options.model.attributes, function(i, metric) {
					if (metric.value === data.selected) {
						metric_operators = operators[metric.type];
					}
				});
				related_operator.apeachselectbutton('option', 'dataProvider', metric_operators);
			}
		},
		_onRemoveRule: function(e) {
			var 
				target = $(e.target),
				rule_container = target.closest('.apeach-group-or'),
				rule_uid = rule_container.data('uid');

			// if more than one rule
			var keys = getObjectKeys(this.elements.rules);
			if (keys.length > 1) {
				if (rule_container.hasClass('first')) {
					rule_container.next('.apeach-add-or').remove();
					rule_container.next('.apeach-group-or').addClass('first');
				}
				else {
					rule_container.prev('.apeach-add-or').remove();
				}
				// remove rule
				rule_container.remove();
				delete this.elements.rules[rule_uid];
			}
			else {
				alert('You may not delete the only rule in this group.');
			}
		},
		_onCreateRule: function(e) {
			this._addRule();
		},
		//..........................................................................
		// Private Utility Methods
		//..........................................................................
		_bindEvents: function() {
			this.element.delegate('.remove-group', 'click', $.proxy(this._onRemoveGroup, this));
			this.element.delegate('.remove', 'click', $.proxy(this._onRemoveRule, this));
			this.element.delegate('select.group-operator-type', 'change', $.proxy(this._onGroupOperatorChange, this));
			this.element.delegate('.group-rule-metric', 'change', $.proxy(this._onGroupRuleMetricChange, this));
			this.element.delegate('.apeach-or-selection span', 'click', $.proxy(this._onCreateRule, this));
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
				rule_segment = $('<div/>').addClass('apeach-or-segment').text('or'),
				rule_selection = $('<div/>').addClass('apeach-or-selection').append($('<span/>').text("Add 'OR' statement")),
				rule_creator = $('<div/>').addClass('apeach-add-or').append(rule_segment, rule_selection);

			this.elements.ruleCreator = rule_creator.appendTo(this.element);
		},
		_addRule: function() {
			var 
				rule_container = $('<div/>').addClass('apeach-group-or'),
				metric_selector = $('<div/>').addClass('group-rule-metric'),
				operator_selector = $('<div/>').addClass('group-rule-operator');

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

			metric_selector.apeachselectbutton({dataProvider: metric_options, style: 'alt'});
			operator_selector.apeachselectbutton({dataProvider: operator_options});
			var delete_anchor = $('<a/>').addClass('remove').text('Delete');
			var rule_uid = guid();
			this.elements.rules[rule_uid] = rule_container;
			if (getObjectKeys(this.elements.rules).length > 1) {
				var operator_text = null;
				switch (this.options.type)
				{
					case GROUP_TYPE_INCLUSION:
						operator_text = 'or';
						break;
					case GROUP_TYPE_EXCLUSION:
						operator_text = 'and';
						break;
				}
				$('<div/>')
					.addClass('apeach-add-or')
					.append(
						$('<div/>').addClass('apeach-or-segment').text(operator_text)
					)
					.insertBefore(this.elements.ruleCreator);
			}
			else {
				rule_container.addClass('first');
			}
			rule_container
				.data('uid',rule_uid)
				.append(metric_selector, operator_selector, delete_anchor)
				.insertBefore(this.elements.ruleCreator);
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

})(jQuery);
