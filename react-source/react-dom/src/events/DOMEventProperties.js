/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                     
                                                  

import {registerTwoPhaseEvent} from './EventRegistry';
import {
  ANIMATION_END,
  ANIMATION_ITERATION,
  ANIMATION_START,
  TRANSITION_END,
} from './DOMEventNames';
import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from 'shared/ReactTypes';

import {enableCreateEventHandleAPI} from 'shared/ReactFeatureFlags';

export const topLevelEventsToReactNames      
               
                
  = new Map();

const eventPriorities = new Map();

// We store most of the events in this module in pairs of two strings so we can re-use
// the code required to apply the same logic for event prioritization and that of the
// SimpleEventPlugin. This complicates things slightly, but the aim is to reduce code
// duplication (for which there would be quite a bit). For the events that are not needed
// for the SimpleEventPlugin (otherDiscreteEvents) we process them separately as an
// array of top level events.

// Lastly, we ignore prettier so we can keep the formatting sane.

// prettier-ignore
const discreteEventPairsForSimpleEventPlugin = [
  ('cancel'              ), 'cancel',
  ('click'              ), 'click',
  ('close'              ), 'close',
  ('contextmenu'              ), 'contextMenu',
  ('copy'              ), 'copy',
  ('cut'              ), 'cut',
  ('auxclick'              ), 'auxClick',
  ('dblclick'              ), 'doubleClick', // Careful!
  ('dragend'              ), 'dragEnd',
  ('dragstart'              ), 'dragStart',
  ('drop'              ), 'drop',
  ('focusin'              ), 'focus', // Careful!
  ('focusout'              ), 'blur', // Careful!
  ('input'              ), 'input',
  ('invalid'              ), 'invalid',
  ('keydown'              ), 'keyDown',
  ('keypress'              ), 'keyPress',
  ('keyup'              ), 'keyUp',
  ('mousedown'              ), 'mouseDown',
  ('mouseup'              ), 'mouseUp',
  ('paste'              ), 'paste',
  ('pause'              ), 'pause',
  ('play'              ), 'play',
  ('pointercancel'              ), 'pointerCancel',
  ('pointerdown'              ), 'pointerDown',
  ('pointerup'              ), 'pointerUp',
  ('ratechange'              ), 'rateChange',
  ('reset'              ), 'reset',
  ('seeked'              ), 'seeked',
  ('submit'              ), 'submit',
  ('touchcancel'              ), 'touchCancel',
  ('touchend'              ), 'touchEnd',
  ('touchstart'              ), 'touchStart',
  ('volumechange'              ), 'volumeChange',
];

const otherDiscreteEvents                      = [
  'change',
  'selectionchange',
  'textInput',
  'compositionstart',
  'compositionend',
  'compositionupdate',
];

if (enableCreateEventHandleAPI) {
  // Special case: these two events don't have on* React handler
  // and are only accessible via the createEventHandle API.
  topLevelEventsToReactNames.set('beforeblur', null);
  topLevelEventsToReactNames.set('afterblur', null);
  otherDiscreteEvents.push('beforeblur', 'afterblur');
}

// prettier-ignore
const userBlockingPairsForSimpleEventPlugin                               = [
  ('drag'              ), 'drag',
  ('dragenter'              ), 'dragEnter',
  ('dragexit'              ), 'dragExit',
  ('dragleave'              ), 'dragLeave',
  ('dragover'              ), 'dragOver',
  ('mousemove'              ), 'mouseMove',
  ('mouseout'              ), 'mouseOut',
  ('mouseover'              ), 'mouseOver',
  ('pointermove'              ), 'pointerMove',
  ('pointerout'              ), 'pointerOut',
  ('pointerover'              ), 'pointerOver',
  ('scroll'              ), 'scroll',
  ('toggle'              ), 'toggle',
  ('touchmove'              ), 'touchMove',
  ('wheel'              ), 'wheel',
];

// prettier-ignore
const continuousPairsForSimpleEventPlugin                               = [
  ('abort'              ), 'abort',
  (ANIMATION_END              ), 'animationEnd',
  (ANIMATION_ITERATION              ), 'animationIteration',
  (ANIMATION_START              ), 'animationStart',
  ('canplay'              ), 'canPlay',
  ('canplaythrough'              ), 'canPlayThrough',
  ('durationchange'              ), 'durationChange',
  ('emptied'              ), 'emptied',
  ('encrypted'              ), 'encrypted',
  ('ended'              ), 'ended',
  ('error'              ), 'error',
  ('gotpointercapture'              ), 'gotPointerCapture',
  ('load'              ), 'load',
  ('loadeddata'              ), 'loadedData',
  ('loadedmetadata'              ), 'loadedMetadata',
  ('loadstart'              ), 'loadStart',
  ('lostpointercapture'              ), 'lostPointerCapture',
  ('playing'              ), 'playing',
  ('progress'              ), 'progress',
  ('seeking'              ), 'seeking',
  ('stalled'              ), 'stalled',
  ('suspend'              ), 'suspend',
  ('timeupdate'              ), 'timeUpdate',
  (TRANSITION_END              ), 'transitionEnd',
  ('waiting'              ), 'waiting',
];

/**
 * Turns
 * ['abort', ...]
 *
 * into
 *
 * topLevelEventsToReactNames = new Map([
 *   ['abort', 'onAbort'],
 * ]);
 *
 * and registers them.
 */
function registerSimplePluginEventsAndSetTheirPriorities(
  eventTypes                              ,
  priority               ,
)       {
  // As the event types are in pairs of two, we need to iterate
  // through in twos. The events are in pairs of two to save code
  // and improve init perf of processing this array, as it will
  // result in far fewer object allocations and property accesses
  // if we only use three arrays to process all the categories of
  // instead of tuples.
  for (let i = 0; i < eventTypes.length; i += 2) {
    const topEvent = ((eventTypes[i]     )              );
    const event = ((eventTypes[i + 1]     )        );
    const capitalizedEvent = event[0].toUpperCase() + event.slice(1);
    const reactName = 'on' + capitalizedEvent;
    eventPriorities.set(topEvent, priority);
    topLevelEventsToReactNames.set(topEvent, reactName);
    registerTwoPhaseEvent(reactName, [topEvent]);
  }
}

function setEventPriorities(
  eventTypes                     ,
  priority               ,
)       {
  for (let i = 0; i < eventTypes.length; i++) {
    eventPriorities.set(eventTypes[i], priority);
  }
}

export function getEventPriorityForPluginSystem(
  domEventName              ,
)                {
  const priority = eventPriorities.get(domEventName);
  // Default to a ContinuousEvent. Note: we might
  // want to warn if we can't detect the priority
  // for the event.
  return priority === undefined ? ContinuousEvent : priority;
}

export function getEventPriorityForListenerSystem(
  type              ,
)                {
  const priority = eventPriorities.get(type);
  if (priority !== undefined) {
    return priority;
  }
  if (__DEV__) {
    console.warn(
      'The event "%s" provided to createEventHandle() does not have a known priority type.' +
        ' This is likely a bug in React.',
      type,
    );
  }
  return ContinuousEvent;
}

export function registerSimpleEvents() {
  registerSimplePluginEventsAndSetTheirPriorities(
    discreteEventPairsForSimpleEventPlugin,
    DiscreteEvent,
  );
  registerSimplePluginEventsAndSetTheirPriorities(
    userBlockingPairsForSimpleEventPlugin,
    UserBlockingEvent,
  );
  registerSimplePluginEventsAndSetTheirPriorities(
    continuousPairsForSimpleEventPlugin,
    ContinuousEvent,
  );
  setEventPriorities(otherDiscreteEvents, DiscreteEvent);
}
