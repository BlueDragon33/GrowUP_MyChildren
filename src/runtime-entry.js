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
import './v12-runtime.js';
import './v13-runtime.js';
import './v14-runtime.js';
import './v15-runtime.js';
import './v16-runtime.js';
import './v16-guard.js';
import './v17-runtime.js';
import './v18-runtime.js';
import './v19-runtime.js';
import './a11y.js';

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const localControlRuntimePort = '3006';
if (
  typeof window !== 'undefined'
  && loopbackHosts.has(window.location.hostname)
  && window.location.port === localControlRuntimePort
) {
  void import('../control/local-device-gateway.js');
}
