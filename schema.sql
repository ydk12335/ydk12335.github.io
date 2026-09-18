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

-- 11. 用户名唯一性 RPC（供注册前端预检；SECURITY DEFINER 绕过 RLS，未登录也能查）
CREATE OR REPLACE FUNCTION check_username(uname TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = uname);
$$;

-- 12. 邮箱是否已注册 RPC（供「验证码登录」分流：未注册→跳注册；已注册→才发验证码）
--     依赖触发器 handle_new_user：auth.users 每建一个用户，profiles 必有一条对应记录，
--     所以查 profiles 即可覆盖「密码注册」和「OTP 占坑」两类账号。
--     注意：参数名用 p_email 避免与列名 email 歧义（email=email 会恒真）
CREATE OR REPLACE FUNCTION check_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email);
$$;

-- 13. 注销账号 RPC（SECURITY DEFINER：删除自己的 auth.users 记录，
--     依赖所有业务表的外键 ON DELETE CASCADE 级联清空：profiles / memories /
--     user_profiles / chat_messages 等）
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
-- ========================================
-- 便签墙 · 公共便签表（2026-09-18 新增）
-- 公开便签所有人可见；私密便签仅作者本人可见
-- ========================================

-- 14. wish_notes 表（公开/私密便签）
CREATE TABLE IF NOT EXISTS wish_notes (
  id TEXT PRIMARY KEY,                 -- 前端 uid()，兼容本地
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- 作者（未登录可空）
  type TEXT NOT NULL DEFAULT 'bless',
  sub TEXT NOT NULL DEFAULT '',        -- 关系细分（couple/friend/family/crush），非关系为空
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  vis TEXT NOT NULL DEFAULT 'public' CHECK (vis IN ('public','private')),
  shade INTEGER NOT NULL DEFAULT 1 CHECK (shade IN (0,1,2)),   -- 颜色深浅档（0浅/1标准/2深），色相由类型决定
  anon BOOLEAN NOT NULL DEFAULT false,   -- 是否匿名（匿名不显示头像和名字）
  avatar TEXT NOT NULL DEFAULT '',       -- 作者头像（data URL，可空）
  x INTEGER,
  y INTEGER,
  r REAL,
  comments JSONB NOT NULL DEFAULT '[]',
  owner TEXT,                           -- 前端本地标识（未登录时区分我的便签）
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 双人共签：搭档
  partner_name TEXT NOT NULL DEFAULT '',   -- 搭档名字
  partner_avatar TEXT NOT NULL DEFAULT '', -- 搭档头像
  invite_code TEXT NOT NULL DEFAULT '',    -- 8 位邀请码（关系便签邀请搭档用）
  bind_status TEXT NOT NULL DEFAULT '',    -- 永久绑定：''=未绑定 / pending=待确认 / locked=永久绑定（谁都删不了）
  bind_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,     -- 永久绑定发起人
  bind_at TIMESTAMPTZ,                       -- 绑定搭档时间（用于显示已绑定天数）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wish_notes_vis ON wish_notes(vis, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wish_notes_user ON wish_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_wish_notes_invite ON wish_notes(invite_code) WHERE invite_code <> '';

-- 15. 开启 RLS
ALTER TABLE wish_notes ENABLE ROW LEVEL SECURITY;

-- 16. RLS 策略：公开便签所有人可读；私密便签作者+搭档可读；写只能写自己的
--     公开关系便签：未绑定搭档时仅作者可见（等待通过邀请），绑定后才公开
CREATE POLICY "读公开便签" ON wish_notes FOR SELECT USING (vis = 'public' AND (type <> 'relation' OR partner_id IS NOT NULL));
CREATE POLICY "读未绑定关系便签" ON wish_notes FOR SELECT USING (type = 'relation' AND partner_id IS NULL AND auth.uid() = user_id);
CREATE POLICY "读自己私密便签" ON wish_notes FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "插自己的便签" ON wish_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "改自己的便签" ON wish_notes FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = partner_id) WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "删自己的便签" ON wish_notes FOR DELETE USING (auth.uid() = user_id AND bind_status <> 'locked');

-- 17. 双人共签：接受邀请 RPC（SECURITY DEFINER，校验邀请码并绑定搭档）
CREATE OR REPLACE FUNCTION accept_invite(p_code TEXT, p_name TEXT DEFAULT '', p_avatar TEXT DEFAULT '')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note wish_notes%ROWTYPE;
BEGIN
  SELECT * INTO v_note FROM wish_notes WHERE invite_code = upper(p_code) AND partner_id IS NULL LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_note.user_id = auth.uid() THEN
    RETURN NULL;
  END IF;
  UPDATE wish_notes SET partner_id = auth.uid(), partner_name = p_name, partner_avatar = p_avatar, bind_at = now() WHERE id = v_note.id;
  RETURN v_note.id;
END;
$$;

-- 18. 永久绑定：删除策略重写（locked 状态谁都删不了）
DROP POLICY IF EXISTS "删自己的便签" ON wish_notes;
CREATE POLICY "删自己的便签" ON wish_notes FOR DELETE USING (auth.uid() = user_id AND bind_status <> 'locked');

-- 19. 评论同步 RPC（公开便签任何登录用户可评论；私密仅作者/搭档）
CREATE OR REPLACE FUNCTION sync_comments(p_id TEXT, p_comments JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vis TEXT;
  v_uid UUID;
BEGIN
  SELECT vis, user_id INTO v_vis, v_uid FROM wish_notes WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_vis = 'public' THEN
    UPDATE wish_notes SET comments = p_comments WHERE id = p_id;
    RETURN true;
  END IF;
  -- 私密：仅作者/搭档可更新评论
  IF auth.uid() = v_uid OR auth.uid() = (SELECT partner_id FROM wish_notes WHERE id = p_id) THEN
    UPDATE wish_notes SET comments = p_comments WHERE id = p_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- 20. 永久绑定 RPC（关系便签双人确认后 locked，谁都删不了）
-- 发起：需已有搭档，置 pending
CREATE OR REPLACE FUNCTION request_permanent_bind(p_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note wish_notes%ROWTYPE;
BEGIN
  SELECT * INTO v_note FROM wish_notes WHERE id = p_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_note.user_id <> auth.uid() AND v_note.partner_id <> auth.uid() THEN RETURN 'forbidden'; END IF;
  IF v_note.bind_status = 'locked' THEN RETURN 'locked'; END IF;
  IF v_note.partner_id IS NULL THEN RETURN 'no_partner'; END IF;
  UPDATE wish_notes SET bind_status = 'pending', bind_by = auth.uid() WHERE id = p_id;
  RETURN 'pending';
END;
$$;

-- 确认：对方（非发起人）确认后 locked
CREATE OR REPLACE FUNCTION confirm_permanent_bind(p_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note wish_notes%ROWTYPE;
BEGIN
  SELECT * INTO v_note FROM wish_notes WHERE id = p_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_note.bind_status <> 'pending' THEN RETURN 'not_pending'; END IF;
  IF v_note.bind_by = auth.uid() THEN RETURN 'self_confirm'; END IF;
  IF v_note.user_id <> auth.uid() AND v_note.partner_id <> auth.uid() THEN RETURN 'forbidden'; END IF;
  UPDATE wish_notes SET bind_status = 'locked' WHERE id = p_id;
  RETURN 'locked';
END;
$$;

-- 取消：仅发起人可取消 pending
CREATE OR REPLACE FUNCTION cancel_permanent_bind(p_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note wish_notes%ROWTYPE;
BEGIN
  SELECT * INTO v_note FROM wish_notes WHERE id = p_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_note.bind_by IS DISTINCT FROM auth.uid() THEN RETURN 'forbidden'; END IF;
  IF v_note.bind_status <> 'pending' THEN RETURN 'not_pending'; END IF;
  UPDATE wish_notes SET bind_status = '', bind_by = NULL WHERE id = p_id;
  RETURN 'cancelled';
END;
$$;

-- 20. 解除关系绑定（作者或搭档均可；永久绑定 locked 拒绝解绑）
CREATE OR REPLACE FUNCTION unbind_relation(p_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note wish_notes%ROWTYPE;
BEGIN
  SELECT * INTO v_note FROM wish_notes WHERE id = p_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_note.user_id <> auth.uid() AND v_note.partner_id <> auth.uid() THEN RETURN 'forbidden'; END IF;
  IF v_note.bind_status = 'locked' THEN RETURN 'locked'; END IF;
  UPDATE wish_notes
  SET partner_id = NULL, partner_name = '', partner_avatar = '',
      invite_code = '', bind_status = '', bind_by = NULL, bind_at = NULL
  WHERE id = p_id;
  RETURN 'unbound';
END;
$$;
