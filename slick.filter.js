// slick.filter Plugin
//
// Version 0.00
//
// (c) 2009-2010 Yellow Feather Ltd (http://www.yellowfeather.co.uk)
// All rights reserved.


jQuery.SlickFilter = function(parent, options) {
  var timeout = null;
  var lastValue = null;
  var nextCriterionIndex = 1;

  buildFilterForm(parent, options.columns);

  var columnSelect = $("#filter_criterion\\[0\\]_column", parent);
  columnSelect.change();

  function buildFilterForm(filterDiv, columns) {

    var form = $(document.createElement('form'))
      .attr("id", "filter_form")
      .addClass('inline');

    var fieldset = $(document.createElement('fieldset'));
    fieldset.append(buildFilterMatchRow());
    fieldset.append(buildFilterRow(0, columns));
    form.append(fieldset);

    filterDiv.append(form);
  }

  function buildFilterMatchRow() {
    var div = $(document.createElement('div'))
      .attr("id", "filter_match_row")
      .addClass("filter_match_row");
    div.append($(document.createElement('span')).text("Match "));

    var select = $(document.createElement('select')).attr("id", "filter_match").attr("name", "filter.match");
    select.append($(document.createElement('option')).attr("value", "any").text("Any"));
    select.append($(document.createElement('option')).attr("value", "all").text("All"));
    select.append($(document.createElement('option')).attr("value", "none").text("None"));
    div.append(select);

    select.change(function() {
      onFilterChange();
    });

    div.append($(document.createElement('span')).text(" of the following:"));
    return div;
  }

  function buildFilterRow(criterionIndex, columns) {
    var id = "filter_criterion[" + criterionIndex + "]_row";

    var div = $(document.createElement('div'))
      .attr("id", id)
      .addClass("filter_criterion_row");

    div.append(buildFilterSelectColumn(criterionIndex, columns));
    div.append(buildFilterSelectOperator(criterionIndex, columns));
    div.append(buildFilterValues(criterionIndex));
    div.append(buildFilterRowActions(criterionIndex, columns));

    return div;
  }

  function buildFilterSelectColumn(criterionIndex, columns) {
    var id = "filter_criterion[" + criterionIndex + "]_column";
    var name = "filter.criterion[" + criterionIndex + "].column";
    var select = $(document.createElement('select'))
      .attr("id", id)
      .attr("name", name)
      .addClass("filter_criterion_column");

    select.change(function() {
      var criterionIndex = getCriterionIndexFromId($(this));
      var column = getColumn(criterionIndex, columns);
      updateFilterSelectOperatorOptions(criterionIndex, column);

      var filterOperatorElement = $("#filter_criterion\\[" + criterionIndex + "\\]_operator");
      updateFilterInputs(criterionIndex, filterOperatorElement, columns);

      onFilterChange();
    });

    $.each(columns, function(index, column) {
      if (column.filterable) {
        select.append($(document.createElement('option')).attr("value", column.id).text(column.name));
      }
    });
    return select;
  }

  function buildFilterSelectOperator(criterionIndex, columns) {
    var id = "filter_criterion[" + criterionIndex + "]_operator";
    var name = "filter.criterion[" + criterionIndex + "].operator";
    var select = $(document.createElement('select'))
      .attr("id", id)
      .attr("name", name)
      .addClass("filter_criterion_operator");

    select.change(function() {
      var criterionIndex = getCriterionIndexFromId($(this));
      updateFilterInputs(criterionIndex, $(this), columns);
      onFilterChange();
    });

    return select;
  }

  function buildFilterValues(criterionIndex) {
    var id = "filter_criterion[" + criterionIndex + "]_values";
    var name = "filter.criterion[" + criterionIndex + "].values";

    var div = $(document.createElement('div'))
      .addClass("filter_criterion_values")
      .attr("id", id)
      .attr("name", name);

    return div;
  }

  function buildFilterRowActions(criterionIndex, columns) {
    var id = "filter_criterion[" + criterionIndex + "]_actions";
    var name = "filter.criterion[" + criterionIndex + "].actions";

    var div = $(document.createElement('div'))
      .addClass("filter_criterion_actions")
      .attr("id", id)
      .attr("name", name);

    var addCriterion = $(document.createElement('a'))
      .attr("href", "#");
    div.append(addCriterion);

    var addImage = $(document.createElement('img'))
      .attr("id", id + "_add")
      .addClass("filter_criterion_actions_add")
      .attr("alt", "Add Criterion")
      .attr("src", "../images/add-small.png")
      .click(function() {
        var criterionIndex = getCriterionIndexFromId($(this));
        addFilterRow(criterionIndex, columns);
      });
    addCriterion.append(addImage);

    var deleteCriterion = $(document.createElement('a'))
      .attr("href", "#");
    div.append(deleteCriterion);

    var deleteImage = $(document.createElement('img'))
      .attr("id", id + "_delete")
      .addClass("filter_criterion_actions_delete")
      .attr("alt", "Delete Criterion")
      .attr("src", "../images/delete-small.png")
      .click(function() {
        var criterionIndex = getCriterionIndexFromId($(this));
        deleteFilterRow(criterionIndex, columns);
      });
    deleteCriterion.append(deleteImage);

    return div;
  }

  function updateFilterSelectOperatorOptions(criterionIndex, column) {
    var select = $("#filter_criterion\\[" + criterionIndex + "\\]_operator");
    select.children().remove();

    var operators = getOperators(column.datatype);
    $.each(operators, function(index, operator) {
      select.append($(document.createElement('option')).attr("value", operator.value).text(operator.name));
    });
  }

  function updateFilterInputs(criterionIndex, element, columns) {
    var div = $("#filter_criterion\\[" + criterionIndex + "\\]_values");
    div.children().remove();

    var column = getColumn(criterionIndex, columns);
    var operators = getOperators(column.datatype);

    var numInputs = 1;
    var selectedOperator = element.val();
    $.each(operators, function(index, operator) {
      if (selectedOperator == operator.value) {
        numInputs = operator.numInputs;
      }
    });

    for (var index = 0; index < numInputs; index++) {
      if (index > 0) {
        div.append($(document.createElement('span')).text(" and "));
      }

      var id = "filter_criterion[" + criterionIndex + "]_values[" + index + "]";
      var name = "filter.criterion[" + criterionIndex + "].values[" + index + "]";

      if (column.datatype == "enum") {
        createSelect(div, column, id, name);
      }
      else {
        createInput(div, column, id, name);
      }
    }
  }

  function createSelect(parent, column, id, name) {
    var select = $(document.createElement('select'))
        .attr("id", id)
        .attr("name", name);

    select.append(new Option());
    $.each(column.values, function(index, value) {
      select.append($(document.createElement('option')).attr("value", value.value).text(value.text));
    });

    parent.append(select);

    select.change(function() { onFilterChange(); });
  }

  function createInput(parent, column, id, name) {
    var input = $(document.createElement('input'))
        .attr("id", id)
        .attr("name", name)
        .attr("type", "text");

    parent.append(input);

    if (column.datatype == "date") {
      input.datepicker({
        buttonImage: '../images/calendar.png',
        buttonImageOnly: true,
        dateFormat: 'dd/mm/yy',
        showButtonPanel: true,
        showOn: 'button',
        onSelect: function(dateText, inst) { onFilterChange(); }
      });
    }

    input.focus(function() {
      lastValue = $(this).val();
    })

    input.keyup(function(e) {
      if (timeout) {
        clearTimeout(timeout);
      }

      var value = $(this).val();
      if (value != lastValue) {
        lastValue = value;
        timeout = setTimeout(function() { onFilterChange(); }, options.delay);
      }
    })
  }

  function addFilterRow(criterionIndex, columns) {
    var id = "#filter_criterion\\[" + criterionIndex + "\\]_row";
    var newCriterionIndex = nextCriterionIndex++;
    $(id).after(buildFilterRow(newCriterionIndex, columns));

    var columnSelect = $("#filter_criterion\\[" + newCriterionIndex + "\\]_column");
    columnSelect.change();
  }

  function deleteFilterRow(criterionIndex, columns) {
    var id = "#filter_criterion\\[" + criterionIndex + "\\]_row";
    $(id).remove();
    onFilterChange();
  }

  function onFilterChange() {
    updateCriterionIds();
    options.onFilterChange();
  }

  function updateCriterionIds() {
    var form = $("#filter_form");

    var index = 0;
    $(".filter_criterion_row", form).each(function() {
      var div = $(this);

      var baseId = "filter_criterion[" + index + "]";
      var baseName = "filter.criterion[" + index + "]";
      div
        .attr("id", baseId + "_row")
        .attr("name", baseId + ".row");

      $(".filter_criterion_column", div)
        .attr("id", baseId + "_column")
        .attr("name", baseName + ".column");

      $(".filter_criterion_operator", div)
        .attr("id", baseId + "_operator")
        .attr("name", baseName + ".operator");

      var values = $(".filter_criterion_values", div);
      values
        .attr("id", baseId + "_values")
        .attr("name", baseName + ".values");

      var valuesIndex = 0;
      $("input", values).each(function() {
        $(this)
          .attr("id", baseId + "_values[" + valuesIndex + "]")
          .attr("name", baseName + ".values[" + valuesIndex + "]");
        valuesIndex++;
      });

      $(".filter_criterion_actions", div)
        .attr("id", baseId + "_actions")
        .attr("name", baseId + ".actions");

      $(".filter_criterion_actions_add", div)
        .attr("id", baseId + "_actions_add");

      $(".filter_criterion_actions_delete", div)
        .attr("id", baseId + "_actions_delete");

      index++;
    });
  }

  function getColumn(criterionIndex, columns) {
    var id = "#filter_criterion\\[" + criterionIndex + "\\]_column";
    var element = $(id);
    var val = element.val();
    var column;
    $.each(columns, function(index, value) { if (val == value.id) { column = value; } });
    return column;
  }

  function getCriterionIndexFromId(element) {
    var match = /\[(\d+)\]/.exec(element.attr("id"));
    return match[1];
  }

  function getOperators(datatype) {
    var operators;
    switch (datatype) {
      case 'date':
        operators = options.dateOperators;
        break;
      case 'enum':
        operators = options.enumOperators;
        break;
      case 'numeric':
        operators = options.numericOperators;
        break;
      case 'string':
        operators = options.stringOperators;
        break;
    }
    return operators;
  }

};

jQuery.fn.SlickFilter = function(columns, onFilterChange, options) {
	// Make sure options exists
  options = options || {};
  options.columns = columns;
  options.onFilterChange = onFilterChange;

	// Set default values for required options
	options = $.extend({
	  delay: 400,
	  dateOperators: [
        { value: 'equals', name: 'Equals', numInputs: 1 },
        { value: 'before', name: 'Before', numInputs: 1 },
        { value: 'after', name: 'After', numInputs: 1 },
        { value: 'between', name: 'Between', numInputs: 2 },
	      // { value: 'tomorrow', name: 'Tomorrow', numInputs: 1 },
	      // { value: 'today', name: 'Today', numInputs: 1 },
	      // { value: 'yesterday', name: 'Yesterday', numInputs: 1 },
	      // { value: 'next-week', name: 'Next Week', numInputs: 2 },
	      // { value: 'this-week', name: 'This Week', numInputs: 2 },
	      // { value: 'last-week', name: 'Last Week', numInputs: 2 },
	      // { value: 'next-month', name: 'Next Month', numInputs: 2 },
	      // { value: 'this-month', name: 'This Month', numInputs: 2 },
	      // { value: 'last-month', name: 'Last Month', numInputs: 2 },
	      // { value: 'next-quarter', name: 'Next Quarter', numInputs: 2 },
	      // { value: 'this-quarter', name: 'This Quarter', numInputs: 2 },
	      // { value: 'last-quarter', name: 'Last Quarter', numInputs: 2 },
	      // { value: 'next-year', name: 'Next Year', numInputs: 2 },
	      // { value: 'this-year', name: 'This Year', numInputs: 2 },
	      // { value: 'last-year', name: 'Last Year', numInputs: 2 },
	      // { value: 'year-to-date', name: 'Year To Date', numInputs: 2 }
	      // all dates in period
      ],
	  enumOperators: [
        { value: 'equals', name: 'Equals', numInputs: 1 },
        { value: 'does-not-equal', name: 'Does Not Equal', numInputs: 1 }
    	  // list
      ],
	  numericOperators: [
        { value: 'equals', name: 'Equals', numInputs: 1 },
        { value: 'does-not-equal', name: 'Does Not Equal', numInputs: 1 },
		    { value: 'greater-than', name: 'Greater Than', numInputs: 1 },
		    { value: 'greater-than-or-equal-to', name: 'Greater Than Or Equal To', numInputs: 1 },
		    { value: 'less-than', name: 'Less Than', numInputs: 1 },
		    { value: 'less-than-or-equal-to', name: 'Less Than Or Equal To', numInputs: 1 },
		    { value: 'between', name: 'Between', numInputs: 2 },
	      // Top 10
	      // Above Average
	      // Below Average
	      // list
      ],
	  stringOperators: [
        { value: 'equals', name: 'Equals', numInputs: 1 },
	      { value: 'does-not-equal', name: 'Does Not Equal', numInputs: 1 },
	      { value: 'begins-with', name: 'Begins With', numInputs: 1 },
	      { value: 'ends-with', name: 'Ends With', numInputs: 1 },
	      { value: 'contains', name: 'Contains', numInputs: 1 },
	      { value: 'does-not-contain', name: 'Does Not Contain', numInputs: 1 }
	      // list
      ]
    }, options);

	this.each(function() {
	  var parent = $(this);
	  new jQuery.SlickFilter(parent, options);
	});

	// Don't break the chain
	return this;
}

