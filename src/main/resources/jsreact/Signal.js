var jsreact	= jsreact || {};

// calculate :: (Boolean, T) => T
jsreact.Signal	= function Signal(calculate) {
	this.calculate	= calculate;
	this.version	= null;
	this.value		= null;
	this.fire		= false;
};
jsreact.Signal.prototype	= {
	/** don't use unless you know what you're doing */
	currentValue: function() {
		return this.value;
	},
	
	//------------------------------------------------------------------------------
	//## syntax
	
	map:			function(func)			{ return jsreact.Signals.map(func)(this);			},
	ap:				function(func)			{ return jsreact.Signals.ap(func)(this);			},
	combine:		function(that, func)	{ return jsreact.Signals.combine(func)(this, that);	},
	zip:			function(that)			{ return jsreact.Signals.zip(this, that);			},
	unzip:			function()				{ return jsreact.Signals.unzip(this);				},
	flatMap:		function(func)			{ return jsreact.Signals.flatMap(func)(this);		},
	flatten:		function()				{ return jsreact.Signals.flatten(this);				},
	flatMapStream:	function(func)			{ return jsreact.Signals.flatMapStream(func)(this);	},
	flattenStream:	function()				{ return jsreact.Signals.flattenStream(this);		},
	changes:		function()				{ return jsreact.Signals.changes(this);				},
	combineMany:	function(func)			{ return jsreact.Signals.combineMany(func)(this);	},
	sequenceArray:	function()				{ return jsreact.Signals.sequenceArray(this);		},
	traverseArray:	function(func)			{ return jsreact.Signals.sequenceArray(func)(this);	},
	
	//------------------------------------------------------------------------------
	//## private
	
	update: function() {
		if (this.version === null) {
			this.version	= jsreact.Engine.currentTick;
			this.value		= this.calculate(true, null);
			this.fire		= false;
		}
		else if (this.version !== jsreact.Engine.currentTick) {
			this.version	= jsreact.Engine.currentTick;
			var previous	= this.value;
			this.value		= this.calculate(false, previous);
			this.fire		= this.value !== previous;
		}
	},
	
	notify: function(first, handler) {
		if (first || this.fire)	handler(this.value);
	}//,
};
