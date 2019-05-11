export const notify = (message) => ({ channel, accessToken }) => 
  postMessage(channel, message, { accessToken, asUser: true })