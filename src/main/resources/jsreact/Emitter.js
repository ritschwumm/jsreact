var jsreact	= jsreact || {};

jsreact.Emitter	= function() {
	this.listeners	= [];
};
jsreact.Emitter.prototype	= {
	/** call all listeners with the given value */
	fire: function(value) {
		this.listeners.forEach(function(it) { it(value); });
	},
	
	//------------------------------------------------------------------------------
	
	/** add a listener to be called on fire, returns a disposable */
	on: function(func) {
		this.listeners.push(func);
		var self	= this;
		return {
			dispose: function() {
				self.off(func);
			}
		};
	},
	
	/** remove a listener added with on */
	off: function(func) {
		var	index	= this.listeners.indexOf(func);
		if (index === -1)	return false;
		this.listeners.splice(index, 1);
		return true;
	},
	
	//------------------------------------------------------------------------------
	
	/** remove all listeners */
	dispose: function() {
		this.listeners	= [];
	}//,
};
