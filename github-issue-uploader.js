const fs = require('fs');
const path = require('path');

// Configure repository and project settings
const OWNER = 'Tlerd';
const REPO = 'Vehicles-washing-G4-5';
const PROJECT_NUMBER = 5;

// Retrieve GitHub Token
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('\x1b[31mError: GITHUB_TOKEN environment variable is not set.\x1b[0m');
  console.error('Please set it using:');
  console.error('  Windows PowerShell:  $env:GITHUB_TOKEN="your_token"');
  console.error('  Windows CMD:         set GITHUB_TOKEN=your_token');
  console.error('  Linux/macOS:         export GITHUB_TOKEN="your_token"');
  process.exit(1);
}

// Helper to make GraphQL requests
async function graphqlRequest(token, query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Node-Fetch'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

// Helper to make REST API requests
async function createIssue(token, owner, repo, title, body) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Node-Fetch'
    },
    body: JSON.stringify({ title, body })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create issue: ${res.status} ${errText}`);
  }
  return await res.json();
}

// Fetch project node ID
async function getProjectId(token, owner, number) {
  const query = `
    query($owner: String!, $number: Int!) {
      user(login: $owner) {
        projectV2(number: $number) {
          id
        }
      }
      organization(login: $owner) {
        projectV2(number: $number) {
          id
        }
      }
    }
  `;
  const data = await graphqlRequest(token, query, { owner, number });
  const projectId = (data.user && data.user.projectV2 && data.user.projectV2.id) || 
                    (data.organization && data.organization.projectV2 && data.organization.projectV2.id);
  if (!projectId) {
    throw new Error(`Project #${number} not found for owner "${owner}" in user or organization profiles.`);
  }
  return projectId;
}

// Link issue to Project V2
async function addIssueToProject(token, projectId, issueNodeId) {
  const mutation = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
  `;
  return await graphqlRequest(token, mutation, { projectId, contentId: issueNodeId });
}

// Parse Plan file for assignments
function parsePlanAssignments() {
  const planPath = path.join(__dirname, 'docs', 'superpowers', 'plans', '2026-06-26-autowash-pro-stitch-design-plan.md');
  if (!fs.existsSync(planPath)) {
    throw new Error(`Plan file not found at: ${planPath}`);
  }
  const planContent = fs.readFileSync(planPath, 'utf8');
  const assignments = {};
  
  const sections = planContent.split('### FR-');
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const titleLine = lines[0]; // e.g. "001: Đăng ký & Xác thực OTP qua Twilio"
    const frNum = titleLine.split(':')[0].trim(); // "001"
    const frId = `FR-${frNum}`;
    
    const assignmentText = lines.slice(1).join('\n').trim();
    // Keep text until the next markdown header or end
    const cleanText = assignmentText.split('\n##')[0].trim();
    assignments[frId] = cleanText;
  }
  return assignments;
}

// Main execution loop
async function run() {
  try {
    console.log('--- AutoWash Pro Issue Creator ---');
    console.log(`Repository: ${OWNER}/${REPO}`);
    console.log(`Project Number: #${PROJECT_NUMBER}`);
    
    console.log('\nFetching Project Node ID...');
    const projectId = await getProjectId(TOKEN, OWNER, PROJECT_NUMBER);
    console.log(`\x1b[32mSuccessfully resolved Project ID: ${projectId}\x1b[0m`);

    console.log('\nParsing plan assignments...');
    const assignments = parsePlanAssignments();
    console.log(`Parsed ${Object.keys(assignments).length} assignments.`);

    const resultsDir = path.join(__dirname, 'docs', 'superpowers', 'results');
    const files = fs.readdirSync(resultsDir).filter(f => f.startsWith('FR-') && f.endsWith('.md'));
    
    // Sort files to process sequentially from FR-001 to FR-013
    files.sort();

    console.log(`\nFound ${files.length} Functional Requirement specification files to upload.`);

    for (const file of files) {
      // Extract FR code from filename, e.g. "FR-001"
      const frId = file.substring(0, 6); 
      console.log(`\nProcessing ${frId} (${file})...`);

      const filePath = path.join(resultsDir, file);
      const specContent = fs.readFileSync(filePath, 'utf8');

      // Extract title from spec markdown (first heading)
      let title = specContent.split('\n')[0].replace('#', '').trim();
      // Remove "Technical Specification: " prefix if present to keep title clean
      title = title.replace('Technical Specification:', '').trim();
      
      const assignmentContent = assignments[frId] || 'No explicit task assignment found in the plan.';

      // Compose complete issue body
      const issueBody = `## 👥 Task Assignments & Pair Programming Roles
${assignmentContent}

---

## 📝 Technical Specifications & Requirements
${specContent}
`;

      console.log(`Creating issue: "${title}"...`);
      const issueResult = await createIssue(TOKEN, OWNER, REPO, title, issueBody);
      console.log(`\x1b[32mCreated Issue #${issueResult.number} (Node ID: ${issueResult.node_id})\x1b[0m`);

      console.log(`Adding Issue #${issueResult.number} to Project #${PROJECT_NUMBER}...`);
      await addIssueToProject(TOKEN, projectId, issueResult.node_id);
      console.log(`\x1b[32mSuccessfully added to Project Board!\x1b[0m`);
      
      // Prevent rapid API hits triggering secondary rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n\x1b[32;1mAll issues created and mapped successfully!\x1b[0m');

  } catch (error) {
    console.error('\n\x1b[31mExecution failed:\x1b[0m', error.message || error);
    process.exit(1);
  }
}

run();
