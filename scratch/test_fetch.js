const url = 'http://127.0.0.1:15431/rest/v1';
const key = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

async function check(name, path) {
  const res = await fetch(`${url}/${path}`, { headers });
  const data = await res.json();
  if (!res.ok) {
    console.log(`❌ FAIL [${name}]:`, res.status, data.message || data);
    return false;
  } else {
    console.log(`✅ OK   [${name}]`);
    return true;
  }
}

async function testUpdatedHooks() {
  console.log("--- Testing Updated Hook Queries ---");
  await check("useDailyWorkRecords - projects", "projects?select=id,code,name,project_type,is_deleted,project_tasks(id,name,is_deleted,project_task_assignees(member_id))&order=code.asc");
  await check("useProjects - skills", "skills?select=*&is_deleted=eq.false&order=name.asc");
  await check("useWageSummary - members", "members?select=*&order=yomigana.asc");
  await check("useWageSummary - wage_rates", "wage_rates?select=*&is_deleted=eq.false");
  await check("useWageSummary - member_wage_evaluations", "member_wage_evaluations?select=*&order=created_at.desc");
}

testUpdatedHooks();
