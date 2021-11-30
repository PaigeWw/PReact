/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                     

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFizzServer';

function renderToReadableStream(children               )                 {
  let request;
  return new ReadableStream({
    start(controller) {
      request = createRequest(children, controller);
      startWork(request);
    },
    pull(controller) {
      startFlowing(request);
    },
    cancel(reason) {},
  });
}

export {renderToReadableStream};
