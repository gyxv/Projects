(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.development.js
  var require_react_development = __commonJS({
    "node_modules/react/cjs/react.development.js"(exports, module) {
      "use strict";
      if (true) {
        (function() {
          "use strict";
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
          }
          var ReactVersion = "18.2.0";
          var REACT_ELEMENT_TYPE = Symbol.for("react.element");
          var REACT_PORTAL_TYPE = Symbol.for("react.portal");
          var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
          var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
          var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
          var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
          var REACT_CONTEXT_TYPE = Symbol.for("react.context");
          var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
          var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
          var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
          var REACT_MEMO_TYPE = Symbol.for("react.memo");
          var REACT_LAZY_TYPE = Symbol.for("react.lazy");
          var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
          var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
          var FAUX_ITERATOR_SYMBOL = "@@iterator";
          function getIteratorFn(maybeIterable) {
            if (maybeIterable === null || typeof maybeIterable !== "object") {
              return null;
            }
            var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
            if (typeof maybeIterator === "function") {
              return maybeIterator;
            }
            return null;
          }
          var ReactCurrentDispatcher = {
            /**
             * @internal
             * @type {ReactComponent}
             */
            current: null
          };
          var ReactCurrentBatchConfig = {
            transition: null
          };
          var ReactCurrentActQueue = {
            current: null,
            // Used to reproduce behavior of `batchedUpdates` in legacy mode.
            isBatchingLegacy: false,
            didScheduleLegacyUpdate: false
          };
          var ReactCurrentOwner = {
            /**
             * @internal
             * @type {ReactComponent}
             */
            current: null
          };
          var ReactDebugCurrentFrame = {};
          var currentExtraStackFrame = null;
          function setExtraStackFrame(stack) {
            {
              currentExtraStackFrame = stack;
            }
          }
          {
            ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
              {
                currentExtraStackFrame = stack;
              }
            };
            ReactDebugCurrentFrame.getCurrentStack = null;
            ReactDebugCurrentFrame.getStackAddendum = function() {
              var stack = "";
              if (currentExtraStackFrame) {
                stack += currentExtraStackFrame;
              }
              var impl = ReactDebugCurrentFrame.getCurrentStack;
              if (impl) {
                stack += impl() || "";
              }
              return stack;
            };
          }
          var enableScopeAPI = false;
          var enableCacheElement = false;
          var enableTransitionTracing = false;
          var enableLegacyHidden = false;
          var enableDebugTracing = false;
          var ReactSharedInternals = {
            ReactCurrentDispatcher,
            ReactCurrentBatchConfig,
            ReactCurrentOwner
          };
          {
            ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
            ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
          }
          function warn(format) {
            {
              {
                for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                  args[_key - 1] = arguments[_key];
                }
                printWarning("warn", format, args);
              }
            }
          }
          function error(format) {
            {
              {
                for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                  args[_key2 - 1] = arguments[_key2];
                }
                printWarning("error", format, args);
              }
            }
          }
          function printWarning(level, format, args) {
            {
              var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
              var stack = ReactDebugCurrentFrame2.getStackAddendum();
              if (stack !== "") {
                format += "%s";
                args = args.concat([stack]);
              }
              var argsWithFormat = args.map(function(item) {
                return String(item);
              });
              argsWithFormat.unshift("Warning: " + format);
              Function.prototype.apply.call(console[level], console, argsWithFormat);
            }
          }
          var didWarnStateUpdateForUnmountedComponent = {};
          function warnNoop(publicInstance, callerName) {
            {
              var _constructor = publicInstance.constructor;
              var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
              var warningKey = componentName + "." + callerName;
              if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
                return;
              }
              error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
              didWarnStateUpdateForUnmountedComponent[warningKey] = true;
            }
          }
          var ReactNoopUpdateQueue = {
            /**
             * Checks whether or not this composite component is mounted.
             * @param {ReactClass} publicInstance The instance we want to test.
             * @return {boolean} True if mounted, false otherwise.
             * @protected
             * @final
             */
            isMounted: function(publicInstance) {
              return false;
            },
            /**
             * Forces an update. This should only be invoked when it is known with
             * certainty that we are **not** in a DOM transaction.
             *
             * You may want to call this when you know that some deeper aspect of the
             * component's state has changed but `setState` was not called.
             *
             * This will not invoke `shouldComponentUpdate`, but it will invoke
             * `componentWillUpdate` and `componentDidUpdate`.
             *
             * @param {ReactClass} publicInstance The instance that should rerender.
             * @param {?function} callback Called after component is updated.
             * @param {?string} callerName name of the calling function in the public API.
             * @internal
             */
            enqueueForceUpdate: function(publicInstance, callback, callerName) {
              warnNoop(publicInstance, "forceUpdate");
            },
            /**
             * Replaces all of the state. Always use this or `setState` to mutate state.
             * You should treat `this.state` as immutable.
             *
             * There is no guarantee that `this.state` will be immediately updated, so
             * accessing `this.state` after calling this method may return the old value.
             *
             * @param {ReactClass} publicInstance The instance that should rerender.
             * @param {object} completeState Next state.
             * @param {?function} callback Called after component is updated.
             * @param {?string} callerName name of the calling function in the public API.
             * @internal
             */
            enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
              warnNoop(publicInstance, "replaceState");
            },
            /**
             * Sets a subset of the state. This only exists because _pendingState is
             * internal. This provides a merging strategy that is not available to deep
             * properties which is confusing. TODO: Expose pendingState or don't use it
             * during the merge.
             *
             * @param {ReactClass} publicInstance The instance that should rerender.
             * @param {object} partialState Next partial state to be merged with state.
             * @param {?function} callback Called after component is updated.
             * @param {?string} Name of the calling function in the public API.
             * @internal
             */
            enqueueSetState: function(publicInstance, partialState, callback, callerName) {
              warnNoop(publicInstance, "setState");
            }
          };
          var assign = Object.assign;
          var emptyObject = {};
          {
            Object.freeze(emptyObject);
          }
          function Component(props, context, updater) {
            this.props = props;
            this.context = context;
            this.refs = emptyObject;
            this.updater = updater || ReactNoopUpdateQueue;
          }
          Component.prototype.isReactComponent = {};
          Component.prototype.setState = function(partialState, callback) {
            if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
              throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
            }
            this.updater.enqueueSetState(this, partialState, callback, "setState");
          };
          Component.prototype.forceUpdate = function(callback) {
            this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
          };
          {
            var deprecatedAPIs = {
              isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
              replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
            };
            var defineDeprecationWarning = function(methodName, info) {
              Object.defineProperty(Component.prototype, methodName, {
                get: function() {
                  warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                  return void 0;
                }
              });
            };
            for (var fnName in deprecatedAPIs) {
              if (deprecatedAPIs.hasOwnProperty(fnName)) {
                defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
              }
            }
          }
          function ComponentDummy() {
          }
          ComponentDummy.prototype = Component.prototype;
          function PureComponent(props, context, updater) {
            this.props = props;
            this.context = context;
            this.refs = emptyObject;
            this.updater = updater || ReactNoopUpdateQueue;
          }
          var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
          pureComponentPrototype.constructor = PureComponent;
          assign(pureComponentPrototype, Component.prototype);
          pureComponentPrototype.isPureReactComponent = true;
          function createRef() {
            var refObject = {
              current: null
            };
            {
              Object.seal(refObject);
            }
            return refObject;
          }
          var isArrayImpl = Array.isArray;
          function isArray(a) {
            return isArrayImpl(a);
          }
          function typeName(value) {
            {
              var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
              var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
              return type;
            }
          }
          function willCoercionThrow(value) {
            {
              try {
                testStringCoercion(value);
                return false;
              } catch (e) {
                return true;
              }
            }
          }
          function testStringCoercion(value) {
            return "" + value;
          }
          function checkKeyStringCoercion(value) {
            {
              if (willCoercionThrow(value)) {
                error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
                return testStringCoercion(value);
              }
            }
          }
          function getWrappedName(outerType, innerType, wrapperName) {
            var displayName = outerType.displayName;
            if (displayName) {
              return displayName;
            }
            var functionName = innerType.displayName || innerType.name || "";
            return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
          }
          function getContextName(type) {
            return type.displayName || "Context";
          }
          function getComponentNameFromType(type) {
            if (type == null) {
              return null;
            }
            {
              if (typeof type.tag === "number") {
                error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
              }
            }
            if (typeof type === "function") {
              return type.displayName || type.name || null;
            }
            if (typeof type === "string") {
              return type;
            }
            switch (type) {
              case REACT_FRAGMENT_TYPE:
                return "Fragment";
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_PROFILER_TYPE:
                return "Profiler";
              case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
              case REACT_SUSPENSE_TYPE:
                return "Suspense";
              case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            }
            if (typeof type === "object") {
              switch (type.$$typeof) {
                case REACT_CONTEXT_TYPE:
                  var context = type;
                  return getContextName(context) + ".Consumer";
                case REACT_PROVIDER_TYPE:
                  var provider = type;
                  return getContextName(provider._context) + ".Provider";
                case REACT_FORWARD_REF_TYPE:
                  return getWrappedName(type, type.render, "ForwardRef");
                case REACT_MEMO_TYPE:
                  var outerName = type.displayName || null;
                  if (outerName !== null) {
                    return outerName;
                  }
                  return getComponentNameFromType(type.type) || "Memo";
                case REACT_LAZY_TYPE: {
                  var lazyComponent = type;
                  var payload = lazyComponent._payload;
                  var init = lazyComponent._init;
                  try {
                    return getComponentNameFromType(init(payload));
                  } catch (x) {
                    return null;
                  }
                }
              }
            }
            return null;
          }
          var hasOwnProperty = Object.prototype.hasOwnProperty;
          var RESERVED_PROPS = {
            key: true,
            ref: true,
            __self: true,
            __source: true
          };
          var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
          {
            didWarnAboutStringRefs = {};
          }
          function hasValidRef(config) {
            {
              if (hasOwnProperty.call(config, "ref")) {
                var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
                if (getter && getter.isReactWarning) {
                  return false;
                }
              }
            }
            return config.ref !== void 0;
          }
          function hasValidKey(config) {
            {
              if (hasOwnProperty.call(config, "key")) {
                var getter = Object.getOwnPropertyDescriptor(config, "key").get;
                if (getter && getter.isReactWarning) {
                  return false;
                }
              }
            }
            return config.key !== void 0;
          }
          function defineKeyPropWarningGetter(props, displayName) {
            var warnAboutAccessingKey = function() {
              {
                if (!specialPropKeyWarningShown) {
                  specialPropKeyWarningShown = true;
                  error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                }
              }
            };
            warnAboutAccessingKey.isReactWarning = true;
            Object.defineProperty(props, "key", {
              get: warnAboutAccessingKey,
              configurable: true
            });
          }
          function defineRefPropWarningGetter(props, displayName) {
            var warnAboutAccessingRef = function() {
              {
                if (!specialPropRefWarningShown) {
                  specialPropRefWarningShown = true;
                  error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                }
              }
            };
            warnAboutAccessingRef.isReactWarning = true;
            Object.defineProperty(props, "ref", {
              get: warnAboutAccessingRef,
              configurable: true
            });
          }
          function warnIfStringRefCannotBeAutoConverted(config) {
            {
              if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
                var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
                if (!didWarnAboutStringRefs[componentName]) {
                  error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                  didWarnAboutStringRefs[componentName] = true;
                }
              }
            }
          }
          var ReactElement = function(type, key, ref, self, source, owner, props) {
            var element = {
              // This tag allows us to uniquely identify this as a React Element
              $$typeof: REACT_ELEMENT_TYPE,
              // Built-in properties that belong on the element
              type,
              key,
              ref,
              props,
              // Record the component responsible for creating this element.
              _owner: owner
            };
            {
              element._store = {};
              Object.defineProperty(element._store, "validated", {
                configurable: false,
                enumerable: false,
                writable: true,
                value: false
              });
              Object.defineProperty(element, "_self", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: self
              });
              Object.defineProperty(element, "_source", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: source
              });
              if (Object.freeze) {
                Object.freeze(element.props);
                Object.freeze(element);
              }
            }
            return element;
          };
          function createElement(type, config, children) {
            var propName;
            var props = {};
            var key = null;
            var ref = null;
            var self = null;
            var source = null;
            if (config != null) {
              if (hasValidRef(config)) {
                ref = config.ref;
                {
                  warnIfStringRefCannotBeAutoConverted(config);
                }
              }
              if (hasValidKey(config)) {
                {
                  checkKeyStringCoercion(config.key);
                }
                key = "" + config.key;
              }
              self = config.__self === void 0 ? null : config.__self;
              source = config.__source === void 0 ? null : config.__source;
              for (propName in config) {
                if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                  props[propName] = config[propName];
                }
              }
            }
            var childrenLength = arguments.length - 2;
            if (childrenLength === 1) {
              props.children = children;
            } else if (childrenLength > 1) {
              var childArray = Array(childrenLength);
              for (var i = 0; i < childrenLength; i++) {
                childArray[i] = arguments[i + 2];
              }
              {
                if (Object.freeze) {
                  Object.freeze(childArray);
                }
              }
              props.children = childArray;
            }
            if (type && type.defaultProps) {
              var defaultProps = type.defaultProps;
              for (propName in defaultProps) {
                if (props[propName] === void 0) {
                  props[propName] = defaultProps[propName];
                }
              }
            }
            {
              if (key || ref) {
                var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
                if (key) {
                  defineKeyPropWarningGetter(props, displayName);
                }
                if (ref) {
                  defineRefPropWarningGetter(props, displayName);
                }
              }
            }
            return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
          }
          function cloneAndReplaceKey(oldElement, newKey) {
            var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
            return newElement;
          }
          function cloneElement(element, config, children) {
            if (element === null || element === void 0) {
              throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
            }
            var propName;
            var props = assign({}, element.props);
            var key = element.key;
            var ref = element.ref;
            var self = element._self;
            var source = element._source;
            var owner = element._owner;
            if (config != null) {
              if (hasValidRef(config)) {
                ref = config.ref;
                owner = ReactCurrentOwner.current;
              }
              if (hasValidKey(config)) {
                {
                  checkKeyStringCoercion(config.key);
                }
                key = "" + config.key;
              }
              var defaultProps;
              if (element.type && element.type.defaultProps) {
                defaultProps = element.type.defaultProps;
              }
              for (propName in config) {
                if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                  if (config[propName] === void 0 && defaultProps !== void 0) {
                    props[propName] = defaultProps[propName];
                  } else {
                    props[propName] = config[propName];
                  }
                }
              }
            }
            var childrenLength = arguments.length - 2;
            if (childrenLength === 1) {
              props.children = children;
            } else if (childrenLength > 1) {
              var childArray = Array(childrenLength);
              for (var i = 0; i < childrenLength; i++) {
                childArray[i] = arguments[i + 2];
              }
              props.children = childArray;
            }
            return ReactElement(element.type, key, ref, self, source, owner, props);
          }
          function isValidElement(object) {
            return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
          }
          var SEPARATOR = ".";
          var SUBSEPARATOR = ":";
          function escape(key) {
            var escapeRegex = /[=:]/g;
            var escaperLookup = {
              "=": "=0",
              ":": "=2"
            };
            var escapedString = key.replace(escapeRegex, function(match) {
              return escaperLookup[match];
            });
            return "$" + escapedString;
          }
          var didWarnAboutMaps = false;
          var userProvidedKeyEscapeRegex = /\/+/g;
          function escapeUserProvidedKey(text) {
            return text.replace(userProvidedKeyEscapeRegex, "$&/");
          }
          function getElementKey(element, index) {
            if (typeof element === "object" && element !== null && element.key != null) {
              {
                checkKeyStringCoercion(element.key);
              }
              return escape("" + element.key);
            }
            return index.toString(36);
          }
          function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
            var type = typeof children;
            if (type === "undefined" || type === "boolean") {
              children = null;
            }
            var invokeCallback = false;
            if (children === null) {
              invokeCallback = true;
            } else {
              switch (type) {
                case "string":
                case "number":
                  invokeCallback = true;
                  break;
                case "object":
                  switch (children.$$typeof) {
                    case REACT_ELEMENT_TYPE:
                    case REACT_PORTAL_TYPE:
                      invokeCallback = true;
                  }
              }
            }
            if (invokeCallback) {
              var _child = children;
              var mappedChild = callback(_child);
              var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
              if (isArray(mappedChild)) {
                var escapedChildKey = "";
                if (childKey != null) {
                  escapedChildKey = escapeUserProvidedKey(childKey) + "/";
                }
                mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                  return c;
                });
              } else if (mappedChild != null) {
                if (isValidElement(mappedChild)) {
                  {
                    if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                      checkKeyStringCoercion(mappedChild.key);
                    }
                  }
                  mappedChild = cloneAndReplaceKey(
                    mappedChild,
                    // Keep both the (mapped) and old keys if they differ, just as
                    // traverseAllChildren used to do for objects as children
                    escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                    (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                      // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                      // eslint-disable-next-line react-internal/safe-string-coercion
                      escapeUserProvidedKey("" + mappedChild.key) + "/"
                    ) : "") + childKey
                  );
                }
                array.push(mappedChild);
              }
              return 1;
            }
            var child;
            var nextName;
            var subtreeCount = 0;
            var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
            if (isArray(children)) {
              for (var i = 0; i < children.length; i++) {
                child = children[i];
                nextName = nextNamePrefix + getElementKey(child, i);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else {
              var iteratorFn = getIteratorFn(children);
              if (typeof iteratorFn === "function") {
                var iterableChildren = children;
                {
                  if (iteratorFn === iterableChildren.entries) {
                    if (!didWarnAboutMaps) {
                      warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                    }
                    didWarnAboutMaps = true;
                  }
                }
                var iterator = iteratorFn.call(iterableChildren);
                var step;
                var ii = 0;
                while (!(step = iterator.next()).done) {
                  child = step.value;
                  nextName = nextNamePrefix + getElementKey(child, ii++);
                  subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
                }
              } else if (type === "object") {
                var childrenString = String(children);
                throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
              }
            }
            return subtreeCount;
          }
          function mapChildren(children, func, context) {
            if (children == null) {
              return children;
            }
            var result = [];
            var count = 0;
            mapIntoArray(children, result, "", "", function(child) {
              return func.call(context, child, count++);
            });
            return result;
          }
          function countChildren(children) {
            var n = 0;
            mapChildren(children, function() {
              n++;
            });
            return n;
          }
          function forEachChildren(children, forEachFunc, forEachContext) {
            mapChildren(children, function() {
              forEachFunc.apply(this, arguments);
            }, forEachContext);
          }
          function toArray(children) {
            return mapChildren(children, function(child) {
              return child;
            }) || [];
          }
          function onlyChild(children) {
            if (!isValidElement(children)) {
              throw new Error("React.Children.only expected to receive a single React element child.");
            }
            return children;
          }
          function createContext(defaultValue) {
            var context = {
              $$typeof: REACT_CONTEXT_TYPE,
              // As a workaround to support multiple concurrent renderers, we categorize
              // some renderers as primary and others as secondary. We only expect
              // there to be two concurrent renderers at most: React Native (primary) and
              // Fabric (secondary); React DOM (primary) and React ART (secondary).
              // Secondary renderers store their context values on separate fields.
              _currentValue: defaultValue,
              _currentValue2: defaultValue,
              // Used to track how many concurrent renderers this context currently
              // supports within in a single renderer. Such as parallel server rendering.
              _threadCount: 0,
              // These are circular
              Provider: null,
              Consumer: null,
              // Add these to use same hidden class in VM as ServerContext
              _defaultValue: null,
              _globalName: null
            };
            context.Provider = {
              $$typeof: REACT_PROVIDER_TYPE,
              _context: context
            };
            var hasWarnedAboutUsingNestedContextConsumers = false;
            var hasWarnedAboutUsingConsumerProvider = false;
            var hasWarnedAboutDisplayNameOnConsumer = false;
            {
              var Consumer = {
                $$typeof: REACT_CONTEXT_TYPE,
                _context: context
              };
              Object.defineProperties(Consumer, {
                Provider: {
                  get: function() {
                    if (!hasWarnedAboutUsingConsumerProvider) {
                      hasWarnedAboutUsingConsumerProvider = true;
                      error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                    }
                    return context.Provider;
                  },
                  set: function(_Provider) {
                    context.Provider = _Provider;
                  }
                },
                _currentValue: {
                  get: function() {
                    return context._currentValue;
                  },
                  set: function(_currentValue) {
                    context._currentValue = _currentValue;
                  }
                },
                _currentValue2: {
                  get: function() {
                    return context._currentValue2;
                  },
                  set: function(_currentValue2) {
                    context._currentValue2 = _currentValue2;
                  }
                },
                _threadCount: {
                  get: function() {
                    return context._threadCount;
                  },
                  set: function(_threadCount) {
                    context._threadCount = _threadCount;
                  }
                },
                Consumer: {
                  get: function() {
                    if (!hasWarnedAboutUsingNestedContextConsumers) {
                      hasWarnedAboutUsingNestedContextConsumers = true;
                      error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                    }
                    return context.Consumer;
                  }
                },
                displayName: {
                  get: function() {
                    return context.displayName;
                  },
                  set: function(displayName) {
                    if (!hasWarnedAboutDisplayNameOnConsumer) {
                      warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                      hasWarnedAboutDisplayNameOnConsumer = true;
                    }
                  }
                }
              });
              context.Consumer = Consumer;
            }
            {
              context._currentRenderer = null;
              context._currentRenderer2 = null;
            }
            return context;
          }
          var Uninitialized = -1;
          var Pending = 0;
          var Resolved = 1;
          var Rejected = 2;
          function lazyInitializer(payload) {
            if (payload._status === Uninitialized) {
              var ctor = payload._result;
              var thenable = ctor();
              thenable.then(function(moduleObject2) {
                if (payload._status === Pending || payload._status === Uninitialized) {
                  var resolved = payload;
                  resolved._status = Resolved;
                  resolved._result = moduleObject2;
                }
              }, function(error2) {
                if (payload._status === Pending || payload._status === Uninitialized) {
                  var rejected = payload;
                  rejected._status = Rejected;
                  rejected._result = error2;
                }
              });
              if (payload._status === Uninitialized) {
                var pending = payload;
                pending._status = Pending;
                pending._result = thenable;
              }
            }
            if (payload._status === Resolved) {
              var moduleObject = payload._result;
              {
                if (moduleObject === void 0) {
                  error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
                }
              }
              {
                if (!("default" in moduleObject)) {
                  error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
                }
              }
              return moduleObject.default;
            } else {
              throw payload._result;
            }
          }
          function lazy(ctor) {
            var payload = {
              // We use these fields to store the result.
              _status: Uninitialized,
              _result: ctor
            };
            var lazyType = {
              $$typeof: REACT_LAZY_TYPE,
              _payload: payload,
              _init: lazyInitializer
            };
            {
              var defaultProps;
              var propTypes;
              Object.defineProperties(lazyType, {
                defaultProps: {
                  configurable: true,
                  get: function() {
                    return defaultProps;
                  },
                  set: function(newDefaultProps) {
                    error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                    defaultProps = newDefaultProps;
                    Object.defineProperty(lazyType, "defaultProps", {
                      enumerable: true
                    });
                  }
                },
                propTypes: {
                  configurable: true,
                  get: function() {
                    return propTypes;
                  },
                  set: function(newPropTypes) {
                    error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                    propTypes = newPropTypes;
                    Object.defineProperty(lazyType, "propTypes", {
                      enumerable: true
                    });
                  }
                }
              });
            }
            return lazyType;
          }
          function forwardRef(render) {
            {
              if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
                error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
              } else if (typeof render !== "function") {
                error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
              } else {
                if (render.length !== 0 && render.length !== 2) {
                  error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
                }
              }
              if (render != null) {
                if (render.defaultProps != null || render.propTypes != null) {
                  error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
                }
              }
            }
            var elementType = {
              $$typeof: REACT_FORWARD_REF_TYPE,
              render
            };
            {
              var ownName;
              Object.defineProperty(elementType, "displayName", {
                enumerable: false,
                configurable: true,
                get: function() {
                  return ownName;
                },
                set: function(name) {
                  ownName = name;
                  if (!render.name && !render.displayName) {
                    render.displayName = name;
                  }
                }
              });
            }
            return elementType;
          }
          var REACT_MODULE_REFERENCE;
          {
            REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
          }
          function isValidElementType(type) {
            if (typeof type === "string" || typeof type === "function") {
              return true;
            }
            if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
              return true;
            }
            if (typeof type === "object" && type !== null) {
              if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
              // types supported by any Flight configuration anywhere since
              // we don't know which Flight build this will end up being used
              // with.
              type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
                return true;
              }
            }
            return false;
          }
          function memo(type, compare) {
            {
              if (!isValidElementType(type)) {
                error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
              }
            }
            var elementType = {
              $$typeof: REACT_MEMO_TYPE,
              type,
              compare: compare === void 0 ? null : compare
            };
            {
              var ownName;
              Object.defineProperty(elementType, "displayName", {
                enumerable: false,
                configurable: true,
                get: function() {
                  return ownName;
                },
                set: function(name) {
                  ownName = name;
                  if (!type.name && !type.displayName) {
                    type.displayName = name;
                  }
                }
              });
            }
            return elementType;
          }
          function resolveDispatcher() {
            var dispatcher = ReactCurrentDispatcher.current;
            {
              if (dispatcher === null) {
                error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
              }
            }
            return dispatcher;
          }
          function useContext(Context) {
            var dispatcher = resolveDispatcher();
            {
              if (Context._context !== void 0) {
                var realContext = Context._context;
                if (realContext.Consumer === Context) {
                  error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
                } else if (realContext.Provider === Context) {
                  error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
                }
              }
            }
            return dispatcher.useContext(Context);
          }
          function useState2(initialState) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useState(initialState);
          }
          function useReducer(reducer, initialArg, init) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useReducer(reducer, initialArg, init);
          }
          function useRef2(initialValue) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useRef(initialValue);
          }
          function useEffect2(create, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useEffect(create, deps);
          }
          function useInsertionEffect(create, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useInsertionEffect(create, deps);
          }
          function useLayoutEffect(create, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useLayoutEffect(create, deps);
          }
          function useCallback(callback, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useCallback(callback, deps);
          }
          function useMemo(create, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useMemo(create, deps);
          }
          function useImperativeHandle(ref, create, deps) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useImperativeHandle(ref, create, deps);
          }
          function useDebugValue(value, formatterFn) {
            {
              var dispatcher = resolveDispatcher();
              return dispatcher.useDebugValue(value, formatterFn);
            }
          }
          function useTransition() {
            var dispatcher = resolveDispatcher();
            return dispatcher.useTransition();
          }
          function useDeferredValue(value) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDeferredValue(value);
          }
          function useId() {
            var dispatcher = resolveDispatcher();
            return dispatcher.useId();
          }
          function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
            var dispatcher = resolveDispatcher();
            return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
          }
          var disabledDepth = 0;
          var prevLog;
          var prevInfo;
          var prevWarn;
          var prevError;
          var prevGroup;
          var prevGroupCollapsed;
          var prevGroupEnd;
          function disabledLog() {
          }
          disabledLog.__reactDisabledLog = true;
          function disableLogs() {
            {
              if (disabledDepth === 0) {
                prevLog = console.log;
                prevInfo = console.info;
                prevWarn = console.warn;
                prevError = console.error;
                prevGroup = console.group;
                prevGroupCollapsed = console.groupCollapsed;
                prevGroupEnd = console.groupEnd;
                var props = {
                  configurable: true,
                  enumerable: true,
                  value: disabledLog,
                  writable: true
                };
                Object.defineProperties(console, {
                  info: props,
                  log: props,
                  warn: props,
                  error: props,
                  group: props,
                  groupCollapsed: props,
                  groupEnd: props
                });
              }
              disabledDepth++;
            }
          }
          function reenableLogs() {
            {
              disabledDepth--;
              if (disabledDepth === 0) {
                var props = {
                  configurable: true,
                  enumerable: true,
                  writable: true
                };
                Object.defineProperties(console, {
                  log: assign({}, props, {
                    value: prevLog
                  }),
                  info: assign({}, props, {
                    value: prevInfo
                  }),
                  warn: assign({}, props, {
                    value: prevWarn
                  }),
                  error: assign({}, props, {
                    value: prevError
                  }),
                  group: assign({}, props, {
                    value: prevGroup
                  }),
                  groupCollapsed: assign({}, props, {
                    value: prevGroupCollapsed
                  }),
                  groupEnd: assign({}, props, {
                    value: prevGroupEnd
                  })
                });
              }
              if (disabledDepth < 0) {
                error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
              }
            }
          }
          var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
          var prefix;
          function describeBuiltInComponentFrame(name, source, ownerFn) {
            {
              if (prefix === void 0) {
                try {
                  throw Error();
                } catch (x) {
                  var match = x.stack.trim().match(/\n( *(at )?)/);
                  prefix = match && match[1] || "";
                }
              }
              return "\n" + prefix + name;
            }
          }
          var reentry = false;
          var componentFrameCache;
          {
            var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
            componentFrameCache = new PossiblyWeakMap();
          }
          function describeNativeComponentFrame(fn, construct) {
            if (!fn || reentry) {
              return "";
            }
            {
              var frame = componentFrameCache.get(fn);
              if (frame !== void 0) {
                return frame;
              }
            }
            var control;
            reentry = true;
            var previousPrepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = void 0;
            var previousDispatcher;
            {
              previousDispatcher = ReactCurrentDispatcher$1.current;
              ReactCurrentDispatcher$1.current = null;
              disableLogs();
            }
            try {
              if (construct) {
                var Fake = function() {
                  throw Error();
                };
                Object.defineProperty(Fake.prototype, "props", {
                  set: function() {
                    throw Error();
                  }
                });
                if (typeof Reflect === "object" && Reflect.construct) {
                  try {
                    Reflect.construct(Fake, []);
                  } catch (x) {
                    control = x;
                  }
                  Reflect.construct(fn, [], Fake);
                } else {
                  try {
                    Fake.call();
                  } catch (x) {
                    control = x;
                  }
                  fn.call(Fake.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (x) {
                  control = x;
                }
                fn();
              }
            } catch (sample) {
              if (sample && control && typeof sample.stack === "string") {
                var sampleLines = sample.stack.split("\n");
                var controlLines = control.stack.split("\n");
                var s = sampleLines.length - 1;
                var c = controlLines.length - 1;
                while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                  c--;
                }
                for (; s >= 1 && c >= 0; s--, c--) {
                  if (sampleLines[s] !== controlLines[c]) {
                    if (s !== 1 || c !== 1) {
                      do {
                        s--;
                        c--;
                        if (c < 0 || sampleLines[s] !== controlLines[c]) {
                          var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                          if (fn.displayName && _frame.includes("<anonymous>")) {
                            _frame = _frame.replace("<anonymous>", fn.displayName);
                          }
                          {
                            if (typeof fn === "function") {
                              componentFrameCache.set(fn, _frame);
                            }
                          }
                          return _frame;
                        }
                      } while (s >= 1 && c >= 0);
                    }
                    break;
                  }
                }
              }
            } finally {
              reentry = false;
              {
                ReactCurrentDispatcher$1.current = previousDispatcher;
                reenableLogs();
              }
              Error.prepareStackTrace = previousPrepareStackTrace;
            }
            var name = fn ? fn.displayName || fn.name : "";
            var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
            {
              if (typeof fn === "function") {
                componentFrameCache.set(fn, syntheticFrame);
              }
            }
            return syntheticFrame;
          }
          function describeFunctionComponentFrame(fn, source, ownerFn) {
            {
              return describeNativeComponentFrame(fn, false);
            }
          }
          function shouldConstruct(Component2) {
            var prototype = Component2.prototype;
            return !!(prototype && prototype.isReactComponent);
          }
          function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
            if (type == null) {
              return "";
            }
            if (typeof type === "function") {
              {
                return describeNativeComponentFrame(type, shouldConstruct(type));
              }
            }
            if (typeof type === "string") {
              return describeBuiltInComponentFrame(type);
            }
            switch (type) {
              case REACT_SUSPENSE_TYPE:
                return describeBuiltInComponentFrame("Suspense");
              case REACT_SUSPENSE_LIST_TYPE:
                return describeBuiltInComponentFrame("SuspenseList");
            }
            if (typeof type === "object") {
              switch (type.$$typeof) {
                case REACT_FORWARD_REF_TYPE:
                  return describeFunctionComponentFrame(type.render);
                case REACT_MEMO_TYPE:
                  return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
                case REACT_LAZY_TYPE: {
                  var lazyComponent = type;
                  var payload = lazyComponent._payload;
                  var init = lazyComponent._init;
                  try {
                    return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                  } catch (x) {
                  }
                }
              }
            }
            return "";
          }
          var loggedTypeFailures = {};
          var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
          function setCurrentlyValidatingElement(element) {
            {
              if (element) {
                var owner = element._owner;
                var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
              } else {
                ReactDebugCurrentFrame$1.setExtraStackFrame(null);
              }
            }
          }
          function checkPropTypes(typeSpecs, values, location, componentName, element) {
            {
              var has = Function.call.bind(hasOwnProperty);
              for (var typeSpecName in typeSpecs) {
                if (has(typeSpecs, typeSpecName)) {
                  var error$1 = void 0;
                  try {
                    if (typeof typeSpecs[typeSpecName] !== "function") {
                      var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                      err.name = "Invariant Violation";
                      throw err;
                    }
                    error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                  } catch (ex) {
                    error$1 = ex;
                  }
                  if (error$1 && !(error$1 instanceof Error)) {
                    setCurrentlyValidatingElement(element);
                    error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                    setCurrentlyValidatingElement(null);
                  }
                  if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                    loggedTypeFailures[error$1.message] = true;
                    setCurrentlyValidatingElement(element);
                    error("Failed %s type: %s", location, error$1.message);
                    setCurrentlyValidatingElement(null);
                  }
                }
              }
            }
          }
          function setCurrentlyValidatingElement$1(element) {
            {
              if (element) {
                var owner = element._owner;
                var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                setExtraStackFrame(stack);
              } else {
                setExtraStackFrame(null);
              }
            }
          }
          var propTypesMisspellWarningShown;
          {
            propTypesMisspellWarningShown = false;
          }
          function getDeclarationErrorAddendum() {
            if (ReactCurrentOwner.current) {
              var name = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (name) {
                return "\n\nCheck the render method of `" + name + "`.";
              }
            }
            return "";
          }
          function getSourceInfoErrorAddendum(source) {
            if (source !== void 0) {
              var fileName = source.fileName.replace(/^.*[\\\/]/, "");
              var lineNumber = source.lineNumber;
              return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
            }
            return "";
          }
          function getSourceInfoErrorAddendumForProps(elementProps) {
            if (elementProps !== null && elementProps !== void 0) {
              return getSourceInfoErrorAddendum(elementProps.__source);
            }
            return "";
          }
          var ownerHasKeyUseWarning = {};
          function getCurrentComponentErrorInfo(parentType) {
            var info = getDeclarationErrorAddendum();
            if (!info) {
              var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
              if (parentName) {
                info = "\n\nCheck the top-level render call using <" + parentName + ">.";
              }
            }
            return info;
          }
          function validateExplicitKey(element, parentType) {
            if (!element._store || element._store.validated || element.key != null) {
              return;
            }
            element._store.validated = true;
            var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
            if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
              return;
            }
            ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
            var childOwner = "";
            if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
              childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
            }
            {
              setCurrentlyValidatingElement$1(element);
              error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
              setCurrentlyValidatingElement$1(null);
            }
          }
          function validateChildKeys(node, parentType) {
            if (typeof node !== "object") {
              return;
            }
            if (isArray(node)) {
              for (var i = 0; i < node.length; i++) {
                var child = node[i];
                if (isValidElement(child)) {
                  validateExplicitKey(child, parentType);
                }
              }
            } else if (isValidElement(node)) {
              if (node._store) {
                node._store.validated = true;
              }
            } else if (node) {
              var iteratorFn = getIteratorFn(node);
              if (typeof iteratorFn === "function") {
                if (iteratorFn !== node.entries) {
                  var iterator = iteratorFn.call(node);
                  var step;
                  while (!(step = iterator.next()).done) {
                    if (isValidElement(step.value)) {
                      validateExplicitKey(step.value, parentType);
                    }
                  }
                }
              }
            }
          }
          function validatePropTypes(element) {
            {
              var type = element.type;
              if (type === null || type === void 0 || typeof type === "string") {
                return;
              }
              var propTypes;
              if (typeof type === "function") {
                propTypes = type.propTypes;
              } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
              // Inner props are checked in the reconciler.
              type.$$typeof === REACT_MEMO_TYPE)) {
                propTypes = type.propTypes;
              } else {
                return;
              }
              if (propTypes) {
                var name = getComponentNameFromType(type);
                checkPropTypes(propTypes, element.props, "prop", name, element);
              } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
                propTypesMisspellWarningShown = true;
                var _name = getComponentNameFromType(type);
                error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
              }
              if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
                error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
              }
            }
          }
          function validateFragmentProps(fragment) {
            {
              var keys = Object.keys(fragment.props);
              for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key !== "children" && key !== "key") {
                  setCurrentlyValidatingElement$1(fragment);
                  error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                  setCurrentlyValidatingElement$1(null);
                  break;
                }
              }
              if (fragment.ref !== null) {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid attribute `ref` supplied to `React.Fragment`.");
                setCurrentlyValidatingElement$1(null);
              }
            }
          }
          function createElementWithValidation(type, props, children) {
            var validType = isValidElementType(type);
            if (!validType) {
              var info = "";
              if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
              }
              var sourceInfo = getSourceInfoErrorAddendumForProps(props);
              if (sourceInfo) {
                info += sourceInfo;
              } else {
                info += getDeclarationErrorAddendum();
              }
              var typeString;
              if (type === null) {
                typeString = "null";
              } else if (isArray(type)) {
                typeString = "array";
              } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
                typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
                info = " Did you accidentally export a JSX literal instead of a component?";
              } else {
                typeString = typeof type;
              }
              {
                error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
              }
            }
            var element = createElement.apply(this, arguments);
            if (element == null) {
              return element;
            }
            if (validType) {
              for (var i = 2; i < arguments.length; i++) {
                validateChildKeys(arguments[i], type);
              }
            }
            if (type === REACT_FRAGMENT_TYPE) {
              validateFragmentProps(element);
            } else {
              validatePropTypes(element);
            }
            return element;
          }
          var didWarnAboutDeprecatedCreateFactory = false;
          function createFactoryWithValidation(type) {
            var validatedFactory = createElementWithValidation.bind(null, type);
            validatedFactory.type = type;
            {
              if (!didWarnAboutDeprecatedCreateFactory) {
                didWarnAboutDeprecatedCreateFactory = true;
                warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
              }
              Object.defineProperty(validatedFactory, "type", {
                enumerable: false,
                get: function() {
                  warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                  Object.defineProperty(this, "type", {
                    value: type
                  });
                  return type;
                }
              });
            }
            return validatedFactory;
          }
          function cloneElementWithValidation(element, props, children) {
            var newElement = cloneElement.apply(this, arguments);
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], newElement.type);
            }
            validatePropTypes(newElement);
            return newElement;
          }
          function startTransition(scope, options) {
            var prevTransition = ReactCurrentBatchConfig.transition;
            ReactCurrentBatchConfig.transition = {};
            var currentTransition = ReactCurrentBatchConfig.transition;
            {
              ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
            }
            try {
              scope();
            } finally {
              ReactCurrentBatchConfig.transition = prevTransition;
              {
                if (prevTransition === null && currentTransition._updatedFibers) {
                  var updatedFibersCount = currentTransition._updatedFibers.size;
                  if (updatedFibersCount > 10) {
                    warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                  }
                  currentTransition._updatedFibers.clear();
                }
              }
            }
          }
          var didWarnAboutMessageChannel = false;
          var enqueueTaskImpl = null;
          function enqueueTask(task) {
            if (enqueueTaskImpl === null) {
              try {
                var requireString = ("require" + Math.random()).slice(0, 7);
                var nodeRequire = module && module[requireString];
                enqueueTaskImpl = nodeRequire.call(module, "timers").setImmediate;
              } catch (_err) {
                enqueueTaskImpl = function(callback) {
                  {
                    if (didWarnAboutMessageChannel === false) {
                      didWarnAboutMessageChannel = true;
                      if (typeof MessageChannel === "undefined") {
                        error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                      }
                    }
                  }
                  var channel = new MessageChannel();
                  channel.port1.onmessage = callback;
                  channel.port2.postMessage(void 0);
                };
              }
            }
            return enqueueTaskImpl(task);
          }
          var actScopeDepth = 0;
          var didWarnNoAwaitAct = false;
          function act(callback) {
            {
              var prevActScopeDepth = actScopeDepth;
              actScopeDepth++;
              if (ReactCurrentActQueue.current === null) {
                ReactCurrentActQueue.current = [];
              }
              var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
              var result;
              try {
                ReactCurrentActQueue.isBatchingLegacy = true;
                result = callback();
                if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                  var queue = ReactCurrentActQueue.current;
                  if (queue !== null) {
                    ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                    flushActQueue(queue);
                  }
                }
              } catch (error2) {
                popActScope(prevActScopeDepth);
                throw error2;
              } finally {
                ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
              }
              if (result !== null && typeof result === "object" && typeof result.then === "function") {
                var thenableResult = result;
                var wasAwaited = false;
                var thenable = {
                  then: function(resolve, reject) {
                    wasAwaited = true;
                    thenableResult.then(function(returnValue2) {
                      popActScope(prevActScopeDepth);
                      if (actScopeDepth === 0) {
                        recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                      } else {
                        resolve(returnValue2);
                      }
                    }, function(error2) {
                      popActScope(prevActScopeDepth);
                      reject(error2);
                    });
                  }
                };
                {
                  if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                    Promise.resolve().then(function() {
                    }).then(function() {
                      if (!wasAwaited) {
                        didWarnNoAwaitAct = true;
                        error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                      }
                    });
                  }
                }
                return thenable;
              } else {
                var returnValue = result;
                popActScope(prevActScopeDepth);
                if (actScopeDepth === 0) {
                  var _queue = ReactCurrentActQueue.current;
                  if (_queue !== null) {
                    flushActQueue(_queue);
                    ReactCurrentActQueue.current = null;
                  }
                  var _thenable = {
                    then: function(resolve, reject) {
                      if (ReactCurrentActQueue.current === null) {
                        ReactCurrentActQueue.current = [];
                        recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                      } else {
                        resolve(returnValue);
                      }
                    }
                  };
                  return _thenable;
                } else {
                  var _thenable2 = {
                    then: function(resolve, reject) {
                      resolve(returnValue);
                    }
                  };
                  return _thenable2;
                }
              }
            }
          }
          function popActScope(prevActScopeDepth) {
            {
              if (prevActScopeDepth !== actScopeDepth - 1) {
                error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
              }
              actScopeDepth = prevActScopeDepth;
            }
          }
          function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
            {
              var queue = ReactCurrentActQueue.current;
              if (queue !== null) {
                try {
                  flushActQueue(queue);
                  enqueueTask(function() {
                    if (queue.length === 0) {
                      ReactCurrentActQueue.current = null;
                      resolve(returnValue);
                    } else {
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    }
                  });
                } catch (error2) {
                  reject(error2);
                }
              } else {
                resolve(returnValue);
              }
            }
          }
          var isFlushing = false;
          function flushActQueue(queue) {
            {
              if (!isFlushing) {
                isFlushing = true;
                var i = 0;
                try {
                  for (; i < queue.length; i++) {
                    var callback = queue[i];
                    do {
                      callback = callback(true);
                    } while (callback !== null);
                  }
                  queue.length = 0;
                } catch (error2) {
                  queue = queue.slice(i + 1);
                  throw error2;
                } finally {
                  isFlushing = false;
                }
              }
            }
          }
          var createElement$1 = createElementWithValidation;
          var cloneElement$1 = cloneElementWithValidation;
          var createFactory = createFactoryWithValidation;
          var Children = {
            map: mapChildren,
            forEach: forEachChildren,
            count: countChildren,
            toArray,
            only: onlyChild
          };
          exports.Children = Children;
          exports.Component = Component;
          exports.Fragment = REACT_FRAGMENT_TYPE;
          exports.Profiler = REACT_PROFILER_TYPE;
          exports.PureComponent = PureComponent;
          exports.StrictMode = REACT_STRICT_MODE_TYPE;
          exports.Suspense = REACT_SUSPENSE_TYPE;
          exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
          exports.cloneElement = cloneElement$1;
          exports.createContext = createContext;
          exports.createElement = createElement$1;
          exports.createFactory = createFactory;
          exports.createRef = createRef;
          exports.forwardRef = forwardRef;
          exports.isValidElement = isValidElement;
          exports.lazy = lazy;
          exports.memo = memo;
          exports.startTransition = startTransition;
          exports.unstable_act = act;
          exports.useCallback = useCallback;
          exports.useContext = useContext;
          exports.useDebugValue = useDebugValue;
          exports.useDeferredValue = useDeferredValue;
          exports.useEffect = useEffect2;
          exports.useId = useId;
          exports.useImperativeHandle = useImperativeHandle;
          exports.useInsertionEffect = useInsertionEffect;
          exports.useLayoutEffect = useLayoutEffect;
          exports.useMemo = useMemo;
          exports.useReducer = useReducer;
          exports.useRef = useRef2;
          exports.useState = useState2;
          exports.useSyncExternalStore = useSyncExternalStore;
          exports.useTransition = useTransition;
          exports.version = ReactVersion;
          if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
          }
        })();
      }
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_development();
      }
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.development.js
  var require_react_jsx_runtime_development = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
      "use strict";
      if (true) {
        (function() {
          "use strict";
          var React2 = require_react();
          var REACT_ELEMENT_TYPE = Symbol.for("react.element");
          var REACT_PORTAL_TYPE = Symbol.for("react.portal");
          var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
          var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
          var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
          var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
          var REACT_CONTEXT_TYPE = Symbol.for("react.context");
          var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
          var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
          var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
          var REACT_MEMO_TYPE = Symbol.for("react.memo");
          var REACT_LAZY_TYPE = Symbol.for("react.lazy");
          var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
          var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
          var FAUX_ITERATOR_SYMBOL = "@@iterator";
          function getIteratorFn(maybeIterable) {
            if (maybeIterable === null || typeof maybeIterable !== "object") {
              return null;
            }
            var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
            if (typeof maybeIterator === "function") {
              return maybeIterator;
            }
            return null;
          }
          var ReactSharedInternals = React2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
          function error(format) {
            {
              {
                for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                  args[_key2 - 1] = arguments[_key2];
                }
                printWarning("error", format, args);
              }
            }
          }
          function printWarning(level, format, args) {
            {
              var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
              var stack = ReactDebugCurrentFrame2.getStackAddendum();
              if (stack !== "") {
                format += "%s";
                args = args.concat([stack]);
              }
              var argsWithFormat = args.map(function(item) {
                return String(item);
              });
              argsWithFormat.unshift("Warning: " + format);
              Function.prototype.apply.call(console[level], console, argsWithFormat);
            }
          }
          var enableScopeAPI = false;
          var enableCacheElement = false;
          var enableTransitionTracing = false;
          var enableLegacyHidden = false;
          var enableDebugTracing = false;
          var REACT_MODULE_REFERENCE;
          {
            REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
          }
          function isValidElementType(type) {
            if (typeof type === "string" || typeof type === "function") {
              return true;
            }
            if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
              return true;
            }
            if (typeof type === "object" && type !== null) {
              if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
              // types supported by any Flight configuration anywhere since
              // we don't know which Flight build this will end up being used
              // with.
              type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
                return true;
              }
            }
            return false;
          }
          function getWrappedName(outerType, innerType, wrapperName) {
            var displayName = outerType.displayName;
            if (displayName) {
              return displayName;
            }
            var functionName = innerType.displayName || innerType.name || "";
            return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
          }
          function getContextName(type) {
            return type.displayName || "Context";
          }
          function getComponentNameFromType(type) {
            if (type == null) {
              return null;
            }
            {
              if (typeof type.tag === "number") {
                error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
              }
            }
            if (typeof type === "function") {
              return type.displayName || type.name || null;
            }
            if (typeof type === "string") {
              return type;
            }
            switch (type) {
              case REACT_FRAGMENT_TYPE:
                return "Fragment";
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_PROFILER_TYPE:
                return "Profiler";
              case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
              case REACT_SUSPENSE_TYPE:
                return "Suspense";
              case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            }
            if (typeof type === "object") {
              switch (type.$$typeof) {
                case REACT_CONTEXT_TYPE:
                  var context = type;
                  return getContextName(context) + ".Consumer";
                case REACT_PROVIDER_TYPE:
                  var provider = type;
                  return getContextName(provider._context) + ".Provider";
                case REACT_FORWARD_REF_TYPE:
                  return getWrappedName(type, type.render, "ForwardRef");
                case REACT_MEMO_TYPE:
                  var outerName = type.displayName || null;
                  if (outerName !== null) {
                    return outerName;
                  }
                  return getComponentNameFromType(type.type) || "Memo";
                case REACT_LAZY_TYPE: {
                  var lazyComponent = type;
                  var payload = lazyComponent._payload;
                  var init = lazyComponent._init;
                  try {
                    return getComponentNameFromType(init(payload));
                  } catch (x) {
                    return null;
                  }
                }
              }
            }
            return null;
          }
          var assign = Object.assign;
          var disabledDepth = 0;
          var prevLog;
          var prevInfo;
          var prevWarn;
          var prevError;
          var prevGroup;
          var prevGroupCollapsed;
          var prevGroupEnd;
          function disabledLog() {
          }
          disabledLog.__reactDisabledLog = true;
          function disableLogs() {
            {
              if (disabledDepth === 0) {
                prevLog = console.log;
                prevInfo = console.info;
                prevWarn = console.warn;
                prevError = console.error;
                prevGroup = console.group;
                prevGroupCollapsed = console.groupCollapsed;
                prevGroupEnd = console.groupEnd;
                var props = {
                  configurable: true,
                  enumerable: true,
                  value: disabledLog,
                  writable: true
                };
                Object.defineProperties(console, {
                  info: props,
                  log: props,
                  warn: props,
                  error: props,
                  group: props,
                  groupCollapsed: props,
                  groupEnd: props
                });
              }
              disabledDepth++;
            }
          }
          function reenableLogs() {
            {
              disabledDepth--;
              if (disabledDepth === 0) {
                var props = {
                  configurable: true,
                  enumerable: true,
                  writable: true
                };
                Object.defineProperties(console, {
                  log: assign({}, props, {
                    value: prevLog
                  }),
                  info: assign({}, props, {
                    value: prevInfo
                  }),
                  warn: assign({}, props, {
                    value: prevWarn
                  }),
                  error: assign({}, props, {
                    value: prevError
                  }),
                  group: assign({}, props, {
                    value: prevGroup
                  }),
                  groupCollapsed: assign({}, props, {
                    value: prevGroupCollapsed
                  }),
                  groupEnd: assign({}, props, {
                    value: prevGroupEnd
                  })
                });
              }
              if (disabledDepth < 0) {
                error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
              }
            }
          }
          var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
          var prefix;
          function describeBuiltInComponentFrame(name, source, ownerFn) {
            {
              if (prefix === void 0) {
                try {
                  throw Error();
                } catch (x) {
                  var match = x.stack.trim().match(/\n( *(at )?)/);
                  prefix = match && match[1] || "";
                }
              }
              return "\n" + prefix + name;
            }
          }
          var reentry = false;
          var componentFrameCache;
          {
            var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
            componentFrameCache = new PossiblyWeakMap();
          }
          function describeNativeComponentFrame(fn, construct) {
            if (!fn || reentry) {
              return "";
            }
            {
              var frame = componentFrameCache.get(fn);
              if (frame !== void 0) {
                return frame;
              }
            }
            var control;
            reentry = true;
            var previousPrepareStackTrace = Error.prepareStackTrace;
            Error.prepareStackTrace = void 0;
            var previousDispatcher;
            {
              previousDispatcher = ReactCurrentDispatcher.current;
              ReactCurrentDispatcher.current = null;
              disableLogs();
            }
            try {
              if (construct) {
                var Fake = function() {
                  throw Error();
                };
                Object.defineProperty(Fake.prototype, "props", {
                  set: function() {
                    throw Error();
                  }
                });
                if (typeof Reflect === "object" && Reflect.construct) {
                  try {
                    Reflect.construct(Fake, []);
                  } catch (x) {
                    control = x;
                  }
                  Reflect.construct(fn, [], Fake);
                } else {
                  try {
                    Fake.call();
                  } catch (x) {
                    control = x;
                  }
                  fn.call(Fake.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (x) {
                  control = x;
                }
                fn();
              }
            } catch (sample) {
              if (sample && control && typeof sample.stack === "string") {
                var sampleLines = sample.stack.split("\n");
                var controlLines = control.stack.split("\n");
                var s = sampleLines.length - 1;
                var c = controlLines.length - 1;
                while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                  c--;
                }
                for (; s >= 1 && c >= 0; s--, c--) {
                  if (sampleLines[s] !== controlLines[c]) {
                    if (s !== 1 || c !== 1) {
                      do {
                        s--;
                        c--;
                        if (c < 0 || sampleLines[s] !== controlLines[c]) {
                          var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                          if (fn.displayName && _frame.includes("<anonymous>")) {
                            _frame = _frame.replace("<anonymous>", fn.displayName);
                          }
                          {
                            if (typeof fn === "function") {
                              componentFrameCache.set(fn, _frame);
                            }
                          }
                          return _frame;
                        }
                      } while (s >= 1 && c >= 0);
                    }
                    break;
                  }
                }
              }
            } finally {
              reentry = false;
              {
                ReactCurrentDispatcher.current = previousDispatcher;
                reenableLogs();
              }
              Error.prepareStackTrace = previousPrepareStackTrace;
            }
            var name = fn ? fn.displayName || fn.name : "";
            var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
            {
              if (typeof fn === "function") {
                componentFrameCache.set(fn, syntheticFrame);
              }
            }
            return syntheticFrame;
          }
          function describeFunctionComponentFrame(fn, source, ownerFn) {
            {
              return describeNativeComponentFrame(fn, false);
            }
          }
          function shouldConstruct(Component) {
            var prototype = Component.prototype;
            return !!(prototype && prototype.isReactComponent);
          }
          function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
            if (type == null) {
              return "";
            }
            if (typeof type === "function") {
              {
                return describeNativeComponentFrame(type, shouldConstruct(type));
              }
            }
            if (typeof type === "string") {
              return describeBuiltInComponentFrame(type);
            }
            switch (type) {
              case REACT_SUSPENSE_TYPE:
                return describeBuiltInComponentFrame("Suspense");
              case REACT_SUSPENSE_LIST_TYPE:
                return describeBuiltInComponentFrame("SuspenseList");
            }
            if (typeof type === "object") {
              switch (type.$$typeof) {
                case REACT_FORWARD_REF_TYPE:
                  return describeFunctionComponentFrame(type.render);
                case REACT_MEMO_TYPE:
                  return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
                case REACT_LAZY_TYPE: {
                  var lazyComponent = type;
                  var payload = lazyComponent._payload;
                  var init = lazyComponent._init;
                  try {
                    return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                  } catch (x) {
                  }
                }
              }
            }
            return "";
          }
          var hasOwnProperty = Object.prototype.hasOwnProperty;
          var loggedTypeFailures = {};
          var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
          function setCurrentlyValidatingElement(element) {
            {
              if (element) {
                var owner = element._owner;
                var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                ReactDebugCurrentFrame.setExtraStackFrame(stack);
              } else {
                ReactDebugCurrentFrame.setExtraStackFrame(null);
              }
            }
          }
          function checkPropTypes(typeSpecs, values, location, componentName, element) {
            {
              var has = Function.call.bind(hasOwnProperty);
              for (var typeSpecName in typeSpecs) {
                if (has(typeSpecs, typeSpecName)) {
                  var error$1 = void 0;
                  try {
                    if (typeof typeSpecs[typeSpecName] !== "function") {
                      var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                      err.name = "Invariant Violation";
                      throw err;
                    }
                    error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                  } catch (ex) {
                    error$1 = ex;
                  }
                  if (error$1 && !(error$1 instanceof Error)) {
                    setCurrentlyValidatingElement(element);
                    error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                    setCurrentlyValidatingElement(null);
                  }
                  if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                    loggedTypeFailures[error$1.message] = true;
                    setCurrentlyValidatingElement(element);
                    error("Failed %s type: %s", location, error$1.message);
                    setCurrentlyValidatingElement(null);
                  }
                }
              }
            }
          }
          var isArrayImpl = Array.isArray;
          function isArray(a) {
            return isArrayImpl(a);
          }
          function typeName(value) {
            {
              var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
              var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
              return type;
            }
          }
          function willCoercionThrow(value) {
            {
              try {
                testStringCoercion(value);
                return false;
              } catch (e) {
                return true;
              }
            }
          }
          function testStringCoercion(value) {
            return "" + value;
          }
          function checkKeyStringCoercion(value) {
            {
              if (willCoercionThrow(value)) {
                error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
                return testStringCoercion(value);
              }
            }
          }
          var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
          var RESERVED_PROPS = {
            key: true,
            ref: true,
            __self: true,
            __source: true
          };
          var specialPropKeyWarningShown;
          var specialPropRefWarningShown;
          var didWarnAboutStringRefs;
          {
            didWarnAboutStringRefs = {};
          }
          function hasValidRef(config) {
            {
              if (hasOwnProperty.call(config, "ref")) {
                var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
                if (getter && getter.isReactWarning) {
                  return false;
                }
              }
            }
            return config.ref !== void 0;
          }
          function hasValidKey(config) {
            {
              if (hasOwnProperty.call(config, "key")) {
                var getter = Object.getOwnPropertyDescriptor(config, "key").get;
                if (getter && getter.isReactWarning) {
                  return false;
                }
              }
            }
            return config.key !== void 0;
          }
          function warnIfStringRefCannotBeAutoConverted(config, self) {
            {
              if (typeof config.ref === "string" && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
                var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
                if (!didWarnAboutStringRefs[componentName]) {
                  error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);
                  didWarnAboutStringRefs[componentName] = true;
                }
              }
            }
          }
          function defineKeyPropWarningGetter(props, displayName) {
            {
              var warnAboutAccessingKey = function() {
                if (!specialPropKeyWarningShown) {
                  specialPropKeyWarningShown = true;
                  error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                }
              };
              warnAboutAccessingKey.isReactWarning = true;
              Object.defineProperty(props, "key", {
                get: warnAboutAccessingKey,
                configurable: true
              });
            }
          }
          function defineRefPropWarningGetter(props, displayName) {
            {
              var warnAboutAccessingRef = function() {
                if (!specialPropRefWarningShown) {
                  specialPropRefWarningShown = true;
                  error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
                }
              };
              warnAboutAccessingRef.isReactWarning = true;
              Object.defineProperty(props, "ref", {
                get: warnAboutAccessingRef,
                configurable: true
              });
            }
          }
          var ReactElement = function(type, key, ref, self, source, owner, props) {
            var element = {
              // This tag allows us to uniquely identify this as a React Element
              $$typeof: REACT_ELEMENT_TYPE,
              // Built-in properties that belong on the element
              type,
              key,
              ref,
              props,
              // Record the component responsible for creating this element.
              _owner: owner
            };
            {
              element._store = {};
              Object.defineProperty(element._store, "validated", {
                configurable: false,
                enumerable: false,
                writable: true,
                value: false
              });
              Object.defineProperty(element, "_self", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: self
              });
              Object.defineProperty(element, "_source", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: source
              });
              if (Object.freeze) {
                Object.freeze(element.props);
                Object.freeze(element);
              }
            }
            return element;
          };
          function jsxDEV(type, config, maybeKey, source, self) {
            {
              var propName;
              var props = {};
              var key = null;
              var ref = null;
              if (maybeKey !== void 0) {
                {
                  checkKeyStringCoercion(maybeKey);
                }
                key = "" + maybeKey;
              }
              if (hasValidKey(config)) {
                {
                  checkKeyStringCoercion(config.key);
                }
                key = "" + config.key;
              }
              if (hasValidRef(config)) {
                ref = config.ref;
                warnIfStringRefCannotBeAutoConverted(config, self);
              }
              for (propName in config) {
                if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                  props[propName] = config[propName];
                }
              }
              if (type && type.defaultProps) {
                var defaultProps = type.defaultProps;
                for (propName in defaultProps) {
                  if (props[propName] === void 0) {
                    props[propName] = defaultProps[propName];
                  }
                }
              }
              if (key || ref) {
                var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
                if (key) {
                  defineKeyPropWarningGetter(props, displayName);
                }
                if (ref) {
                  defineRefPropWarningGetter(props, displayName);
                }
              }
              return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
            }
          }
          var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
          var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
          function setCurrentlyValidatingElement$1(element) {
            {
              if (element) {
                var owner = element._owner;
                var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
                ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
              } else {
                ReactDebugCurrentFrame$1.setExtraStackFrame(null);
              }
            }
          }
          var propTypesMisspellWarningShown;
          {
            propTypesMisspellWarningShown = false;
          }
          function isValidElement(object) {
            {
              return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
            }
          }
          function getDeclarationErrorAddendum() {
            {
              if (ReactCurrentOwner$1.current) {
                var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);
                if (name) {
                  return "\n\nCheck the render method of `" + name + "`.";
                }
              }
              return "";
            }
          }
          function getSourceInfoErrorAddendum(source) {
            {
              if (source !== void 0) {
                var fileName = source.fileName.replace(/^.*[\\\/]/, "");
                var lineNumber = source.lineNumber;
                return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
              }
              return "";
            }
          }
          var ownerHasKeyUseWarning = {};
          function getCurrentComponentErrorInfo(parentType) {
            {
              var info = getDeclarationErrorAddendum();
              if (!info) {
                var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
                if (parentName) {
                  info = "\n\nCheck the top-level render call using <" + parentName + ">.";
                }
              }
              return info;
            }
          }
          function validateExplicitKey(element, parentType) {
            {
              if (!element._store || element._store.validated || element.key != null) {
                return;
              }
              element._store.validated = true;
              var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
              if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
                return;
              }
              ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
              var childOwner = "";
              if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
                childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
              }
              setCurrentlyValidatingElement$1(element);
              error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
              setCurrentlyValidatingElement$1(null);
            }
          }
          function validateChildKeys(node, parentType) {
            {
              if (typeof node !== "object") {
                return;
              }
              if (isArray(node)) {
                for (var i = 0; i < node.length; i++) {
                  var child = node[i];
                  if (isValidElement(child)) {
                    validateExplicitKey(child, parentType);
                  }
                }
              } else if (isValidElement(node)) {
                if (node._store) {
                  node._store.validated = true;
                }
              } else if (node) {
                var iteratorFn = getIteratorFn(node);
                if (typeof iteratorFn === "function") {
                  if (iteratorFn !== node.entries) {
                    var iterator = iteratorFn.call(node);
                    var step;
                    while (!(step = iterator.next()).done) {
                      if (isValidElement(step.value)) {
                        validateExplicitKey(step.value, parentType);
                      }
                    }
                  }
                }
              }
            }
          }
          function validatePropTypes(element) {
            {
              var type = element.type;
              if (type === null || type === void 0 || typeof type === "string") {
                return;
              }
              var propTypes;
              if (typeof type === "function") {
                propTypes = type.propTypes;
              } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
              // Inner props are checked in the reconciler.
              type.$$typeof === REACT_MEMO_TYPE)) {
                propTypes = type.propTypes;
              } else {
                return;
              }
              if (propTypes) {
                var name = getComponentNameFromType(type);
                checkPropTypes(propTypes, element.props, "prop", name, element);
              } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
                propTypesMisspellWarningShown = true;
                var _name = getComponentNameFromType(type);
                error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
              }
              if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
                error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
              }
            }
          }
          function validateFragmentProps(fragment) {
            {
              var keys = Object.keys(fragment.props);
              for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key !== "children" && key !== "key") {
                  setCurrentlyValidatingElement$1(fragment);
                  error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                  setCurrentlyValidatingElement$1(null);
                  break;
                }
              }
              if (fragment.ref !== null) {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid attribute `ref` supplied to `React.Fragment`.");
                setCurrentlyValidatingElement$1(null);
              }
            }
          }
          function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
            {
              var validType = isValidElementType(type);
              if (!validType) {
                var info = "";
                if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                  info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
                }
                var sourceInfo = getSourceInfoErrorAddendum(source);
                if (sourceInfo) {
                  info += sourceInfo;
                } else {
                  info += getDeclarationErrorAddendum();
                }
                var typeString;
                if (type === null) {
                  typeString = "null";
                } else if (isArray(type)) {
                  typeString = "array";
                } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
                  typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
                  info = " Did you accidentally export a JSX literal instead of a component?";
                } else {
                  typeString = typeof type;
                }
                error("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
              }
              var element = jsxDEV(type, props, key, source, self);
              if (element == null) {
                return element;
              }
              if (validType) {
                var children = props.children;
                if (children !== void 0) {
                  if (isStaticChildren) {
                    if (isArray(children)) {
                      for (var i = 0; i < children.length; i++) {
                        validateChildKeys(children[i], type);
                      }
                      if (Object.freeze) {
                        Object.freeze(children);
                      }
                    } else {
                      error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
                    }
                  } else {
                    validateChildKeys(children, type);
                  }
                }
              }
              if (type === REACT_FRAGMENT_TYPE) {
                validateFragmentProps(element);
              } else {
                validatePropTypes(element);
              }
              return element;
            }
          }
          function jsxWithValidationStatic(type, props, key) {
            {
              return jsxWithValidation(type, props, key, true);
            }
          }
          function jsxWithValidationDynamic(type, props, key) {
            {
              return jsxWithValidation(type, props, key, false);
            }
          }
          var jsx2 = jsxWithValidationDynamic;
          var jsxs2 = jsxWithValidationStatic;
          exports.Fragment = REACT_FRAGMENT_TYPE;
          exports.jsx = jsx2;
          exports.jsxs = jsxs2;
        })();
      }
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_jsx_runtime_development();
      }
    }
  });

  // three_body_problem.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime());
  var { useEffect, useRef, useState } = React;
  var orientationPresets = [
    {
      label: "Figure\u20118",
      p: [
        [0.97000436, -0.24308753],
        [-0.97000436, 0.24308753],
        [0, 0]
      ],
      v: [
        [0.466203685, 0.43236573],
        [0.466203685, 0.43236573],
        [-0.93240737, -0.86473146]
      ]
    },
    {
      label: "Circular",
      p: [
        [1, 0],
        [-0.5, 0.8660254],
        [-0.5, -0.8660254]
      ],
      v: [
        [0, 0.658],
        [-0.57, -0.329],
        [0.57, -0.329]
      ]
    }
  ];
  function randomOrientation() {
    const rand = () => Math.random() * 2 - 1;
    return {
      label: "Random",
      p: [
        [rand(), rand()],
        [rand(), rand()],
        [rand(), rand()]
      ],
      v: [
        [rand() * 0.5, rand() * 0.5],
        [rand() * 0.5, rand() * 0.5],
        [rand() * 0.5, rand() * 0.5]
      ]
    };
  }
  function createObjectSet(center) {
    const objs = [];
    const choice = Math.random();
    if (choice < 0.25) {
      const star = { mass: 5, radius: 0.15, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#ffdd88" };
      objs.push(star);
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const r = 2 + Math.random() * 4;
        const omega = Math.sqrt(star.mass / Math.pow(r, 3));
        objs.push({ mass: 0.4, radius: 0.04, orbitCenter: center, orbitRadius: r, omega, phase: Math.random() * Math.PI * 2, color: "#88aaff" });
      }
    } else if (choice < 0.5) {
      const r = 0.6;
      const omega = Math.sqrt(2 / Math.pow(r, 3));
      objs.push({ mass: 0.8, radius: 0.06, orbitCenter: center, orbitRadius: r, omega, phase: 0, color: "#66ff66" });
      objs.push({ mass: 0.8, radius: 0.06, orbitCenter: center, orbitRadius: r, omega, phase: Math.PI, color: "#ff6666" });
    } else if (choice < 0.75) {
      const host = { mass: 2, radius: 0.1, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#ffaa33" };
      objs.push(host);
      const beltR = 2.5 + Math.random();
      const omega = Math.sqrt(host.mass / Math.pow(beltR, 3));
      for (let i = 0; i < 12; i++) {
        objs.push({ mass: 0.01, radius: 0.02, orbitCenter: center, orbitRadius: beltR + (Math.random() - 0.5) * 0.3, omega, phase: Math.random() * Math.PI * 2, color: "#aaaaaa" });
      }
    } else {
      objs.push({ mass: 1.5, radius: 0.12, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#55aaff" });
    }
    return objs;
  }
  function generateRegion(center) {
    const objs = [];
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 8;
      const c = [center[0] + Math.cos(ang) * dist, center[1] + Math.sin(ang) * dist];
      objs.push(...createObjectSet(c));
    }
    return objs;
  }
  function outerObjectPosition(obj, t) {
    const [cx, cy] = obj.orbitCenter;
    if (obj.orbitRadius === 0) return [cx, cy];
    const ang = obj.phase + obj.omega * t;
    return [cx + Math.cos(ang) * obj.orbitRadius, cy + Math.sin(ang) * obj.orbitRadius];
  }
  var defaultSettings = { zoom: 1.35, speedMul: 1, trail: 90 };
  function ThreeBodyGlassSim() {
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [eventType, setEventType] = useState(null);
    const [eventBodyInfo, setEventBodyInfo] = useState("");
    const [countdown, setCountdown] = useState(120);
    const [hexColors, setHexColors] = useState(["#cccccc", "#cccccc", "#cccccc"]);
    const [chosenDuration, setChosenDuration] = useState(null);
    const [progressLines, setProgressLines] = useState([]);
    const [candidateInfo, setCandidateInfo] = useState("");
    const [attemptInfo, setAttemptInfo] = useState("");
    const [orientation, setOrientation] = useState(null);
    const [zoom, setZoom] = useState(defaultSettings.zoom);
    const orientationRef = useRef(orientationPresets[0]);
    const [pan, setPan] = useState([0, 0]);
    const panRef = useRef([0, 0]);
    const followRef = useRef(null);
    const shatterPosRef = useRef([[0, 0], [0, 0], [0, 0]]);
    const draggingRef = useRef(false);
    const dragStartRef = useRef([0, 0]);
    const panStartRef = useRef([0, 0]);
    const postEventRef = useRef(false);
    const rocketRef = useRef(null);
    const seedRef = useRef("");
    const [copied, setCopied] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [seedInput, setSeedInput] = useState("");
    const seedImportRef = useRef(null);
    const outerObjectsRef = useRef(generateRegion([0, 0]));
    const regionCentersRef = useRef([[0, 0]]);
    useEffect(() => {
      if (!importOpen) return;
      const handler = (e) => {
        if (e.key === "Escape") setImportOpen(false);
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [importOpen]);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const G = 1;
    const mass = 1;
    const radius = 0.035;
    const softEps = 1e-4;
    const targetScaleRef = useRef(180);
    const scaleRef = useRef(180);
    const userZoomRef = useRef(defaultSettings.zoom);
    const preBufRef = useRef(null);
    const liveRef = useRef({
      p: [[0, 0], [0, 0], [0, 0]],
      v: [[0, 0], [0, 0], [0, 0]],
      tSim: 0
    });
    const mapRef = useRef({ realStart: 0, baseSpeed: 1 });
    const [speedMul, setSpeedMul] = useState(1);
    const trailsRef = useRef([[], [], []]);
    const [trailMax, setTrailMax] = useState(90);
    const [panelOpen, setPanelOpen] = useState(true);
    const [showSpeed, setShowSpeed] = useState(false);
    const [showGravity, setShowGravity] = useState(false);
    const eventIndexRef = useRef(-1);
    const shardsRef = useRef([]);
    const destroyedRef = useRef([false, false, false]);
    const collisionHandledRef = useRef(false);
    function hslToHex(h, s, l) {
      l = Math.max(0, Math.min(1, l));
      s = Math.max(0, Math.min(1, s));
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hp = h / 60;
      const x = c * (1 - Math.abs(hp % 2 - 1));
      let r = 0, g = 0, b = 0;
      if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
      else if (hp < 2) [r, g, b] = [x, c, 0];
      else if (hp < 3) [r, g, b] = [0, c, x];
      else if (hp < 4) [r, g, b] = [0, x, c];
      else if (hp < 5) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
      const m = l - c / 2;
      const R = Math.round((r + m) * 255);
      const Gc = Math.round((g + m) * 255);
      const B = Math.round((b + m) * 255);
      return `#${((1 << 24) + (R << 16) + (Gc << 8) + B).toString(16).slice(1)}`;
    }
    function randomTriadicHex() {
      const hue = Math.random() * 360;
      const s = 0.72, l = 0.55;
      const tri1 = (hue + 120) % 360;
      const tri2 = (hue + 240) % 360;
      const base = hslToHex(hue, s, l);
      return { base, tri: [hslToHex(tri1, s, l), hslToHex(tri2, s, l)] };
    }
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
    const mul = (a, s) => [a[0] * s, a[1] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    const norm = (a) => Math.hypot(a[0], a[1]);
    function ensureRegionAround(pt) {
      if (regionCentersRef.current.every((c) => norm(sub(pt, c)) > 40)) {
        regionCentersRef.current.push([pt[0], pt[1]]);
        outerObjectsRef.current.push(...generateRegion([pt[0], pt[1]]));
      }
    }
    function accelerations(p, t, includeOuter) {
      const a = [[0, 0], [0, 0], [0, 0]];
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        for (let j = 0; j < 3; j++) if (j !== i && !destroyedRef.current[j]) {
          const r = sub(p[j], p[i]);
          const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
          const d = Math.sqrt(d2);
          const fac = G * mass / (d2 * d);
          a[i] = add(a[i], mul(r, fac));
        }
        if (includeOuter) {
          for (const obj of outerObjectsRef.current) {
            const pos = outerObjectPosition(obj, t);
            const r = sub(pos, p[i]);
            const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
            const d = Math.sqrt(d2);
            const fac = G * obj.mass / (d2 * d);
            a[i] = add(a[i], mul(r, fac));
          }
        }
      }
      return a;
    }
    function rk4Step(p, v, dt, t, includeOuter) {
      const a1 = accelerations(p, t, includeOuter);
      const pv1 = p.map((pi, i) => add(pi, mul(v[i], dt * 0.5)));
      const vv1 = v.map((vi, i) => add(vi, mul(a1[i], dt * 0.5)));
      const a2 = accelerations(pv1, t + dt * 0.5, includeOuter);
      const pv2 = p.map((pi, i) => add(pi, mul(vv1[i], dt * 0.5)));
      const vv2 = v.map((vi, i) => add(vi, mul(a2[i], dt * 0.5)));
      const a3 = accelerations(pv2, t + dt * 0.5, includeOuter);
      const pv3 = p.map((pi, i) => add(pi, mul(vv2[i], dt)));
      const vv3 = v.map((vi, i) => add(vi, mul(a3[i], dt)));
      const a4 = accelerations(pv3, t + dt, includeOuter);
      const pNext = p.map((pi, i) => add(pi, mul(add(add(v[i], mul(add(vv1[i], vv2[i]), 2)), vv3[i]), dt / 6)));
      const vNext = v.map((vi, i) => add(vi, mul(add(add(a1[i], mul(add(a2[i], a3[i]), 2)), a4[i]), dt / 6)));
      return { p: pNext, v: vNext };
    }
    function handleCollision(p, v) {
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        if (destroyedRef.current[i] || destroyedRef.current[j]) continue;
        const rij = sub(p[i], p[j]);
        const d = norm(rij);
        if (d <= 2 * radius) {
          const n = mul(rij, 1 / (d || 1e-9));
          const relv = sub(v[i], v[j]);
          const vrn = dot(relv, n);
          if (vrn < 0) {
            const overlap = 2 * radius - d;
            if (overlap > 0) {
              const corr = mul(n, overlap * 0.5 + 1e-6);
              p[i] = add(p[i], corr);
              p[j] = sub(p[j], corr);
            }
            const impulse = mul(n, vrn);
            v[i] = sub(v[i], impulse);
            v[j] = add(v[j], impulse);
          }
        }
      }
    }
    function handleOuterCollisions(p, v, t) {
      if (!preBufRef.current) return;
      if (t < preBufRef.current.tEvent) return;
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        for (const obj of outerObjectsRef.current) {
          const pos = outerObjectPosition(obj, t);
          const rij = sub(p[i], pos);
          const d = norm(rij);
          if (d <= radius + obj.radius) {
            const n = mul(rij, 1 / (d || 1e-9));
            const vrn = dot(v[i], n);
            if (vrn < 0) {
              v[i] = sub(v[i], mul(n, 2 * vrn));
            }
          }
        }
      }
    }
    function rocketAcceleration(pos, t) {
      let a = [0, 0];
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        const r = sub(liveRef.current.p[i], pos);
        const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
        const d = Math.sqrt(d2);
        const fac = G * mass / (d2 * d);
        a = add(a, mul(r, fac));
      }
      for (const obj of outerObjectsRef.current) {
        const op = outerObjectPosition(obj, t);
        const r = sub(op, pos);
        const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
        const d = Math.sqrt(d2);
        const fac = G * obj.mass / (d2 * d);
        a = add(a, mul(r, fac));
      }
      return a;
    }
    function energyOfBody(k, p, v) {
      const v2 = dot(v[k], v[k]);
      let U = 0;
      for (let j = 0; j < 3; j++) if (j !== k) {
        const r = norm(sub(p[k], p[j]));
        U -= G * mass * mass / Math.max(r, 1e-6);
      }
      return 0.5 * mass * v2 + U;
    }
    function centerOfMass(p) {
      let pc = [0, 0];
      for (let i = 0; i < 3; i++) pc = add(pc, p[i]);
      return { pc: mul(pc, 1 / 3) };
    }
    async function preSimulateAndSetup(opts) {
      const { base, tri } = randomTriadicHex();
      const codes = [base, tri[0], tri[1]];
      setHexColors(codes);
      setProgressLines(["Starting search for perturbations..."]);
      setCandidateInfo("");
      setAttemptInfo("");
      shardsRef.current = [];
      destroyedRef.current = [false, false, false];
      collisionHandledRef.current = false;
      let pBase = opts?.seed ? opts.seed.p.map((x) => [...x]) : orientationRef.current.p.map((x) => [...x]);
      let vBase = opts?.seed ? opts.seed.v.map((x) => [...x]) : orientationRef.current.v.map((x) => [...x]);
      const epsCandidates = [1e-5, 5e-5, 1e-4, 3e-4, 1e-3, 3e-3, 7e-3, 0.012];
      const dt = 4e-3;
      const target = opts?.targetTEvent ?? opts?.targetRealTime;
      const maxSteps = target ? Math.max(22e4, Math.ceil(target / dt) + 5e3) : 22e4;
      const collR = 2 * radius;
      let best = null;
      if (opts?.seed) {
        let p = pBase.map((x) => [...x]);
        let v = vBase.map((x) => [...x]);
        const buffer = [];
        let found = false;
        let kind = "collision";
        let info = "";
        let tEvent = 0;
        let ejectCand = null;
        const confirmSteps = 25e3;
        for (let step = 0; step < maxSteps; step++) {
          buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]], v: [[...v[0]], [...v[1]], [...v[2]]] });
          if (step % 5e3 === 0) {
            const pct = (step / maxSteps * 100).toFixed(1);
            setProgressLines((l) => [...l.slice(-40), `    ${pct}%`]);
            await new Promise((r) => setTimeout(r, 0));
          }
          let collidedPair = null;
          outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
            const d = norm(sub(p[i], p[j]));
            if (d <= collR) {
              collidedPair = [i, j];
              break outer;
            }
          }
          if (collidedPair) {
            found = true;
            kind = "collision";
            info = `${collidedPair[0] + 1}\u2194${collidedPair[1] + 1}`;
            tEvent = step * dt;
            break;
          }
          const { pc } = centerOfMass(p);
          const pRel = p.map((pi) => sub(pi, pc));
          const vRel = v.map((vi) => vi);
          const R = pRel.map((ri) => norm(ri));
          if (!ejectCand) {
            for (let k = 0; k < 3; k++) {
              const eSpec = energyOfBody(k, pRel, vRel);
              const outward = dot(pRel[k], vRel[k]) > 0;
              if (R[k] > 7 && outward && eSpec > 0) {
                ejectCand = { k, step };
                break;
              }
            }
          } else {
            const k = ejectCand.k;
            const eSpec = energyOfBody(k, pRel, vRel);
            const outward = dot(pRel[k], vRel[k]) > 0;
            if (R[k] < 5 || !outward || eSpec < 0) {
              ejectCand = null;
            } else if (step - ejectCand.step > confirmSteps) {
              found = true;
              kind = "ejection";
              info = `body ${k + 1}`;
              tEvent = ejectCand.step * dt;
              break;
            }
          }
          const next = rk4Step(p, v, dt, step * dt, false);
          p = next.p;
          v = next.v;
        }
        if (found) best = { buffer, tEvent, kind, info };
      } else {
        for (let e = 0; e < epsCandidates.length; e++) {
          setCandidateInfo(`\u2208 candidate ${e + 1}/${epsCandidates.length}`);
          await new Promise((r) => setTimeout(r, 0));
          for (let attempt = 0; attempt < 6; attempt++) {
            setAttemptInfo(`attempt ${attempt + 1}/6`);
            await new Promise((r) => setTimeout(r, 0));
            let p = pBase.map((x) => [...x]);
            let v = vBase.map((x) => [...x]);
            const ang = Math.random() * Math.PI * 2;
            const eps = epsCandidates[e];
            v[0] = add(v[0], [Math.cos(ang) * eps, Math.sin(ang) * eps]);
            const buffer = [];
            let found = false;
            let kind = "collision";
            let info = "";
            let tEvent = 0;
            let ejectCand = null;
            const confirmSteps = 25e3;
            for (let step = 0; step < maxSteps; step++) {
              buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]], v: [[...v[0]], [...v[1]], [...v[2]]] });
              if (step % 5e3 === 0) {
                const pct = (step / maxSteps * 100).toFixed(1);
                setProgressLines((l) => [...l.slice(-40), `    ${pct}%`]);
                await new Promise((r) => setTimeout(r, 0));
              }
              let collidedPair = null;
              outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
                const d = norm(sub(p[i], p[j]));
                if (d <= collR) {
                  collidedPair = [i, j];
                  break outer;
                }
              }
              if (collidedPair) {
                found = true;
                kind = "collision";
                info = `${collidedPair[0] + 1}\u2194${collidedPair[1] + 1}`;
                tEvent = step * dt;
                break;
              }
              const { pc } = centerOfMass(p);
              const pRel = p.map((pi) => sub(pi, pc));
              const vRel = v.map((vi) => vi);
              const R = pRel.map((ri) => norm(ri));
              if (!ejectCand) {
                for (let k = 0; k < 3; k++) {
                  const eSpec = energyOfBody(k, pRel, vRel);
                  const outward = dot(pRel[k], vRel[k]) > 0;
                  if (R[k] > 7 && outward && eSpec > 0) {
                    ejectCand = { k, step };
                    break;
                  }
                }
              } else {
                const k = ejectCand.k;
                const eSpec = energyOfBody(k, pRel, vRel);
                const outward = dot(pRel[k], vRel[k]) > 0;
                if (R[k] < 5 || !outward || eSpec < 0) {
                  ejectCand = null;
                } else if (step - ejectCand.step > confirmSteps) {
                  found = true;
                  kind = "ejection";
                  info = `body ${k + 1}`;
                  tEvent = ejectCand.step * dt;
                  break;
                }
              }
              const next = rk4Step(p, v, dt, step * dt, false);
              p = next.p;
              v = next.v;
            }
            if (found) {
              if (!best) {
                best = { buffer, tEvent, kind, info };
              } else if (target != null) {
                const prevErr = Math.abs(best.tEvent - target);
                const newErr = Math.abs(tEvent - target);
                if (newErr < prevErr) best = { buffer, tEvent, kind, info };
              } else {
                if (tEvent < best.tEvent) best = { buffer, tEvent, kind, info };
              }
            }
          }
        }
      }
      if (!best) {
        const tEvent = 90;
        preBufRef.current = { dt, states: [], tEvent, kind: "ejection", info: "body 3" };
        setEventType("ejection");
        setEventBodyInfo("body 3");
      } else {
        preBufRef.current = { dt, states: best.buffer, tEvent: best.tEvent, kind: best.kind, info: best.info };
        eventIndexRef.current = Math.floor(best.tEvent / dt);
        setEventType(best.kind);
        setEventBodyInfo(best.info);
      }
      if (preBufRef.current && opts?.targetRealTime) {
        mapRef.current.baseSpeed = preBufRef.current.tEvent / opts.targetRealTime;
        mapRef.current.realStart = performance.now() / 1e3;
      }
      if (preBufRef.current && preBufRef.current.states.length > 0) {
        const startState = preBufRef.current.states[0];
        liveRef.current = { p: startState.p.map((x) => [...x]), v: startState.v.map((x) => [...x]), tSim: 0 };
      } else {
        liveRef.current = { p: [[0, 0], [0, 0], [0, 0]], v: [[0, 0], [0, 0], [0, 0]], tSim: 0 };
      }
      mapRef.current.realStart = performance.now() / 1e3;
      trailsRef.current = [[], [], []];
      const span = preBufRef.current && preBufRef.current.states.length ? Math.max(
        norm(sub(preBufRef.current.states[0].p[0], preBufRef.current.states[0].p[1])),
        norm(sub(preBufRef.current.states[0].p[1], preBufRef.current.states[0].p[2])),
        norm(sub(preBufRef.current.states[0].p[2], preBufRef.current.states[0].p[0]))
      ) : 1.2;
      targetScaleRef.current = Math.min(300, Math.max(140, 300 / Math.max(span, 0.4)));
      scaleRef.current = targetScaleRef.current * userZoomRef.current;
      if (preBufRef.current && preBufRef.current.states.length > 0) {
        const init = preBufRef.current.states[0];
        seedRef.current = btoa(JSON.stringify({ p: init.p, v: init.v, duration: opts?.targetRealTime ?? 0 }));
      }
      setProgressLines((l) => [...l.slice(-40), "Finalizing setup..."]);
      await new Promise((r) => setTimeout(r, 0));
      setIsReady(true);
      setProgressLines([]);
      setCandidateInfo("");
      setAttemptInfo("");
    }
    function setupCanvas(ctx) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const { clientWidth, clientHeight } = ctx.canvas;
      ctx.canvas.width = Math.floor(clientWidth * dpr);
      ctx.canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function worldToScreen(x, y, W, H) {
      const s = scaleRef.current;
      const [px, py] = panRef.current;
      const cx = W / 2, cy = H / 2;
      return [cx + (x - px) * s, cy - (y - py) * s];
    }
    function screenToWorld(x, y, W, H) {
      const s = scaleRef.current;
      const [px, py] = panRef.current;
      const cx = W / 2, cy = H / 2;
      return [px + (x - cx) / s, py - (y - cy) / s];
    }
    function drawScene(ctx, p) {
      const W = ctx.canvas.clientWidth;
      const H = ctx.canvas.clientHeight;
      const { pc } = centerOfMass(p);
      const maxR = Math.max(
        norm(sub(p[0], pc)),
        norm(sub(p[1], pc)),
        norm(sub(p[2], pc))
      );
      const baseTarget = maxR > 2.6 ? Math.max(70, 280 / (maxR + 0.6)) : targetScaleRef.current;
      const targetWithUser = baseTarget * userZoomRef.current;
      scaleRef.current = scaleRef.current * 0.88 + targetWithUser * 0.12;
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#0b1020");
      grad.addColorStop(1, "#060912");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      if (showGravity) {
        const targets = [];
        for (let i = 0; i < 3; i++) {
          if (destroyedRef.current[i]) continue;
          const [sx, sy] = worldToScreen(p[i][0], p[i][1], W, H);
          if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) targets.push({ pos: p[i], idx: i });
        }
        if (rocketRef.current) {
          const r = rocketRef.current;
          const [sx, sy] = worldToScreen(r.p[0], r.p[1], W, H);
          if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) targets.push({ pos: r.p, idx: -1 });
        }
        if (targets.length === 0) {
          const mid = screenToWorld(W / 2, H / 2, W, H);
          targets.push({ pos: mid, idx: -99 });
        }
        const infl = [];
        const addInfl = (pos, mass2, target) => {
          const r = sub(pos, target);
          const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
          const strength = mass2 / d2;
          infl.push({ pos, mass: mass2, strength });
        };
        for (const t of targets) {
          for (let j = 0; j < 3; j++) {
            if (destroyedRef.current[j]) continue;
            if (t.idx === j) continue;
            addInfl(p[j], mass, t.pos);
          }
          for (const obj of outerObjectsRef.current) {
            const op = outerObjectPosition(obj, liveRef.current.tSim);
            addInfl(op, obj.mass, t.pos);
          }
        }
        infl.sort((a, b) => b.strength - a.strength);
        const sources = [];
        for (const s of infl) {
          if (!sources.some((o) => Math.hypot(o.pos[0] - s.pos[0], o.pos[1] - s.pos[1]) < 1e-6)) {
            sources.push({ pos: s.pos, mass: s.mass });
            if (sources.length >= 3) break;
          }
        }
        const distort = (x, y) => {
          let off = [0, 0];
          for (const s of sources) {
            const r = sub(s.pos, [x, y]);
            const d2 = r[0] * r[0] + r[1] * r[1] + 1e-6;
            const fac = s.mass / d2 * 0.2;
            off = add(off, mul(r, fac));
          }
          return add([x, y], off);
        };
        const [wx0, wy0] = screenToWorld(0, H, W, H);
        const [wx1, wy1] = screenToWorld(W, 0, W, H);
        const step = 2;
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = "#ffffff";
        for (let x = Math.floor(wx0 / step) * step; x <= wx1; x += step) {
          ctx.beginPath();
          for (let y = wy0; y <= wy1; y += step) {
            const [dx, dy] = distort(x, y);
            const [sx, sy] = worldToScreen(dx, dy, W, H);
            if (y === wy0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        for (let y = Math.floor(wy0 / step) * step; y <= wy1; y += step) {
          ctx.beginPath();
          for (let x = wx0; x <= wx1; x += step) {
            const [dx, dy] = distort(x, y);
            const [sx, sy] = worldToScreen(dx, dy, W, H);
            if (x === wx0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      const glow = (hex, alpha = 0.9) => {
        ctx.shadowBlur = 22;
        ctx.shadowColor = hex + Math.floor(alpha * 255).toString(16).padStart(2, "0");
      };
      for (let i = 0; i < 3; i++) {
        const trail = trailsRef.current[i];
        const n = trail.length;
        if (n > 2) {
          for (let k = 1; k < n; k++) {
            const [x0, y0] = worldToScreen(trail[k - 1][0], trail[k - 1][1], W, H);
            const [x1, y1] = worldToScreen(trail[k][0], trail[k][1], W, H);
            const t = k / n;
            ctx.save();
            ctx.globalAlpha = 0.15 + 0.55 * t * t;
            ctx.lineWidth = 1.8 + 0.6 * t;
            ctx.strokeStyle = hexColors[i];
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        const [x, y] = worldToScreen(p[i][0], p[i][1], W, H);
        ctx.save();
        glow(hexColors[i], 0.9);
        ctx.fillStyle = hexColors[i];
        ctx.beginPath();
        ctx.arc(x, y, radius * scaleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const sh of shardsRef.current) {
        const [x, y] = worldToScreen(sh.p[0], sh.p[1], W, H);
        ctx.save();
        ctx.globalAlpha = Math.max(0, sh.life / 3);
        ctx.fillStyle = sh.color;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (scaleRef.current < 120) {
        for (const obj of outerObjectsRef.current) {
          const pos = outerObjectPosition(obj, liveRef.current.tSim);
          const [x, y] = worldToScreen(pos[0], pos[1], W, H);
          ctx.save();
          glow(obj.color, 0.8);
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(x, y, obj.radius * scaleRef.current, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      if (rocketRef.current) {
        const r = rocketRef.current;
        const [x, y] = worldToScreen(r.p[0], r.p[1], W, H);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-r.angle);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 3);
        ctx.lineTo(-4, -3);
        ctx.closePath();
        ctx.fill();
        if (r.thrustPower > 0) {
          ctx.fillStyle = "#ff9933";
          ctx.beginPath();
          ctx.moveTo(-4, -2);
          ctx.lineTo(-4 - 6 * Math.min(1, r.thrustPower), 0);
          ctx.lineTo(-4, 2);
          ctx.closePath();
          ctx.fill();
        }
        if (r.rotL) {
          ctx.fillStyle = "#ff9933";
          ctx.beginPath();
          ctx.moveTo(-2, 3);
          ctx.lineTo(-6, 5);
          ctx.lineTo(-2, 4);
          ctx.closePath();
          ctx.fill();
        }
        if (r.rotR) {
          ctx.fillStyle = "#ff9933";
          ctx.beginPath();
          ctx.moveTo(-2, -3);
          ctx.lineTo(-6, -5);
          ctx.lineTo(-2, -4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      if (showSpeed) {
        ctx.save();
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        const drawSpeed = (sx, sy, v) => {
          const mph = (norm(v) * 3600).toFixed(1);
          const text = `${mph} mph`;
          const pad = 4;
          const w = ctx.measureText(text).width + pad * 2;
          const h = 16;
          const ty = sy - 24;
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(sx - w / 2, ty - h / 2, w, h);
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.strokeRect(sx - w / 2, ty - h / 2, w, h);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(text, sx, ty + 5);
        };
        for (let i = 0; i < 3; i++) {
          if (destroyedRef.current[i]) continue;
          const [sx, sy] = worldToScreen(p[i][0], p[i][1], W, H);
          if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) drawSpeed(sx, sy, liveRef.current.v[i]);
        }
        if (rocketRef.current) {
          const r = rocketRef.current;
          const [sx, sy] = worldToScreen(r.p[0], r.p[1], W, H);
          if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) drawSpeed(sx, sy, r.v);
        }
        ctx.restore();
      }
    }
    const loopRef = useRef(() => {
    });
    loopRef.current = () => {
      const buf = preBufRef.current;
      if (!buf) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setupCanvas(ctx);
      const now = performance.now() / 1e3;
      const realElapsed = Math.max(0, now - mapRef.current.realStart);
      const simRate = mapRef.current.baseSpeed * speedMul;
      if (isPlaying) {
        const simTimeTarget = Math.max(0, realElapsed * simRate);
        const tEvent = buf.tEvent;
        if (simTimeTarget <= tEvent) {
          const idx = Math.min(buf.states.length - 1, Math.floor(simTimeTarget / buf.dt));
          const state = buf.states[idx] ?? buf.states[buf.states.length - 1];
          if (state) {
            liveRef.current.p = state.p.map((x) => [...x]);
            liveRef.current.v = state.v.map((x) => [...x]);
            liveRef.current.tSim = idx * buf.dt;
          }
        } else {
          postEventRef.current = true;
          if (Math.abs(liveRef.current.tSim - tEvent) < buf.dt) {
            const exact = buf.states[Math.min(buf.states.length - 1, Math.floor(tEvent / buf.dt))];
            if (exact) {
              liveRef.current.p = exact.p.map((x) => [...x]);
              liveRef.current.v = exact.v.map((x) => [...x]);
              liveRef.current.tSim = tEvent;
              if (buf.kind === "collision") handleCollision(liveRef.current.p, liveRef.current.v);
              handleOuterCollisions(liveRef.current.p, liveRef.current.v, liveRef.current.tSim);
            }
          }
          if (!collisionHandledRef.current && buf.kind === "collision" && simTimeTarget > tEvent) {
            const pair = buf.info.split("\u2194").map((n) => parseInt(n) - 1);
            const c = mul(add(liveRef.current.p[pair[0]], liveRef.current.p[pair[1]]), 0.5);
            for (let s = 0; s < 40; s++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.6 + Math.random() * 0.8;
              const color = hexColors[pair[Math.floor(Math.random() * 2)]];
              shardsRef.current.push({ p: [c[0], c[1]], v: [Math.cos(ang) * spd, Math.sin(ang) * spd], life: 3, color });
            }
            destroyedRef.current[pair[0]] = true;
            destroyedRef.current[pair[1]] = true;
            shatterPosRef.current[pair[0]] = [c[0], c[1]];
            shatterPosRef.current[pair[1]] = [c[0], c[1]];
            liveRef.current.p[pair[0]] = [9999, 9999];
            liveRef.current.p[pair[1]] = [9999, 9999];
            liveRef.current.v[pair[0]] = [0, 0];
            liveRef.current.v[pair[1]] = [0, 0];
            collisionHandledRef.current = true;
          }
          let dtLeft = simTimeTarget - liveRef.current.tSim;
          const h = 5e-3;
          while (dtLeft > 1e-6) {
            const step = Math.min(h, dtLeft);
            const next = rk4Step(liveRef.current.p, liveRef.current.v, step, liveRef.current.tSim, true);
            liveRef.current.p = next.p;
            liveRef.current.v = next.v;
            handleCollision(liveRef.current.p, liveRef.current.v);
            handleOuterCollisions(liveRef.current.p, liveRef.current.v, liveRef.current.tSim);
            if (rocketRef.current) {
              const r = rocketRef.current;
              const rot = 1.5;
              if (r.rotL) r.angle += rot * step;
              if (r.rotR) r.angle -= rot * step;
              if (r.thrustUp) r.thrustPower = Math.min(r.thrustPower + step, 5);
              if (r.thrustDown) r.thrustPower = Math.max(0, r.thrustPower - step);
              let acc = rocketAcceleration(r.p, liveRef.current.tSim);
              if (r.thrustPower > 0) {
                acc = add(acc, [Math.cos(r.angle) * r.thrustPower, Math.sin(r.angle) * r.thrustPower]);
              }
              r.v = add(r.v, mul(acc, step));
              r.p = add(r.p, mul(r.v, step));
            }
            for (const sh of shardsRef.current) {
              sh.p = add(sh.p, mul(sh.v, step));
              sh.life -= step;
            }
            shardsRef.current = shardsRef.current.filter((s) => s.life > 0);
            liveRef.current.tSim += step;
            dtLeft -= step;
          }
        }
      }
      if (isPlaying) {
        const p = liveRef.current.p;
        for (let i = 0; i < 3; i++) {
          if (destroyedRef.current[i]) continue;
          trailsRef.current[i].push([p[i][0], p[i][1]]);
          while (trailsRef.current[i].length > trailMax) trailsRef.current[i].shift();
        }
      }
      if (postEventRef.current) {
        for (let i = 0; i < 3; i++) {
          if (!destroyedRef.current[i]) ensureRegionAround(liveRef.current.p[i]);
        }
        if (rocketRef.current) ensureRegionAround(rocketRef.current.p);
        if (followRef.current !== null) {
          const idx = followRef.current;
          let target = null;
          if (idx === 3 && rocketRef.current) target = rocketRef.current.p;
          else if (idx <= 2) target = destroyedRef.current[idx] ? shatterPosRef.current[idx] : liveRef.current.p[idx];
          if (target) {
            panRef.current = [target[0], target[1]];
            setPan([target[0], target[1]]);
            ensureRegionAround(panRef.current);
          }
        }
      }
      drawScene(ctx, liveRef.current.p);
      if (buf) {
        const tRemainingSim = Math.max(0, buf.tEvent - liveRef.current.tSim);
        const tRemainingReal = tRemainingSim / (mapRef.current.baseSpeed * speedMul);
        setCountdown(tRemainingReal);
      }
      rafRef.current = requestAnimationFrame(loopRef.current);
    };
    useEffect(() => {
      if (chosenDuration == null) return;
      preSimulateAndSetup({
        targetTEvent: mapRef.current.baseSpeed * chosenDuration,
        targetRealTime: chosenDuration,
        seed: seedImportRef.current || void 0
      });
      seedImportRef.current = null;
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [chosenDuration]);
    useEffect(() => {
      if (!isReady) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loopRef.current);
    }, [isReady, isPlaying, speedMul, trailMax]);
    useEffect(() => {
      mapRef.current.realStart = performance.now() / 1e3 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
    }, [speedMul]);
    function resetAll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      shardsRef.current = [];
      destroyedRef.current = [false, false, false];
      collisionHandledRef.current = false;
      setIsReady(false);
      setEventType(null);
      setEventBodyInfo("");
      setIsPlaying(true);
      setChosenDuration(null);
      setProgressLines([]);
      setCandidateInfo("");
      setAttemptInfo("");
      setOrientation(null);
      orientationRef.current = orientationPresets[0];
      userZoomRef.current = defaultSettings.zoom;
      setZoom(defaultSettings.zoom);
      setSpeedMul(defaultSettings.speedMul);
      setTrailMax(defaultSettings.trail);
      panRef.current = [0, 0];
      setPan([0, 0]);
      followRef.current = null;
      postEventRef.current = false;
      outerObjectsRef.current = generateRegion([0, 0]);
      regionCentersRef.current = [[0, 0]];
      rocketRef.current = null;
    }
    function handleWheel(e) {
      e.preventDefault();
      const factor = Math.pow(1.05, -e.deltaY / 100);
      userZoomRef.current = Math.max(0.5, Math.min(2.5, userZoomRef.current * factor));
      setZoom(userZoomRef.current);
    }
    function handleMouseDown(e) {
      if (!postEventRef.current) return;
      draggingRef.current = true;
      dragStartRef.current = [e.clientX, e.clientY];
      panStartRef.current = panRef.current;
      followRef.current = null;
    }
    useEffect(() => {
      const move = (e) => {
        if (!draggingRef.current) return;
        const dx = e.clientX - dragStartRef.current[0];
        const dy = e.clientY - dragStartRef.current[1];
        const s = scaleRef.current;
        const newPan = [panStartRef.current[0] - dx / s, panStartRef.current[1] + dy / s];
        panRef.current = newPan;
        setPan(newPan);
        ensureRegionAround(newPan);
      };
      const up = () => {
        draggingRef.current = false;
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      return () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
    }, []);
    useEffect(() => {
      const down = (e) => {
        if (!postEventRef.current) return;
        if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3") {
          followRef.current = parseInt(e.code.slice(-1)) - 1;
        } else if (e.code === "Digit0") {
          if (e.shiftKey && !rocketRef.current) {
            rocketRef.current = { p: [0, 0], v: [0, 0], angle: 0, thrustPower: 0, thrustUp: false, thrustDown: false, rotL: false, rotR: false };
          }
          if (rocketRef.current) followRef.current = 3;
        }
        if (e.key === "s" && !e.repeat) setShowSpeed((v) => !v);
        if (e.key === "g" && !e.repeat) setShowGravity((v) => !v);
        if (rocketRef.current) {
          if (e.key === "w") rocketRef.current.thrustUp = true;
          if (e.key === "S") rocketRef.current.thrustDown = true;
          if (e.key === "a") rocketRef.current.rotL = true;
          if (e.key === "d") rocketRef.current.rotR = true;
        }
      };
      const up = (e) => {
        if (!rocketRef.current) return;
        if (e.key === "a") rocketRef.current.rotL = false;
        if (e.key === "d") rocketRef.current.rotR = false;
        if (e.key === "w") rocketRef.current.thrustUp = false;
        if (e.key === "S") rocketRef.current.thrustDown = false;
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
      };
    }, []);
    function resetControls() {
      userZoomRef.current = defaultSettings.zoom;
      setZoom(defaultSettings.zoom);
      setSpeedMul(defaultSettings.speedMul);
      setTrailMax(defaultSettings.trail);
    }
    function togglePlay() {
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        mapRef.current.realStart = performance.now() / 1e3 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
        setIsPlaying(true);
      }
    }
    const durationOptions = [
      { label: "30s", seconds: 30 },
      { label: "2m", seconds: 120 },
      { label: "5m", seconds: 300 },
      { label: "10m", seconds: 600 },
      { label: "15m", seconds: 900 },
      { label: "30m", seconds: 1800 },
      { label: "45m", seconds: 2700 },
      { label: "1h", seconds: 3600 },
      { label: "1.5h", seconds: 5400 },
      { label: "2h", seconds: 7200 },
      { label: "2.5h", seconds: 9e3 },
      { label: "3h", seconds: 10800 },
      { label: "6h", seconds: 21600 },
      { label: "12h", seconds: 43200 },
      { label: "24h", seconds: 86400 }
    ];
    const eventLabel = eventType === "collision" ? `collision (${eventBodyInfo})` : eventType === "ejection" ? `ejection of ${eventBodyInfo}` : "an event";
    if (orientation === null) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-lg mb-3", children: "Choose starting orientation" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid grid-cols-2 gap-2 text-sm mb-3", children: [
          orientationPresets.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => {
                orientationRef.current = opt;
                setOrientation(opt);
              },
              className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20",
              children: opt.label
            },
            opt.label
          )),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => {
                const rand = randomOrientation();
                orientationRef.current = rand;
                setOrientation(rand);
              },
              className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20",
              children: "Random"
            }
          )
        ] })
      ] }) });
    }
    if (chosenDuration === null) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-lg mb-3", children: "Choose time until collision/ejection" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "grid grid-cols-3 gap-2 text-sm", children: durationOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: () => {
              mapRef.current.baseSpeed = 1;
              setSpeedMul(defaultSettings.speedMul);
              setTrailMax(defaultSettings.trail);
              userZoomRef.current = defaultSettings.zoom;
              setZoom(defaultSettings.zoom);
              setChosenDuration(opt.seconds);
            },
            className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20",
            children: opt.label
          },
          opt.label
        )) })
      ] }) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl", onWheel: handleWheel, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full", onMouseDown: handleMouseDown }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "absolute top-4 left-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-xs uppercase tracking-wider text-white/70", children: [
          "Time to ",
          eventLabel
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-3xl font-semibold tabular-nums", children: [
          Math.floor(countdown / 60).toString().padStart(2, "0"),
          ":",
          Math.floor(countdown % 60).toString().padStart(2, "0")
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "absolute top-4 right-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-xs uppercase tracking-wider text-white/70 mb-1", children: "Triadic palette" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex items-center gap-3", children: hexColors.map((hex, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full", style: { background: hex } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-sm font-mono text-white/80", children: hex.toUpperCase() })
        ] }, i)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-right mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: () => {
              if (seedRef.current) {
                navigator.clipboard.writeText(seedRef.current);
                setCopied(true);
                setTimeout(() => setCopied(false), 1e3);
              }
            },
            className: "text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20",
            children: copied ? "Copied!" : "Copy seed"
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: togglePlay,
            className: "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition",
            children: isPlaying ? "Pause" : "Play"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            onClick: resetAll,
            className: "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition leading-tight",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block", children: "Reset" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block text-xs opacity-80", children: "(new colors)" })
            ]
          }
        ),
        isReady && preBufRef.current && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-white/70 font-medium", children: [
          "Event: ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-white/90", children: eventLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-2", children: "\u2022" }),
          "Sim @ event: ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tabular-nums text-white/90", children: [
            preBufRef.current.tEvent.toFixed(2),
            "s"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-2", children: "\u2022" }),
          "Speed: ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tabular-nums text-white/90", children: [
            "\xD7",
            (mapRef.current.baseSpeed * speedMul).toFixed(2)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "absolute left-4 bottom-24 md:bottom-28 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg w-[min(88vw,420px)]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-xs uppercase tracking-widest text-white/70", children: "Controls" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setPanelOpen((v) => !v), className: "text-white/80 text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20", children: panelOpen ? "Minimize" : "Expand" })
        ] }),
        panelOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between text-xs text-white/70", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Zoom" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tabular-nums", children: [
                zoom.toFixed(2),
                "\xD7"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "range",
                min: 0.5,
                max: 2.5,
                step: 0.01,
                value: zoom,
                onChange: (e) => {
                  const z = parseFloat(e.target.value);
                  setZoom(z);
                  userZoomRef.current = z;
                },
                className: "w-full accent-white/90"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between text-xs text-white/70", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Speed" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "tabular-nums", children: [
                "\xD7",
                (mapRef.current.baseSpeed * speedMul).toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "range",
                min: 0.25,
                max: 3,
                step: 0.01,
                value: speedMul,
                onChange: (e) => setSpeedMul(parseFloat(e.target.value)),
                className: "w-full accent-white/90"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between text-xs text-white/70", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Trail length" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tabular-nums", children: trailMax })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "range",
                min: 20,
                max: 600,
                step: 1,
                value: trailMax,
                onChange: (e) => setTrailMax(parseInt(e.target.value)),
                className: "w-full accent-white/90"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pt-1 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: resetControls, className: "px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 border border-white/20", children: "Reset" }) })
        ] })
      ] }),
      !isReady && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "absolute inset-0 flex items-center justify-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center relative", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-xs uppercase tracking-widest text-white/70 mb-2", children: "Preparing a near-perfect 3\u2011body setup\u2026" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-lg font-medium", children: "Searching for a slight perturbation that yields an event" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "mt-3 text-left text-xs font-mono text-white/80 w-64", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex justify-between mb-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: candidateInfo }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: attemptInfo })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "max-h-40 overflow-y-auto", children: progressLines.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: line }, i)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setImportOpen(true), className: "text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20", children: "Skip Exploration" }) })
        ] }),
        importOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center relative", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setImportOpen(false), className: "absolute top-2 right-2 text-white/80", children: "\xD7" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mb-2", children: "Paste seed" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: seedInput, onChange: (e) => setSeedInput(e.target.value), className: "w-64 h-24 text-black p-1 rounded" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 text-right", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => {
                try {
                  const data = JSON.parse(atob(seedInput.trim()));
                  orientationRef.current = { label: "Seed", p: data.p, v: data.v };
                  setOrientation({ label: "Seed", p: data.p, v: data.v });
                  seedImportRef.current = { p: data.p, v: data.v };
                  setChosenDuration(data.duration);
                  setImportOpen(false);
                } catch (err) {
                  alert("Invalid seed");
                }
              },
              className: "px-3 py-1 text-xs rounded-lg bg-white/10 border border-white/20",
              children: "Import simulation"
            }
          ) })
        ] }) })
      ] })
    ] });
  }
})();
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
