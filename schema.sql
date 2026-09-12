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
CREATE POLICY "改自己记忆" ON memories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "删自己记忆" ON memories FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 执行完后，去 Authentication → Email Templates
-- 确认「Log In / Magic Link」模板里包含 {{ .Token }}
-- （这是验证码占位符，默认就有）
-- ========================================

-- ========================================
-- 聊天树洞 · 画像分层 + 两层记忆
-- 依赖上面的 profiles / memories 基础表
-- ========================================

-- 6. user_profiles 表（用户画像：显式 + 聊天提取 + 行为）
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 第一层 · 显式数据（用户主动填，source=manual，永不被聊天覆盖）
  birthday TEXT,
  zodiac TEXT,
  -- 第二层 · 聊天提取（source=chat，只追加补充）
  personality_tags JSONB NOT NULL DEFAULT '[]',   -- 性格标签（累积追加）
  current_state TEXT DEFAULT '',                   -- 当前状态（每次更新覆盖）
  -- 长期记忆摘要（每次对话后覆盖更新，不堆积）
  chat_summary TEXT DEFAULT '',
  -- 第三层 · 行为统计（系统自动算，用户不用管；冗余存储便于查询）
  top_cards JSONB NOT NULL DEFAULT '[]',           -- 最常抽到的牌
  divination_count INTEGER NOT NULL DEFAULT 0,     -- 占卜总次数
  preferred_spreads JSONB NOT NULL DEFAULT '[]',   -- 偏好牌阵
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. chat_messages 表（短期记忆：最近消息）
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at DESC);

-- 8. 新表开启 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 9. RLS 策略：只能读写自己的数据
CREATE POLICY "读自己画像" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "插自己画像" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "改自己画像" ON user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "删自己画像" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "读自己聊天" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "插自己聊天" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "改自己聊天" ON chat_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "删自己聊天" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- 10. 新用户注册时自动初始化画像（触发器）
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();