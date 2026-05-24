import { pageView, trackEvent } from './utils/gtm.js';
import { getTrackingData, initTracking } from './utils/tracking.js';

initTracking();
pageView();

window.tpclubTrackEvent = trackEvent;
window.getTrackingData = getTrackingData;
