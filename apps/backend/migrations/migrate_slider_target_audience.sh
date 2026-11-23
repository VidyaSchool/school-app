#!/bin/bash

# Database Migration Script for Slider Target Audience Feature
# This script adds the target_audience column to the slider_image table

echo "================================================"
echo "Slider Image Target Audience Migration"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable is not set"
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:password@localhost:5432/dbname'"
    echo ""
    read -p "Enter DATABASE_URL: " DATABASE_URL
fi

echo "📊 Database: $DATABASE_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client."
    exit 1
fi

echo "🔍 Checking if target_audience column exists..."
COLUMN_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='slider_image' AND column_name='target_audience';")

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    echo "✅ Column target_audience already exists. Skipping migration."
else
    echo "➕ Adding target_audience column..."
    psql "$DATABASE_URL" <<SQL
    -- Add the new column
    ALTER TABLE slider_image 
    ADD COLUMN target_audience VARCHAR(20) DEFAULT 'all';

    -- Update existing records
    UPDATE slider_image 
    SET target_audience = 'all' 
    WHERE target_audience IS NULL;

    -- Add constraint
    ALTER TABLE slider_image 
    ADD CONSTRAINT check_target_audience 
    CHECK (target_audience IN ('all', 'students', 'teachers'));
SQL
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully!"
    else
        echo "❌ Migration failed. Please check the error above."
        exit 1
    fi
fi

echo ""
echo "🔍 Verifying migration..."
psql "$DATABASE_URL" -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='slider_image';"

echo ""
echo "📊 Current slider images:"
psql "$DATABASE_URL" -c "SELECT id, title, enabled, target_audience FROM slider_image ORDER BY id;"

echo ""
echo "================================================"
echo "✅ Migration script completed!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Restart your backend: cd backend && python -m uvicorn main:app --reload"
echo "2. Rebuild mobile app: cd mobile-app/kotlin && ./gradlew assembleDebug"
echo "3. Test the role-based slider filtering"
