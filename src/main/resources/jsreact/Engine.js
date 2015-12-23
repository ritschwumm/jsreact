var jsreact	= jsreact || {};

jsreact.Engine	= {
	//------------------------------------------------------------------------------
	//## private
	
	subscribers:	[],
	currentTick:	{},
	nextTick:		{},
	propagating:	false,
	
	propagate: function() {
		if (this.propagating)	throw new Error("propagation already in progress");
		
		this.currentTick	= this.nextTick;
		this.nextTick		= {};
		
		this.propagating	= true;
		// cloned because observers might change the original array
		this.subscribers.slice().forEach(function(subscribers) {
			subscribers();
		});
		this.propagating	= false;
	},
	
	// (() -> Unit) -> (() -> Unit)
	subscribe: function(subscriber) {
		this.subscribers.push(subscriber);
		return this.unsubscribe.bind(this, subscriber);
	},
	
	// (() -> Unit) -> Boolean
	unsubscribe: function(subscriber) {
		var index	= this.subscribers.indexOf(subscriber);
		var found	= index !== -1;
		if (found)	this.subscribers.slice(index, 1);
		return found;
	}//,
};
