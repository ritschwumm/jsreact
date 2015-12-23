var jsreact	= jsreact || {};

jsreact.Cell	= function(initial) {
	this.value		= initial;
	this.emitter	= new jsreact.Emitter();
};
jsreact.Cell.prototype	= {
	/** get the current value */
	get: function() {
		return this.value;
	},
	
	/** set a new value and notify listeners when it changed */
	set: function(it) {
		if (it != this.value) {
			this.value	= it;
			this.emitter.fire(it);
		}
	},
	
	/** modify the current value with a function and notify listeners when it changed */
	modify: function(func) {
		this.set(func(this.get()));
	},
	
	/** func returns a pair of new state and some result value which is returned from this function at the end */
	update: function(func) {
		var pair	= func(this.get());
		this.set(pair[0]);
		return pair[1];
	},
	
	//------------------------------------------------------------------------------
	
	/** add a listener to be called whenever the value changes, returns a disposable */
	onChange: function(func) {
		return this.emitter.on(func);
	},
	
	/** add a listener to be called immediately and whenever the value changes, returns a disposable */
	onValue: function(func) {
		func(this.get());
		return this.emitter.on(func);
	},
	
	/** remove a listener added with onChange or onValue */
	off: function(func) {
		this.emitter.off(func);
	},
	
	//------------------------------------------------------------------------------
	
	/** remove all listeners */
	dispose: function() {
		this.emitter.dispose();
	}//,
};
