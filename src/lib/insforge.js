import { createClient } from '@insforge/sdk';

const baseUrl = 'https://s9ydctt5.eu-central.insforge.app';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzYzODl9.qJeffBqkfXzD34kTOEVR-eT33rYyRSFSWlRu3gvScTw';

export const insforge = createClient({
  baseUrl,
  anonKey
});
