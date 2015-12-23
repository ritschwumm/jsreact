var jsreact	= jsreact || {};

jsreact.Engine	= {
	//------------------------------------------------------------------------------
	//## public
	
	onPropagationError:	function(e) {},
	
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
		var subscribersCopy	= this.subscribers.slice();
		for (var i=0; i<subscribersCopy.length; i++) {
			try {
				subscribersCopy[i]();
			}
			catch (e) {
				this.onPropagationError(e);
			}
		}
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
