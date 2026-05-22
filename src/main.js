import { pageView, trackEvent } from './utils/gtm.js';
import { initTracking } from './utils/tracking.js';

initTracking();
pageView();

window.tpclubTrackEvent = trackEvent;
