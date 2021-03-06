/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule ReactComponentTreeHook
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');

var invariant = require('invariant');
var warning = require('warning');

import type {ReactElement, Source} from 'ReactElementType';
import type {DebugID} from 'ReactInstanceType';

function isNative(fn) {
  // Based on isNative() from Lodash
  var funcToString = Function.prototype.toString;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var reIsNative = RegExp(
    '^' +
      funcToString
        // Take an example native function source for comparison
        .call(hasOwnProperty)
        // Strip regex characters so we can use it for regex
        .replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
        // Remove hasOwnProperty from the template to make it generic
        .replace(
          /hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,
          '$1.*?',
        ) +
      '$',
  );
  try {
    var source = funcToString.call(fn);
    return reIsNative.test(source);
  } catch (err) {
    return false;
  }
}

var canUseCollections =
  // Array.from
  typeof Array.from === 'function' &&
  // Map
  typeof Map === 'function' &&
  isNative(Map) &&
  // Map.prototype.keys
  Map.prototype != null &&
  typeof Map.prototype.keys === 'function' &&
  isNative(Map.prototype.keys) &&
  // Set
  typeof Set === 'function' &&
  isNative(Set) &&
  // Set.prototype.keys
  Set.prototype != null &&
  typeof Set.prototype.keys === 'function' &&
  isNative(Set.prototype.keys);

var setItem;
var getItem;
var removeItem;
var getItemIDs;
var addRoot;
var removeRoot;
var getRootIDs;

if (canUseCollections) {
  var itemMap = new Map();
  var rootIDSet = new Set();

  setItem = function(id, item) {
    itemMap.set(id, item);
  };
  getItem = function(id) {
    return itemMap.get(id);
  };
  removeItem = function(id) {
    itemMap.delete(id);
  };
  getItemIDs = function() {
    return Array.from(itemMap.keys());
  };

  addRoot = function(id) {
    rootIDSet.add(id);
  };
  removeRoot = function(id) {
    rootIDSet.delete(id);
  };
  getRootIDs = function() {
    return Array.from(rootIDSet.keys());
  };
} else {
  var itemByKey = {};
  var rootByKey = {};

  // Use non-numeric keys to prevent V8 performance issues:
  // https://github.com/facebook/react/pull/7232
  var getKeyFromID = function(id: DebugID): string {
    return '.' + id;
  };
  var getIDFromKey = function(key: string): DebugID {
    return parseInt(key.substr(1), 10);
  };

  setItem = function(id, item) {
    var key = getKeyFromID(id);
    itemByKey[key] = item;
  };
  getItem = function(id) {
    var key = getKeyFromID(id);
    return itemByKey[key];
  };
  removeItem = function(id) {
    var key = getKeyFromID(id);
    delete itemByKey[key];
  };
  getItemIDs = function() {
    return Object.keys(itemByKey).map(getIDFromKey);
  };

  addRoot = function(id) {
    var key = getKeyFromID(id);
    rootByKey[key] = true;
  };
  removeRoot = function(id) {
    var key = getKeyFromID(id);
    delete rootByKey[key];
  };
  getRootIDs = function() {
    return Object.keys(rootByKey).map(getIDFromKey);
  };
}

var unmountedIDs: Array<DebugID> = [];

function purgeDeep(id) {
  var item = getItem(id);
  if (item) {
    var {childIDs} = item;
    removeItem(id);
    childIDs.forEach(purgeDeep);
  }
}

function describeComponentFrame(name, source, ownerName) {
  return (
    '\n    in ' +
    (name || 'Unknown') +
    (source
      ? ' (at ' +
          source.fileName.replace(/^.*[\\\/]/, '') +
          ':' +
          source.lineNumber +
          ')'
      : ownerName ? ' (created by ' + ownerName + ')' : '')
  );
}

function getDisplayName(element: ?ReactElement): string {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function describeID(id: DebugID): string {
  var name = ReactComponentTreeHook.getDisplayName(id);
  var element = ReactComponentTreeHook.getElement(id);
  var ownerID = ReactComponentTreeHook.getOwnerID(id);
  var ownerName;
  if (ownerID) {
    ownerName = ReactComponentTreeHook.getDisplayName(ownerID);
  }
  warning(
    element,
    'ReactComponentTreeHook: Missing React element for debugID %s when ' +
      'building stack',
    id,
  );
  return describeComponentFrame(name, element && element._source, ownerName);
}

var ReactComponentTreeHook = {
  onSetChildren(id: DebugID, nextChildIDs: Array<DebugID>): void {
    var item = getItem(id);
    invariant(item, 'Item must have been set');
    item.childIDs = nextChildIDs;

    for (var i = 0; i < nextChildIDs.length; i++) {
      var nextChildID = nextChildIDs[i];
      var nextChild = getItem(nextChildID);
      invariant(
        nextChild,
        'Expected hook events to fire for the child ' +
          'before its parent includes it in onSetChildren().',
      );
      invariant(
        nextChild.childIDs != null ||
          typeof nextChild.element !== 'object' ||
          nextChild.element == null,
        'Expected onSetChildren() to fire for a container child ' +
          'before its parent includes it in onSetChildren().',
      );
      invariant(
        nextChild.isMounted,
        'Expected onMountComponent() to fire for the child ' +
          'before its parent includes it in onSetChildren().',
      );
      if (nextChild.parentID == null) {
        nextChild.parentID = id;
        // TODO: This shouldn't be necessary but mounting a new root during in
        // componentWillMount currently causes not-yet-mounted components to
        // be purged from our tree data so their parent id is missing.
      }
      invariant(
        nextChild.parentID === id,
        'Expected onBeforeMountComponent() parent and onSetChildren() to ' +
          'be consistent (%s has parents %s and %s).',
        nextChildID,
        nextChild.parentID,
        id,
      );
    }
  },

  onBeforeMountComponent(
    id: DebugID,
    element: ReactElement,
    parentID: DebugID,
  ): void {
    var item = {
      element,
      parentID,
      text: null,
      childIDs: [],
      isMounted: false,
      updateCount: 0,
    };
    setItem(id, item);
  },

  onBeforeUpdateComponent(id: DebugID, element: ReactElement): void {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.element = element;
  },

  onMountComponent(id: DebugID): void {
    var item = getItem(id);
    invariant(item, 'Item must have been set');
    item.isMounted = true;
    var isRoot = item.parentID === 0;
    if (isRoot) {
      addRoot(id);
    }
  },

  onUpdateComponent(id: DebugID): void {
    var item = getItem(id);
    if (!item || !item.isMounted) {
      // We may end up here as a result of setState() in componentWillUnmount().
      // In this case, ignore the element.
      return;
    }
    item.updateCount++;
  },

  onUnmountComponent(id: DebugID): void {
    var item = getItem(id);
    if (item) {
      // We need to check if it exists.
      // `item` might not exist if it is inside an error boundary, and a sibling
      // error boundary child threw while mounting. Then this instance never
      // got a chance to mount, but it still gets an unmounting event during
      // the error boundary cleanup.
      item.isMounted = false;
      var isRoot = item.parentID === 0;
      if (isRoot) {
        removeRoot(id);
      }
    }
    unmountedIDs.push(id);
  },

  purgeUnmountedComponents(): void {
    if (ReactComponentTreeHook._preventPurging) {
      // Should only be used for testing.
      return;
    }

    for (var i = 0; i < unmountedIDs.length; i++) {
      var id = unmountedIDs[i];
      purgeDeep(id);
    }
    unmountedIDs.length = 0;
  },

  isMounted(id: DebugID): boolean {
    var item = getItem(id);
    return item ? item.isMounted : false;
  },

  getCurrentStackAddendum(topElement: ?ReactElement): string {
    var info = '';
    if (topElement) {
      var name = getDisplayName(topElement);
      var owner = topElement._owner;
      info += describeComponentFrame(
        name,
        topElement._source,
        owner && owner.getName(),
      );
    }

    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    info += ReactComponentTreeHook.getStackAddendumByID(id);
    return info;
  },

  getStackAddendumByID(id: ?DebugID): string {
    var info = '';
    while (id) {
      info += describeID(id);
      id = ReactComponentTreeHook.getParentID(id);
    }
    return info;
  },

  getChildIDs(id: DebugID): Array<DebugID> {
    var item = getItem(id);
    return item ? item.childIDs : [];
  },

  getDisplayName(id: DebugID): ?string {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element) {
      return null;
    }
    return getDisplayName(element);
  },

  getElement(id: DebugID): ?ReactElement {
    var item = getItem(id);
    return item ? item.element : null;
  },

  getOwnerID(id: DebugID): ?DebugID {
    var element = ReactComponentTreeHook.getElement(id);
    if (!element || !element._owner) {
      return null;
    }
    return element._owner._debugID;
  },

  getParentID(id: DebugID): ?DebugID {
    var item = getItem(id);
    return item ? item.parentID : null;
  },

  getSource(id: DebugID): ?Source {
    var item = getItem(id);
    var element = item ? item.element : null;
    var source = element != null ? element._source : null;
    return source;
  },

  getText(id: DebugID): ?string {
    var element = ReactComponentTreeHook.getElement(id);
    if (typeof element === 'string') {
      return element;
    } else if (typeof element === 'number') {
      return '' + element;
    } else {
      return null;
    }
  },

  getUpdateCount(id: DebugID): number {
    var item = getItem(id);
    return item ? item.updateCount : 0;
  },

  getRootIDs,
  getRegisteredIDs: getItemIDs,

  pushNonStandardWarningStack(
    isCreatingElement: boolean,
    currentSource: ?Source,
  ) {
    if (typeof console.reactStack !== 'function') {
      return;
    }

    var stack = [];
    var currentOwner = ReactCurrentOwner.current;
    var id = currentOwner && currentOwner._debugID;

    try {
      if (isCreatingElement) {
        stack.push({
          name: id ? ReactComponentTreeHook.getDisplayName(id) : null,
          fileName: currentSource ? currentSource.fileName : null,
          lineNumber: currentSource ? currentSource.lineNumber : null,
        });
      }

      while (id) {
        var element = ReactComponentTreeHook.getElement(id);
        var parentID = ReactComponentTreeHook.getParentID(id);
        var ownerID = ReactComponentTreeHook.getOwnerID(id);
        var ownerName = ownerID
          ? ReactComponentTreeHook.getDisplayName(ownerID)
          : null;
        var source = element && element._source;
        stack.push({
          name: ownerName,
          fileName: source ? source.fileName : null,
          lineNumber: source ? source.lineNumber : null,
        });
        id = parentID;
      }
    } catch (err) {
      // Internal state is messed up.
      // Stop building the stack (it's just a nice to have).
    }

    console.reactStack(stack);
  },

  popNonStandardWarningStack() {
    if (typeof console.reactStackEnd !== 'function') {
      return;
    }
    console.reactStackEnd();
  },
};

module.exports = ReactComponentTreeHook;
