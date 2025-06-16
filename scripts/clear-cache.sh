#!/bin/bash

echo "🧹 Clearing Metro and npm cache..."

# Clear Metro cache
npx expo start --clear

echo "✅ Cache cleared and server restarted!"
