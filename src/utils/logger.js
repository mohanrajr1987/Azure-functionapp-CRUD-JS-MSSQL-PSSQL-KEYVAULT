const { ApplicationInsightsTelemetryClient } = require('@microsoft/applicationinsights-web');

let telemetryClient = null;

function initializeLogger() {
    if (!telemetryClient) {
        telemetryClient = new ApplicationInsightsTelemetryClient({
            instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
        });
    }
    return telemetryClient;
}

function logEvent(name, properties = {}) {
    const client = initializeLogger();
    client.trackEvent({ name, properties });
}

function logMetric(name, value, properties = {}) {
    const client = initializeLogger();
    client.trackMetric({ name, value, properties });
}

function logTrace(message, properties = {}) {
    const client = initializeLogger();
    client.trackTrace({ message, properties });
}

function logException(error, properties = {}) {
    const client = initializeLogger();
    client.trackException({ error, properties });
}

function logRequest(name, url, duration, resultCode, success, properties = {}) {
    const client = initializeLogger();
    client.trackRequest({
        name,
        url,
        duration,
        resultCode,
        success,
        properties
    });
}

module.exports = {
    logEvent,
    logMetric,
    logTrace,
    logException,
    logRequest
};
