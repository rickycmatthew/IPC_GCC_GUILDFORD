// netlify/functions/subscribe.js
// Uses @netlify/blobs which is auto-configured in Netlify's runtime environment

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const subscription = JSON.parse(event.body);
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid subscription' }) };
    }

    const key = Buffer.from(subscription.endpoint)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 60);

    console.log('Saving subscription key:', key);

    // getDeployStore works without extra config in Netlify's runtime
    const { getDeployStore } = require('@netlify/blobs');
    const store = getDeployStore('push-subscriptions');
    await store.set(key, JSON.stringify(subscription));

    console.log('Saved OK');
    return { statusCode: 201, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Subscribe error:', err.message);

    // Try fallback: getStore with no config (works in newer Netlify runtime)
    try {
      const sub = JSON.parse(event.body);
      const { getStore } = require('@netlify/blobs');
      const store = getStore('push-subscriptions');
      const key = Buffer.from(sub.endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,60);
      await store.set(key, JSON.stringify(sub));
      console.log('Saved via fallback getStore');
      return { statusCode: 201, headers, body: JSON.stringify({ success: true, via: 'fallback' }) };
    } catch (err2) {
      console.error('Fallback also failed:', err2.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, fallback: err2.message }) };
    }
  }
};
