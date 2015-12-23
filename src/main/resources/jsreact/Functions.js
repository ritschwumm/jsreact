var jsreact	= jsreact || {};

jsreact.Functions	= {
	identity:	function(x) 	{ return x;	},
	constant:	function(x)		{ return function(_) { return x;		}; },
	compose:	function(a, b)	{ return function(x) { return a(b(x));	}; },
	andThen:	function(a, b)	{ return function(x) { return b(a(x));	}; }//,
};
