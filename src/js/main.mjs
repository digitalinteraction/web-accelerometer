import { redirectConsole, watchParameters, download } from './util.mjs';

window.addEventListener("error", function (e) {
    document.getElementById('warnings').appendChild(document.createTextNode('⚠️ Unhandled error.'));
    console.log("ERROR: Unhandled error: " + (e.error && e.error.message ? e.error.message : e.error));
    console.log(JSON.stringify(e));
    return false;
});

window.addEventListener("unhandledrejection", function (e) {
    document.getElementById('warnings').appendChild(document.createTextNode('⚠️ Unhandled promise rejection.'));
    console.log("ERROR: Unhandled rejection: " + (e.error && e.error.message ? e.error.message : e.error));
    console.log(JSON.stringify(e));
    return false;
});

let globalParams = {};
let showDebug = true;
let domLoaded = false;

// Don't redirect console unless debug view is enabled (will require refresh if #debug added)
let redirected = false;
function redirect() {
    if (!redirected) {
        redirectConsole('#output');
        redirected = true;
    }
    if (domLoaded) { document.querySelector('body').classList.toggle('console', showDebug); }
}
watchParameters(parametersChanged);
if (showDebug) { redirect(); }



// Service Worker Registration
if (false && 'serviceWorker' in navigator) {
    // Wait until page is loaded
    window.addEventListener('load', async function() {
        try {
            // Load 'service-worker.js', must be in a top-level directory.
            const serviceWorkerFile = 'service-worker.js';
            const reg = await navigator.serviceWorker.register(serviceWorkerFile);
            // If service-worker.js changes...
            reg.onupdatefound = function() {
                const installing = reg.installing;
                installing.onstatechange = function() {
                    switch (installing.state) {
                        case 'installed':
                            if (navigator.serviceWorker.controller) {
                                console.log('SERVICEWORKER: New content available.');
                                if (confirm('[ServiceWorker] Update available -- reload now?')) {
                                    window.location.reload();
                                }
                            } else {
                                console.log('SERVICEWORKER: Now available offline.');
                            }
                            break;
                        case 'redundant':
                            console.log('SERVICEWORKER: Installing worker was redundant.');
                            break;
                    }
                };
            };
        } catch (e) {
            console.log('SERVICEWORKER: Error during registration: ' + e);
        }
    });
}

// Old appcache
if (window.applicationCache) {
    applicationCache.addEventListener('updateready', function() {
        if (confirm('[AppCache] Update available -- reload now?')) {
            window.location.reload();
        }
    });
}


function parametersChanged(params = globalParams) {
    globalParams = params;
    console.log('PARAMS: ' + JSON.stringify(params));

    if (typeof params.nodebug !== 'undefined') showDebug = false;
    if (typeof params.debug !== 'undefined') showDebug = true;
    if (showDebug) { redirect(); }

    // Everything else here requires DOM
    if (!domLoaded) return;

    // ...
}


const frequency = 50;
let accelerometer = null;
let accelStarted = false;
let logger = [];

function accelData(e) {
    const time = Date.now();
    const line = `${time},${accelerometer.x},${accelerometer.y},${accelerometer.z}`;
    logger.push(line);
    console.log(line);
}

async function accelStart() {
    if (!accelerometer) {
        console.log('PERMISSION: Asking...');
        const permissionResult = await navigator.permissions.query({name:'accelerometer'});
        if (permissionResult.state === 'granted') {
            console.log('PERMISSION: Granted');
            accelerometer = new Accelerometer({frequency});
            accelerometer.addEventListener('reading', accelData);
        } else if (permissionResult.state === 'prompt') {
            console.log('PERMISSION: Prompt');
        } else {
            console.log('PERMISSION: Unexpected state: ' + permissionResult.state);
        }
    }
    if (accelerometer) {
        logger = [];
        accelerometer.start();
        accelStarted = true;
    }
}

function accelStop() {
    accelerometer.stop();
    if (logger.length > 0) {
        const now = (new Date()).toISOString().replace(/[^0-9]/g, '');
        download(`accel-${now}.csv`, logger.join('\r\n'));
        logger = [];
    }
    accelStarted = false;
}


window.addEventListener('DOMContentLoaded', async (event) => {
    domLoaded = true;

    document.querySelector('#go').addEventListener('click', async () => {
        //document.querySelector('body').classList.remove('completed');
        if (!accelStarted) {
            accelStart();
        } else {
            accelStop();
        }
    });

    // Call again now the DOM is loaded
    parametersChanged();

});


