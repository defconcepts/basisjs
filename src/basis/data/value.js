
 /**
  * Namespace overview:
  * - {basis.data.value.Property}
  * - {basis.data.value.ObjectSet}
  * - {basis.data.value.Expression}
  *
  * @see ./demo/data/basic.html
  *
  * @namespace basis.data.value
  */

  var namespace = this.path;


  // import names

  var cleaner = basis.cleaner;
  var basisData = require('basis.data');
  var AbstractData = basisData.AbstractData;
  var Value = basisData.Value;
  var ReadOnlyValue = basisData.ReadOnlyValue;
  var STATE = basisData.STATE;


 /**
  * @class
  */
  var Property = Value.subclass({
    className: namespace + '.Property',

    // use custom constructor
    extendConstructor_: false,

   /**
    * @param {object} initValue Initial value for object.
    * @param {object=} handler
    * @param {function()=} proxy
    * @constructor
    */
    init: function(initValue, handler, proxy){
      this.value = initValue;
      this.handler = handler;
      this.proxy = proxy;

      Value.prototype.init.call(this);
    }
  });


  //
  //  Object set
  //
                                       // priority: lowest -------------------------------------------------------------> highest
  var OBJECTSET_STATE_PRIORITY = STATE.priority; //[STATE.READY, STATE.DEPRECATED, STATE.UNDEFINED, STATE.ERROR, STATE.PROCESSING];
  var OBJECTSET_HANDLER = {
    stateChanged: function(){
      this.fire(false, true);
    },
    update: function(){
      this.fire(true);
    },
    change: function(){
      this.fire(true);
    },
    destroy: function(object){
      this.remove(object);
    }
  };

  var objectSetUpdater = basis.asap.schedule(function(object){
    object.update();
  });

 /**
  * @class
  */
  var ObjectSet = Value.subclass({
    className: namespace + '.ObjectSet',

   /**
    * @type {Array.<basis.data.Object>}
    */
    objects: null,

   /**
    * @inheritDoc
    */
    value: 0,

   /**
    * @type {boolean}
    * @private
    */
    valueChanged_: false,

   /**
    * @type {function}
    */
    calculateValue: function(){
      return this.value + 1;
    },

   /**
    * @type {boolean}
    */
    calculateOnInit: false,

   /**
    * @type {Array.<basis.data.STATE>}
    */
    statePriority: OBJECTSET_STATE_PRIORITY,

   /**
    * @type {boolean}
    * @private
    */
    stateChanged_: true,

   /**
    * @constructor
    */
    init: function(){
      Value.prototype.init.call(this);

      var objects = this.objects;
      this.objects = [];

      if (objects && Array.isArray(objects))
      {
        this.lock();
        this.add.apply(this, objects);
        this.unlock();
      }

      this.valueChanged_ = this.stateChanged_ = !!this.calculateOnInit;
      this.update();
    },

   /**
    * Adds one or more AbstractData instances to objects collection.
    * @param {...basis.data.AbstractData} objects
    */
    add: function(/* dataObject1 .. dataObjectN */){
      for (var i = 0, len = arguments.length; i < len; i++)
      {
        var object = arguments[i];
        if (object instanceof AbstractData)
        {
          if (basis.array.add(this.objects, object))
            object.addHandler(OBJECTSET_HANDLER, this);
        }
        else
        {
          /** @cut */ basis.dev.warn(this.constructor.className + '#add: Instance of AbstractData required');
        }
      }

      this.fire(true, true);
    },

   /**
    * Removes AbstractData instance from objects collection.
    * @param {basis.data.AbstractData} object
    */
    remove: function(object){
      if (basis.array.remove(this.objects, object))
        object.removeHandler(OBJECTSET_HANDLER, this);

      this.fire(true, true);
    },

   /**
    * Removes all AbstractData instances from objects collection.
    */
    clear: function(){
      for (var i = 0, object; object = this.objects[i]; i++)
        object.removeHandler(OBJECTSET_HANDLER, this);

      this.objects.length = 0;

      this.fire(true, true);
    },

   /**
    * @param {boolean=} valueChanged
    * @param {boolean=} stateChanged
    */
    fire: function(valueChanged, stateChanged){
      if (!this.locked)
      {
        this.valueChanged_ = this.valueChanged_ || !!valueChanged;
        this.stateChanged_ = this.stateChanged_ || !!stateChanged;

        if (this.valueChanged_ || this.stateChanged_)
          objectSetUpdater.add(this);
      }
    },

   /**
    * Makes object not sensitive for attached AbstractData changes.
    */
    lock: function(){
      this.locked = true;
    },

   /**
    * Makes object sensitive for attached AbstractData changes.
    */
    unlock: function(){
      this.locked = false;
    },

   /**
    * @private
    */
    update: function(){
      var valueChanged = this.valueChanged_;
      var stateChanged = this.stateChanged_;

      this.valueChanged_ = false;
      this.stateChanged_ = false;

      objectSetUpdater.remove(this);

      if (!cleaner.globalDestroy)
      {
        if (valueChanged)
          this.set(this.calculateValue());

        if (stateChanged)
        {
          var len = this.objects.length;
          if (!len)
            this.setState(STATE.UNDEFINED);
          else
          {
            var maxWeight = -2;
            var curObject;

            for (var i = 0; i < len; i++)
            {
              var object = this.objects[i];
              var weight = this.statePriority.indexOf(String(object.state));
              if (weight > maxWeight)
              {
                curObject = object;
                maxWeight = weight;
              }
            }

            if (curObject)
              this.setState(curObject.state, curObject.state.data);
          }
        }
      }
    },

   /**
    * @destructor
    */
    destroy: function(){
      this.lock();
      this.clear();

      objectSetUpdater.remove(this);

      Value.prototype.destroy.call(this);
    }
  });


  //
  // Expression
  //

  var EXPRESSION_BBVALUE_HANDLER = function(){
    objectSetUpdater.add(this);
  };
  var EXPRESSION_BBVALUE_DESTROY_HANDLER = function(){
    this.destroy();
  };
  var BBVALUE_GETTER = function(value){
    return value.bindingBridge.get(value);
  };

 /**
  * @class
  */
  var Expression = ReadOnlyValue.subclass({
    className: namespace + '.Expression',

    calc_: null,
    values_: null,

    // use custom constructor
    extendConstructor_: false,
    init: function(/* [[value,] value, ..] calc */){
      ReadOnlyValue.prototype.init.call(this);

      var count = arguments.length - 1;
      var calc = arguments[count];

      if (typeof calc != 'function')
        throw new Error(this.constructor.className + ': Last argument of constructor must be a function');

      for (var values = new Array(count), i = 0; i < count; i++)
      {
        var value = values[i] = arguments[i];

        if (!value.bindingBridge)
          throw new Error(this.constructor.className + ': bb-value required');

        value.bindingBridge.attach(value, EXPRESSION_BBVALUE_HANDLER, this, EXPRESSION_BBVALUE_DESTROY_HANDLER);
      }

      this.calc_ = calc;
      this.values_ = values;
      this.update();
    },

    // override in init
    update: function(){
      objectSetUpdater.remove(this);
      Value.prototype.set.call(this, this.calc_.apply(null, this.values_.map(BBVALUE_GETTER)));
    },

    destroy: function(){
      objectSetUpdater.remove(this);

      for (var i = 0, value; value = this.values_[i]; i++)
        value.bindingBridge.detach(value, EXPRESSION_BBVALUE_HANDLER, this);

      ReadOnlyValue.prototype.destroy.call(this);
    }
  });


  //
  // export names
  //

  module.exports = {
    Property: Property,
    ObjectSet: ObjectSet,
    Expression: Expression
  };
