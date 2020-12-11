#!/usr/bin/env node

'use strict';

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

process.stdin.on('data', (msg) => {
  const { country } = safeParse(msg);
  if (country && country.code) {
    process.stdout.write(country.code);
  }
});
