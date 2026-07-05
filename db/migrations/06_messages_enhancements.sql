CREATE TABLE IF NOT EXISTS messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
