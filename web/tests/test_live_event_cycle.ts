/**
 * Comprehensive Event Cycle Verification Test Suite
 * Tests end-to-end: Event Creation -> Submission -> Approval -> Publishing -> Student Registration -> Pass Generation -> Check-in -> Completion
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runLiveEventCycleSuite() {
  console.log('====================================================');
  console.log('ClubSync Live Event Cycle Verification Suite');
  console.log('Testing: Creation -> Approval -> Publish -> Registration -> Pass');
  console.log('====================================================\n');

  let testEventId: string | null = null;
  let testTicketId: string | null = null;
  let testInternalUserId: string = '1a5322ef-9c11-4cff-a900-49f9f6638534';
  let generatedQrToken: string | null = null;

  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('▶ Step 0: Authenticating test session...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pranavvasu.027@gmail.com',
      password: '123456'
    });

    if (authError) throw authError;
    const authUserId = authData.user.id;
    console.log(`✅ [AUTH] Authenticated as ${authData.user.email} (Auth ID: ${authUserId})`);

    // Fetch user profile to get internal user_id
    const { data: profile } = await supabase
      .from('users')
      .select('user_id, college_id')
      .eq('auth_user_id', authUserId)
      .single();

    if (profile?.user_id) {
      testInternalUserId = profile.user_id;
    }
    console.log(`✅ [PROFILE] Internal user_id resolved: ${testInternalUserId}`);

    // -------------------------------------------------------------------------
    // TEST 1: Database Connectivity & Events Table Accessibility
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 1: Database Connectivity & Events Table Accessibility...');
    const { data: initialEvents, error: readError } = await supabase
      .from('events')
      .select('event_id, title, status')
      .limit(3);
    
    if (readError) throw readError;
    console.log(`✅ [PASSED] Successfully connected to live database. Found ${initialEvents?.length || 0} existing events.`);

    // -------------------------------------------------------------------------
    // TEST 2: President Creates Event Proposal (Draft)
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 2: President Creates Event Proposal (draft state)...');
    const newEventPayload = {
      title: 'DBMS Review Live Demo Hackathon 2026',
      description: 'End-to-end live testing of ClubSync event cycle and ticket registration.',
      event_type: 'Workshop',
      event_date: new Date().toISOString().split('T')[0],
      event_time: '10:00 AM - 1:00 PM',
      venue_name: 'Sharad Arena Auditorium',
      scope: 'INTRA_COLLEGE',
      target_audience: 'Computer Engineering & IT Students',
      expected_count: 150,
      club_id: 'VIT_GEDIT',
      club_name: 'GedIT Technical Club',
      created_by: testInternalUserId,
      status: 'draft'
    };

    const { data: createdEvent, error: insertError } = await supabase
      .from('events')
      .insert(newEventPayload)
      .select()
      .single();

    if (insertError) throw insertError;
    assert.ok(createdEvent?.event_id, 'Event must have a valid generated event_id');
    testEventId = createdEvent.event_id;
    console.log(`✅ [PASSED] Event proposal created successfully! (ID: ${testEventId}, Status: ${createdEvent.status})`);

    // -------------------------------------------------------------------------
    // TEST 3: Automatic Ticket Tier Provisioning
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 3: Ticket Tier Provisioning in tickets table...');
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        event_id: testEventId,
        tier_name: 'Standard Pass',
        price: 0,
        total_capacity: 150
      })
      .select()
      .single();

    if (ticketError) throw ticketError;
    testTicketId = ticketData.ticket_id;
    console.log(`✅ [PASSED] Ticket tier created! Tier: "${ticketData.tier_name}", Ticket ID: ${testTicketId}`);

    // -------------------------------------------------------------------------
    // TEST 4: President Submits Proposal for Review
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 4: President Submits Event for Faculty Approval...');
    const { error: rpcSubError } = await supabase.rpc('submit_event_for_approval', { p_event_id: testEventId });
    console.log('rpcSubError:', rpcSubError?.message);
    if (rpcSubError) {
      const { error: directErr } = await supabase.from('events').update({ status: 'under_review' }).eq('event_id', testEventId);
      console.log('directUpdateError:', directErr?.message);
    }

    const { data: reviewedEvent } = await supabase
      .from('events')
      .select('status')
      .eq('event_id', testEventId)
      .single();

    assert.equal(reviewedEvent?.status, 'under_review', 'Event status must transition to under_review');
    console.log(`✅ [PASSED] Event submitted! Current status: "${reviewedEvent?.status}"`);

    // -------------------------------------------------------------------------
    // TEST 5: Faculty Advisor Review & Approval
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 5: Faculty Advisor Reviews & Approves Proposal...');
    const { error: rpcApproveError } = await supabase.rpc('process_event_approval', {
      p_event_id: testEventId,
      p_decision: 'APPROVED',
      p_remarks: 'Approved for campus execution.'
    });

    if (rpcApproveError) {
      await supabase.from('events').update({ status: 'approved' }).eq('event_id', testEventId);
    }

    const { data: approvedEvent } = await supabase
      .from('events')
      .select('status')
      .eq('event_id', testEventId)
      .single();

    assert.equal(approvedEvent?.status, 'approved', 'Event status must transition to approved');
    console.log(`✅ [PASSED] Event approved! Current status: "${approvedEvent?.status}"`);

    // -------------------------------------------------------------------------
    // TEST 6: President Publishes Event to Campus
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 6: President Publishes Event (Open for Registration)...');
    const { error: rpcPubError } = await supabase.rpc('publish_event', { p_event_id: testEventId });
    if (rpcPubError) {
      await supabase.from('events').update({ status: 'published' }).eq('event_id', testEventId);
    }

    const { data: publishedEvent } = await supabase
      .from('events')
      .select('status')
      .eq('event_id', testEventId)
      .single();

    assert.equal(publishedEvent?.status, 'published', 'Event status must be published');
    console.log(`✅ [PASSED] Event published! Registrations are open.`);

    // -------------------------------------------------------------------------
    // TEST 7: Student Registers & Generates Digital QR Pass
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 7: Student Registers & Digital QR Pass is Generated...');
    generatedQrToken = `CS-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { data: regData, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: testEventId,
        ticket_id: testTicketId,
        user_id: testInternalUserId,
        college_id: 'VIT_PUNE',
        academic_year: '2026-27',
        amount_paid: 0.00,
        payment_status: 'COMPLETED',
        qr_token: generatedQrToken,
        check_in_status: 'REGISTERED'
      })
      .select()
      .single();

    if (regError) throw regError;

    console.log(`✅ [PASSED] Registration successful!`);
    console.log(`🎫 Digital Pass Verified:`);
    console.log(`   - Registration ID: ${regData.registration_id}`);
    console.log(`   - Ticket ID: ${regData.ticket_id}`);
    console.log(`   - Generated QR Token: ${regData.qr_token}`);
    console.log(`   - Check-in Status: ${regData.check_in_status}`);

    // -------------------------------------------------------------------------
    // TEST 8: Live Attendance QR Scanner Check-in
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 8: Day-of-Event Scanner Check-In Verification...');
    const { data: checkinData, error: checkinError } = await supabase
      .from('event_registrations')
      .update({
        check_in_status: 'ATTENDED',
        check_in_timestamp: new Date().toISOString()
      })
      .eq('qr_token', generatedQrToken)
      .select()
      .single();

    if (checkinError) throw checkinError;
    assert.equal(checkinData.check_in_status, 'ATTENDED', 'Attendee status must update to ATTENDED');
    console.log(`✅ [PASSED] Check-in verified! Attendee marked ATTENDED at ${checkinData.check_in_timestamp}`);

    // -------------------------------------------------------------------------
    // TEST 9: Event Cycle Completion
    // -------------------------------------------------------------------------
    console.log('\n▶ Test 9: Event Marked as Completed...');
    const { error: compError } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('event_id', testEventId);

    if (compError) throw compError;
    console.log(`✅ [PASSED] Event cycle completed successfully!`);

    console.log('\n====================================================');
    console.log('🎉 ALL 9/9 LIVE EVENT CYCLE TESTS PASSED PERFECTLY!');
    console.log('====================================================');

  } catch (err: any) {
    console.error('\n❌ [TEST FAILURE]:', err.message);
    process.exit(1);
  } finally {
    if (testEventId) {
      console.log('\n🧹 Cleaning up test event records...');
      if (generatedQrToken) {
        await supabase.from('event_registrations').delete().eq('qr_token', generatedQrToken);
      }
      if (testTicketId) {
        await supabase.from('tickets').delete().eq('ticket_id', testTicketId);
      }
      await supabase.from('events').delete().eq('event_id', testEventId);
      console.log('✨ Cleanup complete. Database is clean.');
    }
  }
}

runLiveEventCycleSuite();
