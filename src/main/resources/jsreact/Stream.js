var jsreact	= jsreact || {};

// calculate :: (Boolean) => { change:T, fire:Boolean }
jsreact.Stream	= function Stream(calculate) {
	this.calculate	= calculate;
	this.version	= null;
	this.change		= null;
	this.fire		= false;
};
jsreact.Stream.prototype	= {
	//------------------------------------------------------------------------------
	//## syntax
	
	orElse:				function(that)			{ return jsreact.Streams.orElse(this, that);			},
	merge:				function(that)			{ return jsreact.Streams.merge(this, that);				},
	filter:				function(pred)			{ return jsreact.Streams.filter(pred)(this);			},
	filterNot:			function(pred)			{ return jsreact.Streams.filterNot(pred)(this);			},
	notNull:			function()				{ return jsreact.Streams.notNull()(this);				},
	map:				function(func)			{ return jsreact.Streams.map(func)(this); 				},
	tag:				function(value)			{ return jsreact.Streams.tag(value)(this); 				},
	ap:					function(valueStream)	{ return jsreact.Streams.ap(this)(valueStream); 		},
	flatMap:			function(streamFunc)	{ return jsreact.Streams.flatMap(streamFunc)(this); 	},
	flatten:			function()				{ return jsreact.Streams.flatten(this);				 	},
	sample:				function(signal, func)	{ return jsreact.Streams.sample(func)(this, signal);	},
	sampleOnly:			function(signal)		{ return jsreact.Streams.sampleOnly(this, signal);		},
	gated:				function(boolSignal)	{ return jsreact.Streams.gated(this)(boolSignal);		},
	hold:				function(initial)		{ return jsreact.Streams.hold(initial)(this);			},
	fold:				function(initial, func)	{ return jsreact.Streams.fold(func)(initial)(this);		},
	stateful:			function(initial, func)	{ return jsreact.Streams.stateful(func)(initial)(this);	},
	partition:			function(pred)			{ return jsreact.Streams.partition(pred)(this);			},	
	pluck:				function(key)			{ return jsreact.Streams.pluck(key)(this);				},
	destruct:			function(keys)			{ return jsreact.Streams.destruct(keys)(this);			},
	pluckOptional:		function(key)			{ return jsreact.Streams.pluckOptional(key)(this);		},
	destructOptional:	function(keys)			{ return jsreact.Streams.destructOptional(keys)(this);	},
	trues:				function()				{ return jsreact.Streams.trues(this);					},
	falses:				function()				{ return jsreact.Streams.falses(this);					},
	not:				function()				{ return jsreact.Streams.not(this);						},
	
	//------------------------------------------------------------------------------
	//## private
	
	update: function(currentTick) {
		if (this.version === null) {
			this.version	= currentTick;
			var next		= this.calculate(currentTick, true);
			this.change		= next.change;
			this.fire		= next.fire;
		}
		else if (this.version !== currentTick) {
			this.version	= currentTick;
			var next		= this.calculate(currentTick, false);
			this.change		= next.change;
			this.fire		= next.fire;
		}
	},
	
	notify: function(first, handler) {
		if (this.fire)	handler(this.change);
	}//,
};
