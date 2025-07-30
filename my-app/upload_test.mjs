import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ACCESS_TOKEN = 'your-user-access-token';
const BUCKET = 'resumes';
const FILE_PATH = './test_upload.txt';
const DEST_NAME = 'test_upload_from_node.txt';

const fileBuffer = fs.readFileSync(FILE_PATH);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Set the session and check the user
const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
  access_token: ACCESS_TOKEN,
  refresh_token: '',
});
console.log('Session set:', sessionData, sessionError);

const { data: userData, error: userError } = await supabase.auth.getUser();
console.log('User:', userData, userError);

async function upload() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(DEST_NAME, fileBuffer, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
  } else {
    console.log('Upload success:', data);
  }
}

upload();