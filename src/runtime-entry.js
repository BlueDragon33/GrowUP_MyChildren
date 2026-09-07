import './app.js';
import './enhancements.js';
import './v4.js';
import './v5.js';
import './v6.js';
import './v7.js';
import './v8.js';
import './v9-runtime.js';
import './v9-compat.js';
import './v10-runtime.js';
import './v11-runtime.js';
import './a11y.js';
import { markCompatibilityLayer } from './core/compatibility-usage.js';

for(const layer of ['v4','v5','v6','v7','v8','v9-runtime','v9-compat','v10-runtime']) markCompatibilityLayer(layer);
document.dispatchEvent(new Event('growup:compatibility-usage-updated'));
