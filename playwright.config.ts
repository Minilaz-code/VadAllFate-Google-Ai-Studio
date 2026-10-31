import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',workers:1,timeout:60000,reporter:'list',
  outputDir:process.env.VADALLFATE_E2E_OUTPUT || 'test-results',
  use:{baseURL:process.env.VADALLFATE_E2E_URL || 'http://127.0.0.1:3187',channel:'msedge',headless:true,trace:'off',video:'off'}});
