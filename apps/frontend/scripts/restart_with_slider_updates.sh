#!/bin/bash

# Quick script to restart frontend with updated slider controls

echo "╔════════════════════════════════════════════════╗"
echo "║   Frontend Slider Controls - Quick Restart    ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

cd /home/ankit/Documents/Code/vs/frontend

echo "🔍 Checking for running frontend..."
FRONTEND_PID=$(lsof -ti:3000 2>/dev/null || echo "")

if [ ! -z "$FRONTEND_PID" ]; then
    echo "⚠️  Frontend is already running on port 3000 (PID: $FRONTEND_PID)"
    read -p "Kill and restart? (y/n): " RESTART
    if [ "$RESTART" = "y" ]; then
        echo "🛑 Stopping frontend..."
        kill $FRONTEND_PID
        sleep 2
        echo "✅ Frontend stopped"
    else
        echo "ℹ️  Keeping existing frontend. Just refresh your browser!"
        echo ""
        echo "📍 Open: http://localhost:3000/admin/cool_coder/slider"
        exit 0
    fi
fi

echo "🚀 Starting frontend dev server..."
echo ""
echo "📝 Changes applied:"
echo "   ✅ Target audience dropdown for each banner"
echo "   ✅ Emoji indicators (👥 All / 👨‍🎓 Students / 👨‍🏫 Teachers)"
echo "   ✅ Target selector buttons in 'Add New Banner' form"
echo "   ✅ Updated descriptions"
echo ""
echo "🌐 Opening URL: http://localhost:3000/admin/cool_coder/slider"
echo ""

# Start in background
npm run dev &

# Wait a bit for server to start
sleep 5

echo ""
echo "✅ Frontend is starting!"
echo ""
echo "📍 Admin Panel URL:"
echo "   http://localhost:3000/admin/cool_coder/slider"
echo ""
echo "🔍 To view logs:"
echo "   tail -f /home/ankit/Documents/Code/vs/frontend/.next/trace"
echo ""
echo "🛑 To stop:"
echo "   lsof -ti:3000 | xargs kill"
echo ""
echo "🎉 Enjoy your new role-based slider controls!"
