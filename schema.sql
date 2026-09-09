-- ========================================
-- 有点困 · 登录系统数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 里执行
-- ========================================

-- 1. profiles 表（用户资料，含用户名）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 新用户注册时自动创建资料（触发器）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. 记忆表
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'free',
  title TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  sig TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);

-- 4. 开启 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：只能读写自己的数据
CREATE POLICY "读自己资料" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "改自己资料" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "读自己记忆" ON memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "插自己记忆" ON memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "删自己记忆" ON memories FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 执行完后，去 Authentication → Email Templates
-- 确认「Log In / Magic Link」模板里包含 {{ .Token }}
-- （这是验证码占位符，默认就有）
-- ========================================