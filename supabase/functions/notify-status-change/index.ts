import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import admin from 'npm:firebase-admin';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook payload received:", payload);

    // Only proceed if this is an UPDATE on the jobs table
    if (payload.type !== 'UPDATE' || payload.table !== 'jobs') {
      return new Response(JSON.stringify({ message: "Not a job update" }), { headers: { 'Content-Type': 'application/json' } });
    }

    const newRecord = payload.record;
    const oldRecord = payload.old_record;

    // Only send notification if the status actually changed
    if (newRecord.status === oldRecord.status) {
      return new Response(JSON.stringify({ message: "Status unchanged" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Initialize Supabase Client to fetch the user's FCM token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Assuming the user who ordered the job is stored in user_id
    const consumerId = newRecord.user_id;

    if (!consumerId) {
       return new Response(JSON.stringify({ message: "No user_id found on job" }), { headers: { 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('fcm_token')
      .eq('user_id', consumerId)
      .single();

    if (!profile || !profile.fcm_token) {
      return new Response(JSON.stringify({ message: "No FCM token for user" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Formulate the notification message
    const message = {
      notification: {
        title: 'Order Status Update',
        body: `Your FixIt order status is now: ${newRecord.status}`,
      },
      token: profile.fcm_token,
      data: {
        jobId: newRecord.job_id || '',
        status: newRecord.status
      }
    };

    // Send the push notification
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);

    return new Response(JSON.stringify({ success: true, messageId: response }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
