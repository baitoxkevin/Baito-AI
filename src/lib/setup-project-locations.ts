import { createClient } from '@supabase/supabase-js';

// 使用您的 Supabase 凭据
const supabaseUrl = 'https://aoiwrdzlichescqgnohi.supabase.co'; // 请替换为您的实际 URL
const supabaseServiceKey = 'sbp_b465d8eac8787b531fe50af6b199af1e18aadef1'; // Service Role Key

// 创建 Supabase 客户端（使用 service role key 以获得管理员权限）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function setupProjectLocationsTable() {
  try {
    console.log('Setting up project_locations table...');

    // SQL 语句创建表
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- 创建 project_locations 表
        CREATE TABLE IF NOT EXISTS project_locations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          address TEXT NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          is_primary BOOLEAN DEFAULT false,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_project_locations_project_id 
        ON project_locations(project_id);

        -- 授予权限
        GRANT ALL ON project_locations TO authenticated;
        GRANT ALL ON project_locations TO service_role;

        -- 启用 RLS
        ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;

        -- 创建 RLS 策略
        DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON project_locations;
        CREATE POLICY "Enable all operations for authenticated users" 
        ON project_locations
        FOR ALL 
        TO authenticated
        USING (true)
        WITH CHECK (true);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      // 如果 RPC 不存在，尝试直接执行
      console.log('Trying alternative method...');
      
      // 检查表是否已存在
      const { error: checkError } = await supabaseAdmin
        .from('project_locations')
        .select('id')
        .limit(1);
      
      if (checkError?.code === '42P01') {
        console.error('Table still does not exist. Please create it manually in Supabase dashboard.');
        return false;
      } else if (!checkError) {
        console.log('Table already exists!');
        return true;
      }
    }

    console.log('Table setup completed successfully!');
    
    // 验证表存在
    const { data: testData, error: testError } = await supabaseAdmin
      .from('project_locations')
      .select('*')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Table verified and working!');
      return true;
    } else {
      console.error('❌ Table verification failed:', testError);
      return false;
    }

  } catch (error) {
    console.error('Setup error:', error);
    return false;
  }
}

// 自动运行（如果直接执行此文件）
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProjectLocationsTable().then(success => {
    if (success) {
      console.log('✅ Setup completed successfully!');
    } else {
      console.log('❌ Setup failed. Please check the errors above.');
    }
  });
}