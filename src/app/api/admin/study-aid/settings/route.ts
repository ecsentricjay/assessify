// app/api/admin/study-aid/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

// For now, store in env or database table
// This is a simple in-memory version
const DEFAULT_SETTINGS = {
  default_free_attempts: 3,
  price_per_attempt: 500,
  price_5_pack: 2000,
  price_10_pack: 3500,
  feature_enabled: true,
  max_images_per_upload: 15,
  mcq_question_count: 25,
  theory_question_count: 10,
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // TODO: Fetch from database table if needed
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS
    });

  } catch (error) {
    console.error('[Get Settings] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const settings = await request.json();

    // TODO: Save to database table
    // For now, just return success
    console.log('[Settings] Updated:', settings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings
    });

  } catch (error) {
    console.error('[Update Settings] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
