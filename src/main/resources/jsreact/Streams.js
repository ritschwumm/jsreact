var jsreact	= jsreact || {};

jsreact.Streams	= {
	// Stream[Nothing]
	never: function() {
		// TODO only a function because jsread.Functions may not be defined yet
		return new jsreact.Stream(
			jsreact.Functions.constant({
				change:	null,
				fire:	false//,
			})
		);
	},
	
	// T => Stream[T]
	always: function(change) {
		return new jsreact.Stream(
			jsreact.Functions.constant({
				change:	change,
				fire:	true//,
			})
		);
	},
	
	// T => Stream[T]
	once: function(change) {
		return new jsreact.Stream(function(currentTick, first) {
			return {
				change:	change,
				fire:	first//,
			};
		});
	},
	
	// (Stream[T], Stream[T]) => Stream[T]
	orElse: function(stream1, stream2) {
		return new jsreact.Stream(function(currentTick, first) {
			stream1.update(currentTick);
			stream2.update(currentTick);
			return {
				change:	stream1.fire ? stream1.change : stream2.change,
				fire:	stream1.fire || stream2.fire//,
			};
		});
	},
	
	// (Stream[T], Stream[T]) => Stream[Array[T]] (non-empty)
	merge: function(stream1, stream2) {
		return new jsreact.Stream(function(currentTick, first) {
			stream1.update(currentTick);
			stream2.update(currentTick);
			var changes	= [];
			if (stream1.fire)	changes.push(stream1.change);
			if (stream2.fire)	changes.push(stream2.change);
			return {
				change:	changes,
				fire:	changes.length !== 0//,
			};
		});
	},
	
	// (T => Boolean) => (Stream[T] => Stream[T])
	filter: function(pred) {
		return function(stream) {
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				return {
					change:	stream.change,
					fire:	stream.fire && pred(stream.change)//,
				};
			});
		};
	},
	
	// (T => Boolean) => (Stream[T] => Stream[T])
	filterNot: function(pred) {
		return jsreact.Streams.filter(function(it) {
			return !pred(it);
		});
	},
	
	// Stream[T] => Stream[T]
	notNull: function() {
		return jsreact.Streams.filter(function(it) {
			return it !== null;
		});
	},
	
	// (T => Boolean) => Stream[T] => { trues:Stream[T], falses:Stream[T] }
	partition: function(pred) {
		return function(stream) {
			return {
				trues:	jsreact.Streams.filter(pred)(stream),
				falses:	jsreact.Streams.filterNot(pred)(stream)//,
			};
		};
	},
	
	// Stream[Boolean] => Stream[Boolean]
	trues: function(stream) {
		return jsreact.Streams.filter(function(it) { return !!it; })(stream);
	},
	
	// Stream[Boolean] => Stream[Boolean]
	falses: function(stream) {
		return jsreact.Streams.filter(function(it) { return !it; })(stream);
	},
	
	// Stream[Boolean] => Stream[Boolean]
	not: function(stream) {
		return jsreact.Streams.map(function(it) { return !it; })(stream);
	},

	// (S => T) => (Stream[S] => Stream[T])
	map: function(func) {
		return function(stream) {
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				return {
					change:	stream.fire ? func(stream.change) : null,
					fire:	stream.fire//,
				};
			});
		};
	},
	
	// T => Stream[S] => Stream[T]
	tag: function(value) {
		return function(stream) {
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				return {
					change:	value,
					fire:	stream.fire//,
				};
			});
		};
	},
	
	// Stream[S => T] => (Stream[S] => Stream[T])
	ap: function(funcStream) {
		return function(changeStream) {
			return funcStream.flatMap(function(f) {
				changeStream.map(function(v) {
					return f(v);
				});
			});
		};
	},
	
	// (S => Stream[T]) => (Stream[S] => Stream[T])
	flatMap: function(func) {
		return function(stream) {
			return jsreact.Streams.flatten(jsreact.Streams.map(func)(stream));
		};
	},
	
	// Stream[Stream[T]] => Stream[T]
	flatten: function(streamStream) {
		var stream	= jsreact.Streams.never();
		return new jsreact.Stream(function(currentTick, first) {
			streamStream.update(currentTick);
			if (streamStream.fire) {
				stream	= streamStream.change;
			}
			stream.update(currentTick);
			return {
				change:	stream.change,
				fire:	stream.fire//,
			};
		});
	},
	
	// ((S1, S2) => T) => ((Stream[S1], Signal[S2]) => Stream[T])
	sample: function(func) {
		return function(stream, signal) {
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				signal.update(currentTick);
				return {
					change:	stream.fire ? func(stream.change, signal.value) : null,
					fire:	stream.fire//,
				};
			});
		};
	},
	
	// (Stream[S], Signal[T]) => Stream[T]
	sampleOnly: function(stream, signal) {
		return jsreact.Streams.sample(function(streamValue, signalValue) { return signalValue; })(stream, signal);
	},
	
	// Stream[T] => Signal[Boolean] => Stream[T]
	gated: function(stream) {
		return function(booleanSignal) {
			return booleanSignal.flatMapStream(function(enable) {
				return enable ? stream : jsreact.Streams.never();
			});
		};
	},
	
	// T => Stream[T] => Signal[T]
	hold: function(initial) {
		return function(stream) {
			return new jsreact.Signal(function(currentTick, first, previous) {
				stream.update(currentTick);
				return stream.fire ? stream.change : first ? initial : previous;
			});
		};
	},
	
	// ((T, S) => T) => T => Stream[S] => Stream[T]
	fold: function(func) {
		return function(initial) {
			var value	= initial;
			return function(stream) {
				return new jsreact.Stream(function(currentTick, first) {
					stream.update(currentTick);
					if (stream.fire) {
						value	= func(value, stream.change);
					}
					return {
						change:	value,
						fire:	stream.fire//,
					};
				});
			};
		};
	},
	
	// ((S, T) => { state:S, result:U }) => S => Stream[T] => Stream[U]
	stateful: function(func) {
		return function(initial) {
			var state	= initial;
			return function(stream) {
				return new jsreact.Stream(function(currentTick, first) {
					stream.update(currentTick);
					if (stream.fire) {
						var next	= func(state, stream.change);
						state		= next.state;
						return {
							change:	next.result,
							fire:	stream.fire//,
						};
					}
					else {
						return {
							change:	null,
							fire:	false//,
						};
					}
				});
			};
		};
	},
	
	// (S => Stream[{ state:S, result:U }]) => S => Stream[U]
	statefulLoop: function(func) {
		return function(initial) {
			var stream	= func(initial);
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				if (stream.fire) {
					var next	= stream.change;
					stream	= func(next.state);
					return {
						change:	next.result,
						fire:	true//,
					};
				}
				else {
					return {
						change:	null,
						fire:	false//,
					};
				};
			});
		};
	},
	
	// first stream to fire wins
	// Array[Stream[T]] => Stream[T]
	orElseMany: function(streamArray) {
		return new jsreact.Stream(function(currentTick, first) {
			streamArray.forEach(function(it) { it.update(currentTick); });
			for (var i=0; i<streamArray.length; i++) {
				var input	= streamArray[i];
				if (input.fire) {
					return {
						change:	input.change,
						fire:	true//,
					};
				}
			}
			return {
				change:	null,
				fire:	false//,
			};
		});
	},
	
	// NOTE this is not traverse, the outgoing array size changes (but is always non-zero)
	// Array[Stream[T]] => Stream[Array[T]]
	mergeMany: function(streamArray) {
		return new jsreact.Stream(function(currentTick, first) {
			streamArray.forEach(function(it) { it.update(currentTick); });
			var changes	= [];
			for (var i=0; i<streamArray.length; i++) {
				var input	= streamArray[i];
				if (input.fire) {
					changes.push(input.change);
				}
			}
			return {
				change:	changes,
				fire:	changes.length !== 0//,
			};
		});
	},
	
	//------------------------------------------------------------------------------
	
	// Stream[T]* => Stream[T]
	multiOrElse: function(/*streams*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return jsreact.Streams.orElseMany(inputs);
	},
	
	// Stream[T]* => Stream[Array[T]] (non-empty)
	multiMerge: function(/*streams*/) {
		var inputs	= Array.prototype.slice.call(arguments, 0);
		return jsreact.Streams.mergeMany(inputs);
	},
	
	//------------------------------------------------------------------------------
	
	// Array[Key] => Stream[{Key:_ ...}] => Hash[Key, Stream[_]]
	destruct: function(keys) {
		return function(stream) {
			var out	= {};
			for (var i=0; i<keys.length; i++) {
				var key		= keys[i];
				out[key]	= jsreact.Streams.pluck(key)(stream);
			}
			return out;
		};
	},
	
	// Key => Stream[{Key:X}] => Stream[X]
	pluck: function(key) {
		return function(stream) {
			return new jsreact.Stream(function(currentTick, first) {
				stream.update(currentTick);
				var fire	= stream.fire;
				return {
					change:	fire ? stream.change[key] : null,
					fire:	fire//,
				};
			});
		};
	},
	
	// Array[Key] => Stream[{Key:_ ...}] => Hash[Key, Stream[_]]
	destructOptional: function(keys) {
		return function(stream) {
			var out	= {};
			for (var i=0; i<keys.length; i++) {
				var key		= keys[i];
				out[key]	= jsreact.Streams.pluckOptional(key)(stream);
			}
			return out;
		};
	},
	
	// Key => Stream[{Key:X}] => Stream[X]
	pluckOptional: function(key) {
		return function(stream) {
			return new jsreact.Stream(function(currentTick,first) {
				stream.update(currentTick);
				var fire	= stream.fire && stream.change.hasOwnProperty(key);
				return {
					change:	fire ? stream.change[key] : null,
					fire:	fire//,
				};
			});
		};
	}//,
};
